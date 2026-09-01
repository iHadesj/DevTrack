import { useCallback, useRef, useState } from "react";
import type { MLCEngine } from "@mlc-ai/web-llm";
import {
    createPlannerPrompt,
    createResilientPlan,
    type PlannerInput,
    type StudyPlan,
} from "../services/plannerIntelligence";

/** Reexporta os contratos para preservar os imports existentes dos componentes. */
export type {
    PlannedTask,
    PlannerContext,
    PlannerInput,
    StudyPlan,
} from "../services/plannerIntelligence";

/** Modelo pequeno e quantizado: uma escolha realista para dispositivos pessoais. */
const PLANNER_MODEL_ID = "Qwen3-0.6B-q4f16_1-MLC";

/** Estados explícitos para a interface comunicar download e geração. */
export type PlannerState =
    | "idle"
    | "downloading"
    | "ready"
    | "generating"
    | "unavailable"
    | "error";

/** Como o plano foi produzido: pelo modelo baixado ou pelas regras locais do service. */
export type PlannerMode = "ai" | "local";

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

/** Explica em uma frase por que o plano saiu sem o modelo. */
const LOCAL_MODE_REASON = IS_APPLE_MOBILE
    ? "iPhone e iPad encerram a página ao carregar o modelo, então o DevTrack planeja pelas regras locais."
    : HAS_WEBGPU
        ? "O modelo não pôde ser carregado aqui, então o DevTrack planeja pelas regras locais."
        : "Este navegador não oferece WebGPU, então o DevTrack planeja pelas regras locais.";

/**
 * Confirma que a GPU aceita o modelo antes de baixar centenas de megabytes.
 * Falhar nesta checagem é barato; falhar depois do download custa a sessão inteira.
 */
async function assertGpuSupportsModel(): Promise<void> {
    const gpu = (navigator as Navigator & { gpu?: MinimalGpu }).gpu;
    if (!gpu) throw new Error("WebGPU indisponível neste navegador.");

    const adapter = await gpu.requestAdapter();
    if (!adapter) throw new Error("Nenhuma GPU foi liberada para o navegador.");

    /** O formato q4f16_1 exige meia precisão nos shaders; sem isso o motor quebra. */
    if (!adapter.features.has("shader-f16")) {
        throw new Error("Esta GPU não oferece shader-f16, exigido pelo modelo quantizado.");
    }
}

/**
 * Carrega e usa uma única instância do WebLLM quando o aparelho permite. Em
 * qualquer outro caso o plano sai pelo service, que já funciona sem modelo algum.
 */
export function useLocalPlanner() {
    const engineRef = useRef<MLCEngine | null>(null);
    const [state, setState] = useState<PlannerState>("idle");
    const [mode, setMode] = useState<PlannerMode>(CAN_RUN_MODEL ? "ai" : "local");
    const [status, setStatus] = useState(
        CAN_RUN_MODEL
            ? "Se o assistente ainda não foi baixado, o primeiro uso precisa de internet."
            : LOCAL_MODE_REASON,
    );
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    /** Mantido no retorno para não quebrar os componentes que já consultam a flag. */
    const isSupported = CAN_RUN_MODEL;

    /** Fecha o ciclo com um plano válido sempre que o modelo não puder participar. */
    const buildLocalPlan = useCallback(
        (input: PlannerInput, reason: string): StudyPlan => {
            setMode("local");
            setError(null);
            setGenerationProgress(100);
            setState("ready");
            setStatus(`${reason} Confira antes de salvar.`);

            /** Texto vazio faz o service usar apenas o plano determinístico. */
            return createResilientPlan("", input);
        },
        [],
    );

    /** Baixa ou recupera o modelo do cache e preserva o motor em memória. */
    const getEngine = useCallback(async (): Promise<MLCEngine> => {
        if (!CAN_RUN_MODEL) {
            setState("unavailable");
            throw new Error(LOCAL_MODE_REASON);
        }

        if (engineRef.current) return engineRef.current;

        setError(null);
        setState("downloading");
        setDownloadProgress(0);
        setStatus("Conferindo se esta GPU aceita o modelo...");

        /** A checagem vem antes do download para não gastar rede à toa. */
        await assertGpuSupportsModel();

        setStatus(
            navigator.onLine
                ? "Baixando ou recuperando o modelo do cache..."
                : "Sem internet: tentando abrir um modelo já salvo neste aparelho...",
        );

        /** O import dinâmico evita carregar os 6 MB do motor na abertura do app. */
        const webllm = await import("@mlc-ai/web-llm");
        const engine = await webllm.CreateMLCEngine(PLANNER_MODEL_ID, {
            initProgressCallback: (progress) => {
                /** WebLLM entrega 0 a 1; a barra visual trabalha de 0 a 100. */
                const percentage = Math.round(
                    Math.min(1, Math.max(0, progress.progress)) * 100,
                );
                setDownloadProgress(percentage);
                setStatus(progress.text);
            },
        });

        engineRef.current = engine;
        setDownloadProgress(100);
        setMode("ai");
        setState("ready");
        setStatus("Assistente local pronto. Seus pedidos não saem do aparelho.");
        return engine;
    }, []);

    /**
     * Gera o plano e nunca deixa a pessoa sem resposta: se o motor não existe,
     * não carrega ou falha no meio, o planejamento determinístico assume.
     */
    const createPlan = useCallback(
        async (input: PlannerInput): Promise<StudyPlan> => {
            if (!CAN_RUN_MODEL) return buildLocalPlan(input, LOCAL_MODE_REASON);

            let engine: MLCEngine;

            try {
                engine = await getEngine();
            } catch (caughtError) {
                const detail =
                    caughtError instanceof Error
                        ? caughtError.message
                        : "Motor indisponível.";
                return buildLocalPlan(input, `Assistente não carregou (${detail}).`);
            }

            try {
                setError(null);
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
                    /** Quatro etapas detalhadas cabem sem prolongar demais a geração. */
                    max_tokens: 800,
                    /** Evita gastar tempo com tokens internos invisíveis do Qwen3. */
                    extra_body: { enable_thinking: false },
                    stream: true,
                });

                let content = "";
                let reachedTimeLimit = false;

                /**
                 * Se o dispositivo for lento, o plano local assume após um minuto.
                 * O modelo continua sendo útil, mas nunca vira um bloqueio infinito.
                 */
                const generationTimeout = window.setTimeout(() => {
                    reachedTimeLimit = true;
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

                /** Mesmo JSON incompleto termina em um plano válido por causa do service. */
                const plan = createResilientPlan(content, input);
                setGenerationProgress(100);
                setMode("ai");
                setState("ready");
                setStatus(
                    reachedTimeLimit || !content.trim()
                        ? "Plano concluído pelo modo seguro. Revise antes de salvar."
                        : "Plano interpretado e revisado. Confira antes de salvar.",
                );
                return plan;
            } catch (caughtError) {
                const detail =
                    caughtError instanceof Error
                        ? caughtError.message
                        : "Falha na geração.";
                return buildLocalPlan(input, `A geração falhou (${detail}).`);
            }
        },
        [buildLocalPlan, getEngine],
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
