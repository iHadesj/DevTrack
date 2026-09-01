import type { PlannerContext } from "../hooks/useLocalPlanner";
import type { Area, NewTask } from "../interfaces";
import type { AppView } from "./Sidebar";
import { Modal } from "./Modal";
import { StudyPlanner } from "./StudyPlanner";

/** Personalização por aba: a mesma IA assume um papel e uma categoria coerentes. */
const assistantByView: Record<
    AppView,
    {
        context: PlannerContext;
        area: Area;
        heading: string;
        placeholder: string;
    }
> = {
    Hoje: {
        context: "today",
        area: "pessoal",
        heading: "Organizar meu dia",
        placeholder: "Ex.: tenho aula, estágio e preciso revisar React hoje",
    },
    Tarefas: {
        context: "tasks",
        area: "pessoal",
        heading: "Quebrar objetivo em tarefas",
        placeholder: "Ex.: terminar meu projeto de portfólio",
    },
    Estudos: {
        context: "study",
        area: "faculdade",
        heading: "Criar plano de estudo",
        placeholder: "Ex.: aprender banco de dados para a prova",
    },
    Estágio: {
        context: "internship",
        area: "estagio",
        heading: "Planejar próximos passos",
        placeholder: "Ex.: entender e corrigir o fluxo de autenticação",
    },
};

type AssistantModalProps = {
    activeView: AppView;
    onClose: () => void;
    onCreateTask: (task: NewTask) => Promise<void>;
};

/** Modal global que adapta o assistente à aba aberta sem duplicar o modelo na memória. */
export function AssistantModal({ activeView, onClose, onCreateTask }: AssistantModalProps) {
    const configuration = assistantByView[activeView];

    return (
        <Modal
            title={`Assistente · ${activeView}`}
            description="As sugestões só viram tarefas depois da sua aprovação."
            onClose={onClose}
        >
            <StudyPlanner
                embedded
                context={configuration.context}
                taskArea={configuration.area}
                heading={configuration.heading}
                objectivePlaceholder={configuration.placeholder}
                onCreateTask={onCreateTask}
            />
        </Modal>
    );
}
