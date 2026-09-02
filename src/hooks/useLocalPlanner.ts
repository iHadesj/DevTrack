import { useCallback, useRef, useState } from "react";
import type { MLCEngine } from "@mlc-ai/web-llm";
import {
    createPlannerPrompt,
    createResilientPlan,
    type PlannerInput,
    type StudyPlan,
} from "../services/plannerIntelligence";
import { requestRemotePlanText } from "../services/remotePlanner";

/** Reexporta os contratos para preservar os imports existentes dos componentes. */
export type {
    PlannedTask,
    PlannerContext,
    PlannerInput,
    StudyPlan,
} from "../services/plannerIntelligence";

/**
 * Modelo pequeno e quantizado: uma escolha realista para dispositivos pessoais.
 *
 * O Qwen3-1.7B foi testado aqui e não subiu — a GPU deste aparelho não tem os
 * ~2 GB de VRAM que ele pede, contra ~1,4 GB deste. Enquanto o alvo for hardware
 * pessoal comum, o 0.6B é o teto real, e o preço dele está documentado: escreve
 * gramática plausível com vocabulário inventado ("casa primam" em vez de "casa
 * da prima") e às vezes repete a mesma frase em campos diferentes. O tratamento
 * disso vive no validador, não aqui.
 */
const PLANNER_MODEL_F16 = "Qwen3-0.6B-q4f16_1-MLC";

/**
 * A mesma rede em precisão simples. Baixa mais bytes, porém roda em GPU sem
 * `shader-f16` — o caso de boa parte dos vídeos integrados.
 */
const PLANNER_MODEL_F32 = "Qwen3-0.6B-q4f32_1-MLC";

/** Estados explícitos para a interface comunicar download e geração. */
export type PlannerState =
    | "idle"
    | "downloading"
    | "ready"
    | "generating"
    | "unavailable"
    | "error";

/**
 * Quem produziu o plano:
 * - `ai`    modelo baixado, rodando dentro do aparelho e sem enviar nada;
 * - `cloud` IA remota chamada pela função serverless, exige internet;
 * - `local` regras determinísticas do próprio DevTrack, sempre disponíveis;
 * - `mixed` a IA acertou parte das etapas e o plano local completou o restante.
 */
export type PlannerMode = "ai" | "cloud" | "local" | "mixed";

/** Tipos mínimos do WebGPU; o projeto não depende do pacote @webgpu/types. */
type MinimalGpuAdapter = { features: { has(feature: string): boolean } };
type MinimalGpu = { requestAdapter(): Promise<MinimalGpuAdapter | null> };

/**
 * Todo navegador de iPhone e iPad roda sobre WebKit, que encerra o processo da
 * página ao carregar centenas de megabytes na GPU. Isso não gera exceção: a aba
 * simplesmente morre, então a única defesa possível é não iniciar o download.
 */
function detectAppleMobile(): boolean {
    if (typeof navigator === "undefined") return false;

    const userAgent = navigator.userAgent;

    /** iPadOS 13+ se declara "Macintosh"; a quantidade de toques entrega o disfarce. */
    return (
        /iPad|iPhone|iPod/.test(userAgent) ||
        (userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1)
    );
}

const HAS_WEBGPU =
    typeof navigator !== "undefined" &&
    "gpu" in (navigator as Navigator & { gpu?: unknown });
const IS_APPLE_MOBILE = detectAppleMobile();

/** O download só é liberado quando existe WebGPU e o aparelho aguenta o modelo. */
const CAN_RUN_MODEL = HAS_WEBGPU && !IS_APPLE_MOBILE;

/**
 * Um download de centenas de megabytes pode parar de progredir sem lançar erro:
 * proxy corporativo, rede que derruba a conexão, CDN bloqueada. Sem esta guarda
 * o `state` fica em "downloading" para sempre e o botão nunca reabilita.
 */
const DOWNLOAD_STALL_MS = 45_000;

/**
 * Falha quando o progresso para de chegar, não quando o download demora.
 * Um modelo grande em rede lenta continua válido enquanto avançar.
 */
function rejectOnStall(getLastProgressAt: () => number): {
    promise: Promise<never>;
    dispose: () => void;
} {
    let timer = 0;
    const promise = new Promise<never>((_, reject) => {
        timer = window.setInterval(() => {
            if (Date.now() - getLastProgressAt() < DOWNLOAD_STALL_MS) return;

            reject(
                new Error(
                    "o download do modelo travou (nenhum progresso em 45s) — rede, proxy ou bloqueio ao huggingface.co",
                ),
            );
        }, 5_000);
    });

    return { promise, dispose: () => window.clearInterval(timer) };
}

/** Explica em uma frase por que o modelo local está fora deste aparelho. */
const NO_LOCAL_MODEL_REASON = IS_APPLE_MOBILE
    ? "iPhone e iPad encerram a página ao carregar o modelo local."
    : "Este navegador não oferece WebGPU para rodar o modelo local.";

/**
 * Escolhe o modelo que esta GPU consegue rodar, antes de baixar centenas de
 * megabytes. Decidir aqui é barato; descobrir depois do download custa a sessão.
 */
async function pickPlannerModel(): Promise<string> {
    const gpu = (navigator as Navigator & { gpu?: MinimalGpu }).gpu;
    if (!gpu) throw new Error("WebGPU indisponível neste navegador.");

    const adapter = await gpu.requestAdapter();
    if (!adapter) throw new Error("Nenhuma GPU foi liberada para o navegador.");

    /**
     * O formato q4f16_1 exige meia precisão nos shaders. Faltando o recurso, a
     * saída é o build q4f32_1 em vez de abrir mão do modelo local.
     */
    return adapter.features.has("shader-f16") ? PLANNER_MODEL_F16 : PLANNER_MODEL_F32;
}

/**
 * Planeja em três degraus, sempre nesta ordem: modelo local, IA na nuvem e regras
 * determinísticas. Cada degrau só é tentado quando o anterior não pôde responder,
 * então a pessoa nunca fica sem plano — muda apenas quem o escreveu.
 */
export function useLocalPlanner() {
    const engineRef = useRef<MLCEngine | null>(null);
    const [state, setState] = useState<PlannerState>(
        CAN_RUN_MODEL ? "idle" : "unavailable",
    );
    const [mode, setMode] = useState<PlannerMode>(CAN_RUN_MODEL ? "ai" : "cloud");
    const [status, setStatus] = useState(
        CAN_RUN_MODEL
            ? "Se o assistente ainda não foi baixado, o primeiro uso precisa de internet."
            : `${NO_LOCAL_MODEL_REASON} Com internet, o plano vem da IA na nuvem.`,
    );
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [generationProgress, setGenerationProgress] = useState(0);
    /**
     * Por que o degrau local não respondeu. Fica separado do `status` porque o
     * plano ainda chega pelos degraus seguintes: o pedido não falhou, o modelo sim.
     */
    const [error, setError] = useState<string | null>(
        CAN_RUN_MODEL ? null : NO_LOCAL_MODEL_REASON,
    );

    /** Mantido no retorno para não quebrar os componentes que já consultam a flag. */
    const isSupported = CAN_RUN_MODEL;

    /** Baixa ou recupera o modelo do cache e preserva o motor em memória. */
    const getEngine = useCallback(async (): Promise<MLCEngine> => {
        if (!CAN_RUN_MODEL) throw new Error(NO_LOCAL_MODEL_REASON);
        if (engineRef.current) return engineRef.current;

        setState("downloading");
        setDownloadProgress(0);
        setStatus("Conferindo se esta GPU aceita o modelo...");

        /** A escolha vem antes do download para não gastar rede à toa. */
        const modelId = await pickPlannerModel();

        setStatus(
            navigator.onLine
                ? "Baixando ou recuperando o modelo do cache..."
                : "Sem internet: tentando abrir um modelo já salvo neste aparelho...",
        );

        /** O import dinâmico evita carregar os 6 MB do motor na abertura do app. */
        const webllm = await import("@mlc-ai/web-llm");

        /** O relógio da guarda reinicia a cada sinal de vida do download. */
        let lastProgressAt = Date.now();
        const stall = rejectOnStall(() => lastProgressAt);

        let engine: MLCEngine;
        try {
            engine = await Promise.race([
                webllm.CreateMLCEngine(modelId, {
                    initProgressCallback: (progress) => {
                        lastProgressAt = Date.now();
                        /** WebLLM entrega 0 a 1; a barra visual trabalha de 0 a 100. */
                        const percentage = Math.round(
                            Math.min(1, Math.max(0, progress.progress)) * 100,
                        );
                        setDownloadProgress(percentage);
                        setStatus(progress.text);
                    },
                }),
                stall.promise,
            ]);
        } finally {
            /** Sem isto o intervalo sobrevive ao sucesso e derruba o próximo pedido. */
            stall.dispose();
        }

        engineRef.current = engine;
        setDownloadProgress(100);
        setStatus("Assistente local pronto. Seus pedidos não saem do aparelho.");
        return engine;
    }, []);

    /** Primeiro degrau: gera o texto cru dentro do aparelho, sem rede. */
    const runLocalModel = useCallback(
        async (input: PlannerInput): Promise<string> => {
            const engine = await getEngine();

            setState("generating");
            setGenerationProgress(4);
            setStatus("Interpretando intenção, assunto e requisitos...");

            const chunks = await engine.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content:
                            "Você é um planejador geral. Responda exclusivamente em português brasileiro e em JSON, sem presumir que o assunto seja tecnologia.",
                    },
                    { role: "user", content: createPlannerPrompt(input) },
                ],
                /** Baixa aleatoriedade ajuda um modelo pequeno a seguir o contrato. */
                temperature: 0.1,
                repetition_penalty: 1.05,
                /**
                 * O validador exige 4 etapas com `reason` de 28+ e `howToStudy`
                 * de 70+ caracteres, mais introdução e 3 dicas — tudo em JSON e
                 * em português. Com 800 o JSON terminava cortado e o `JSON.parse`
                 * derrubava o plano inteiro para o fallback.
                 */
                max_tokens: 1800,
                /** Evita gastar tempo com tokens internos invisíveis do Qwen3. */
                extra_body: { enable_thinking: false },
                stream: true,
            });

            let content = "";

            /**
             * Se o dispositivo for lento, a geração é interrompida após um minuto.
             * O que já saiu ainda é aproveitado pela validação do service.
             */
            const generationTimeout = window.setTimeout(() => {
                setStatus("Finalizando com a validação local do DevTrack...");
                void engine.interruptGenerate().catch(() => undefined);
            }, 60_000);

            try {
                for await (const chunk of chunks) {
                    content += chunk.choices[0]?.delta.content ?? "";

                    /** Como o total é desconhecido, 100% fica reservado à validação. */
                    const estimatedProgress = Math.min(
                        94,
                        8 + Math.round(content.length / 25),
                    );
                    setGenerationProgress(estimatedProgress);

                    if (estimatedProgress < 30) {
                        setStatus("Separando objetivo e requisitos...");
                    } else if (estimatedProgress < 65) {
                        setStatus("Montando etapas e critérios de conclusão...");
                    } else {
                        setStatus("Removendo repetições e conferindo o contexto...");
                    }
                }
            } finally {
                window.clearTimeout(generationTimeout);
            }

            return content;
        },
        [getEngine],
    );

    /** Segundo degrau: a função serverless fala com a IA remota e devolve o texto. */
    const runCloudModel = useCallback(
        async (input: PlannerInput): Promise<string> => {
            if (!navigator.onLine) {
                throw new Error("Sem internet para consultar a IA na nuvem.");
            }

            setState("generating");
            setGenerationProgress(35);
            setStatus("Consultando a IA na nuvem...");

            const text = await requestRemotePlanText(input);

            setGenerationProgress(94);
            return text;
        },
        [],
    );

    /**
     * Orquestra os degraus e encerra sempre em um plano válido. O `mode` conta
     * à interface quem realmente escreveu o resultado exibido.
     */
    const createPlan = useCallback(
        async (input: PlannerInput): Promise<StudyPlan> => {
            setError(CAN_RUN_MODEL ? null : NO_LOCAL_MODEL_REASON);
            setGenerationProgress(0);

            /** Guarda o motivo de cada degrau recusado para explicar o desfecho. */
            const skippedReasons: string[] = [];

            if (CAN_RUN_MODEL) {
                try {
                    const content = await runLocalModel(input);

                    if (content.trim()) {
                        const plan = createResilientPlan(content, input);
                        setGenerationProgress(100);
                        setState("ready");

                        /**
                         * O modelo ter respondido não significa que a resposta dele
                         * está na tela: se o validador recusou, quem escreveu as
                         * etapas foi o DevTrack, e a etiqueta precisa dizer isso.
                         */
                        if (plan.tasksOrigin === "ai" || plan.tasksOrigin === "mixed") {
                            setMode(plan.tasksOrigin === "ai" ? "ai" : "mixed");
                            setStatus(
                                plan.tasksOrigin === "ai"
                                    ? "Plano criado no seu aparelho. Confira antes de salvar."
                                    : "Plano criado no seu aparelho; as etapas que faltaram foram completadas pelas regras do DevTrack.",
                            );
                            /** Em plano misto o aviso é informativo, não erro. */
                            if (plan.rejectionReason) {
                                console.info("[DevTrack] plano misto:", plan.rejectionReason);
                            }
                            return plan;
                        }

                        console.warn(
                            "[DevTrack] etapas da IA recusadas:",
                            plan.rejectionReason,
                        );
                        setMode("local");
                        setStatus(
                            "O modelo local respondeu, mas as etapas foram recusadas na validação. Mostrando o plano das regras do DevTrack.",
                        );
                        setError(`Etapas da IA recusadas: ${plan.rejectionReason}`);
                        return plan;
                    }

                    skippedReasons.push("o modelo local não produziu texto");
                    setError("O modelo local rodou, mas devolveu texto vazio.");
                } catch (caughtError) {
                    /** O objeto cru vai para o console: a mensagem sozinha perde a pilha. */
                    console.error("[DevTrack] modelo local falhou:", caughtError);

                    const reason =
                        caughtError instanceof Error
                            ? caughtError.message
                            : "o modelo local falhou";

                    skippedReasons.push(reason);
                    setError(`Modelo local indisponível: ${reason}`);
                }
            } else {
                skippedReasons.push(NO_LOCAL_MODEL_REASON);
            }

            try {
                const content = await runCloudModel(input);
                const plan = createResilientPlan(content, input);
                setGenerationProgress(100);
                setState("ready");

                /** Mesma honestidade do degrau local: etiqueta segue a origem real. */
                if (plan.tasksOrigin === "ai" || plan.tasksOrigin === "mixed") {
                    setMode(plan.tasksOrigin === "ai" ? "cloud" : "mixed");
                    setStatus(
                        plan.tasksOrigin === "ai"
                            ? "Plano criado pela IA na nuvem. Confira antes de salvar."
                            : "Plano criado pela IA na nuvem; as etapas que faltaram foram completadas pelas regras do DevTrack.",
                    );
                    return plan;
                }

                console.warn("[DevTrack] etapas da nuvem recusadas:", plan.rejectionReason);
                setMode("local");
                setStatus(
                    "A IA na nuvem respondeu, mas as etapas foram recusadas na validação. Mostrando o plano das regras do DevTrack.",
                );
                setError(`Etapas da nuvem recusadas: ${plan.rejectionReason}`);
                return plan;
            } catch (caughtError) {
                console.error("[DevTrack] IA na nuvem falhou:", caughtError);

                skippedReasons.push(
                    caughtError instanceof Error
                        ? caughtError.message
                        : "a IA na nuvem falhou",
                );
            }

            /** Último degrau: texto vazio faz o service usar só o plano determinístico. */
            const plan = createResilientPlan("", input);
            setMode("local");
            setGenerationProgress(100);
            setState("ready");
            setStatus(
                `Plano montado pelas regras do DevTrack (${skippedReasons.join("; ")}). Confira antes de salvar.`,
            );
            return plan;
        },
        [runCloudModel, runLocalModel],
    );

    return {
        state,
        mode,
        status,
        error,
        downloadProgress,
        generationProgress,
        isSupported,
        isModelReady: Boolean(engineRef.current),
        createPlan,
    };
}
