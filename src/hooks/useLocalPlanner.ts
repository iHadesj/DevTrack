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

/**
 * Carrega e usa uma única instância do WebLLM. Toda interpretação e validação
 * ficam no service, deixando este hook responsável apenas pelo ciclo assíncrono.
 */
export function useLocalPlanner() {
    const engineRef = useRef<MLCEngine | null>(null);
    const [state, setState] = useState<PlannerState>("idle");
    const [status, setStatus] = useState(
        "Se o assistente ainda não foi baixado, o primeiro uso precisa de internet.",
    );
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    /** Verifica WebGPU sem depender dos tipos experimentais do navegador. */
    const isSupported =
        typeof navigator !== "undefined" &&
        "gpu" in (navigator as Navigator & { gpu?: unknown });

    /** Baixa ou recupera o modelo do cache e preserva o motor em memória. */
    const getEngine = useCallback(async (): Promise<MLCEngine> => {
        if (!isSupported) {
            setState("unavailable");
            throw new Error("Este navegador não oferece WebGPU para rodar a IA local.");
        }

        if (engineRef.current) return engineRef.current;

        try {
            setError(null);
            setState("downloading");
            setDownloadProgress(0);
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
            setState("ready");
            setStatus("Assistente local pronto. Seus pedidos não saem do aparelho.");
            return engine;
        } catch (caughtError) {
            const message =
                caughtError instanceof Error
                    ? caughtError.message
                    : "Não foi possível carregar a IA local.";
            setError(message);
            setState("error");
            throw caughtError;
        }
    }, [isSupported]);

    /**
     * Gera texto com o modelo e sempre passa o resultado pelo planejador seguro.
     * O callback é estável para o Context não provocar renders desnecessários.
     */
    const createPlan = useCallback(
        async (input: PlannerInput): Promise<StudyPlan> => {
            const engine = await getEngine();

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
                setState("ready");
                setStatus(
                    reachedTimeLimit || !content.trim()
                        ? "Plano concluído pelo modo seguro. Revise antes de salvar."
                        : "Plano interpretado e revisado. Confira antes de salvar.",
                );
                return plan;
            } catch (caughtError) {
                const message =
                    caughtError instanceof Error
                        ? caughtError.message
                        : "Não foi possível gerar o plano local.";
                setError(message);
                setGenerationProgress(0);
                setState("error");
                throw caughtError;
            }
        },
        [getEngine],
    );

    return {
        state,
        status,
        error,
        downloadProgress,
        generationProgress,
        isSupported,
        isModelReady: Boolean(engineRef.current),
        createPlan,
    };
}
