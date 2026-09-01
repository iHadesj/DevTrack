import type { PlannerInput } from "./plannerIntelligence";

/** Erro próprio para o hook distinguir falha da nuvem de falha do modelo local. */
export class RemotePlannerError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RemotePlannerError";
    }
}

/** Rede móvel oscila; depois disso o plano determinístico assume o lugar. */
const REQUEST_TIMEOUT_MS = 25_000;

/**
 * Conversa com a função serverless do próprio domínio, nunca direto com o provedor.
 * A chave da IA fica no servidor da Vercel e jamais chega ao navegador.
 */
export async function requestRemotePlanText(input: PlannerInput): Promise<string> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch("/api/plan", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(input),
            signal: controller.signal,
        });

        if (!response.ok) {
            const detail = (await response.json().catch(() => null)) as {
                error?: string;
            } | null;

            throw new RemotePlannerError(
                detail?.error ?? `A IA na nuvem respondeu ${response.status}.`,
            );
        }

        const data = (await response.json()) as { text?: string };
        if (!data.text || !data.text.trim()) {
            throw new RemotePlannerError("A IA na nuvem devolveu uma resposta vazia.");
        }

        return data.text;
    } catch (caughtError) {
        if (caughtError instanceof RemotePlannerError) throw caughtError;

        /** `abort` é o caso comum em rede ruim e merece uma mensagem honesta. */
        const isTimeout =
            caughtError instanceof DOMException && caughtError.name === "AbortError";

        throw new RemotePlannerError(
            isTimeout
                ? "A IA na nuvem demorou demais para responder."
                : "Não foi possível falar com a IA na nuvem.",
        );
    } finally {
        window.clearTimeout(timeout);
    }
}
