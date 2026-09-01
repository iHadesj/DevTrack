import {
    createPlannerPrompt,
    type PlannerContext,
    type PlannerInput,
} from "../src/services/plannerIntelligence";

/**
 * Função serverless da Vercel. Ela recebe a intenção já estruturada, monta o mesmo
 * prompt usado pelo modelo local e conversa com o Gemini.
 *
 * A chave da API vive somente aqui, em `process.env`. Nada disso é enviado ao
 * navegador, ao contrário de qualquer valor exposto por `import.meta.env`.
 */

/** O modelo é configurável para trocar de versão sem novo deploy de código. */
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/** Um objetivo real cabe folgado aqui; textos maiores só serviriam para abuso. */
const MAX_OBJECTIVE_LENGTH = 400;
const VALID_CONTEXTS: PlannerContext[] = ["today", "tasks", "study", "internship"];

/** Resposta JSON curta, já que o cliente só precisa do texto ou do motivo da falha. */
function json(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });
}

/**
 * Aceita apenas campos conhecidos e dentro de faixa. Como o prompt é montado no
 * servidor, o endpoint não vira um proxy de IA aberto para qualquer texto.
 */
function parseInput(raw: unknown): PlannerInput | null {
    if (typeof raw !== "object" || raw === null) return null;

    const candidate = raw as Record<string, unknown>;
    const objective =
        typeof candidate.objective === "string" ? candidate.objective.trim() : "";

    if (!objective || objective.length > MAX_OBJECTIVE_LENGTH) return null;

    const dailyMinutes = Number(candidate.dailyMinutes);
    if (!Number.isFinite(dailyMinutes) || dailyMinutes < 10 || dailyMinutes > 480) {
        return null;
    }

    /** Só uma data no formato do input HTML passa; o resto é descartado. */
    const deadline =
        typeof candidate.deadline === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(candidate.deadline)
            ? candidate.deadline
            : undefined;

    const context = VALID_CONTEXTS.includes(candidate.context as PlannerContext)
        ? (candidate.context as PlannerContext)
        : "study";

    return {
        objective,
        deadline,
        dailyMinutes: Math.round(dailyMinutes),
        context,
    };
}

/** Cota gratuita oscila: estes códigos costumam passar numa tentativa seguinte. */
const RETRIABLE_STATUS = new Set([429, 503]);
const MAX_RETRIES = 2;
/** Sobrecarga responde em menos de um segundo, então esperar pouco custa pouco. */
const RETRY_DELAY_MS = 800;

/** Isolada do handler justamente para poder ser repetida sem duplicar o corpo. */
function callProvider(apiKey: string, input: PlannerInput): Promise<Response> {
    return fetch(GEMINI_ENDPOINT, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
            systemInstruction: {
                parts: [
                    {
                        text: "Você é um planejador geral. Responda exclusivamente em português brasileiro e apenas com JSON válido, sem presumir que o assunto seja tecnologia.",
                    },
                ],
            },
            contents: [{ role: "user", parts: [{ text: createPlannerPrompt(input) }] }],
            generationConfig: {
                /** Baixa aleatoriedade mantém o modelo preso ao contrato de JSON. */
                temperature: 0.2,
                maxOutputTokens: 2048,
                /** Pede JSON direto, poupando a limpeza de Markdown no cliente. */
                responseMimeType: "application/json",
                /**
                 * O Flash é um modelo de raciocínio e gastaria os tokens de saída
                 * pensando. A geração 3 controla isso por nível, não por orçamento:
                 * `thinkingBudget` é recusado com 400 INVALID_ARGUMENT.
                 */
                thinkingConfig: { thinkingLevel: "low" },
            },
        }),
    });
}

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== "POST") return json({ error: "Use POST." }, 405);

    const apiKey = process.env.GEMINI_API_KEY;

    /** Sem chave o app não quebra: o cliente cai para o planejamento determinístico. */
    if (!apiKey) {
        return json({ error: "IA na nuvem não configurada neste deploy." }, 503);
    }

    let payload: unknown;
    try {
        payload = await request.json();
    } catch {
        return json({ error: "Corpo da requisição inválido." }, 400);
    }

    const input = parseInput(payload);
    if (!input) return json({ error: "Pedido fora do formato aceito." }, 400);

    try {
        let response = await callProvider(apiKey, input);

        /** Insistir aqui evita cair no plano genérico por soluço de demanda. */
        for (
            let attempt = 1;
            attempt <= MAX_RETRIES && RETRIABLE_STATUS.has(response.status);
            attempt += 1
        ) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
            response = await callProvider(apiKey, input);
        }

        if (!response.ok) {
            const detail = await response.text();
            return json(
                {
                    error: `O provedor respondeu ${response.status}.`,
                    detail: detail.slice(0, 300),
                },
                502,
            );
        }

        const data = (await response.json()) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text =
            data.candidates?.[0]?.content?.parts
                ?.map((part) => part.text ?? "")
                .join("") ?? "";

        /** O texto cru volta ao cliente porque a validação vive no service compartilhado. */
        return json({ text }, 200);
    } catch (caughtError) {
        const detail =
            caughtError instanceof Error ? caughtError.message : "Falha ao chamar a IA.";
        return json({ error: detail }, 502);
    }
}
