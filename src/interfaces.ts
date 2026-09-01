/**
 * Áreas que organizam a rotina do aluno. Usar uma união evita textos soltos
 * como "facul" e "faculdade" representando a mesma coisa no banco.
 */
export type Area = "faculdade" | "estagio" | "pessoal";

/** Estados possíveis para uma tarefa no fluxo mais simples do MVP. */
export type TaskStatus = "pendente" | "fazendo" | "concluida";

/** Indica se a mudança já foi enviada a uma API futura. */
export type SyncStatus = "local" | "pendente" | "erro";

/** Modelo de uma tarefa gravada localmente no IndexedDB. */
export interface Task {
    id: string;
    title: string;
    area: Area;
    status: TaskStatus;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
    syncStatus: SyncStatus;
}

/** Registro de uma sessão de foco/estudo finalizada pelo usuário. */
export interface StudySession {
    id: string;
    subject: string;
    minutes: number;
    date: string;
    /** Links de materiais usados na sessão: cada item é uma URL independente. */
    studyLinks: string[];
    /** Resumo livre: descobertas, dúvidas ou próximos passos do estudo. */
    notes?: string;
    createdAt: string;
    syncStatus: SyncStatus;
}

/** Pequeno diário para o estagiário guardar entregas, aprendizados e bloqueios. */
export interface InternshipEntry {
    id: string;
    title: string;
    learning: string;
    blocker?: string;
    date: string;
    createdAt: string;
    syncStatus: SyncStatus;
}

/** Operação que uma futura API deverá receber quando houver conexão. */
export interface SyncOperation {
    id: string;
    entity: "task" | "studySession" | "internshipEntry";
    entityId: string;
    action: "upsert";
    createdAt: string;
}

/** Dados que chegam do formulário de criação de tarefa, antes do banco completar os metadados. */
export type NewTask = Pick<Task, "title" | "area" | "dueDate">;

/** Dados digitados ao registrar tempo de estudo. */
export type NewStudySession = Pick<
    StudySession,
    "subject" | "minutes" | "date" | "studyLinks" | "notes"
>;

/** Dados digitados ao registrar o dia de estágio. */
export type NewInternshipEntry = Pick<InternshipEntry, "title" | "learning" | "blocker" | "date">;
