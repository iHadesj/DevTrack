import { createContext, useContext, type ReactNode } from "react";
import { useLocalPlanner } from "../hooks/useLocalPlanner";

/** Inferir pelo hook evita duplicar manualmente o contrato do assistente. */
type AssistantContextValue = ReturnType<typeof useLocalPlanner>;

const AssistantContext = createContext<AssistantContextValue | null>(null);

/**
 * Mantém uma única IA acima das telas. Trocar de aba não descarta o modelo
 * nem reinicia o progresso de download.
 */
export function AssistantProvider({ children }: { children: ReactNode }) {
    const assistant = useLocalPlanner();

    return (
        <AssistantContext.Provider value={assistant}>
            {children}
        </AssistantContext.Provider>
    );
}

/** Expõe a instância global e avisa cedo se o Provider estiver ausente. */
export function useAssistant() {
    const context = useContext(AssistantContext);

    if (!context) {
        throw new Error("useAssistant precisa estar dentro de AssistantProvider.");
    }

    return context;
}
