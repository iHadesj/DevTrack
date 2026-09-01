import { useCallback, useEffect, useMemo, useState } from "react";
import type {
    InternshipEntry,
    NewInternshipEntry,
    NewStudySession,
    NewTask,
    StudySession,
    Task,
    TaskStatus,
} from "../interfaces";
import {
    getInternshipEntries,
    getPendingSyncCount,
    getStudySessions,
    getTasks,
    saveInternshipEntry,
    saveStudySession,
    saveTask,
} from "../services/offlineDatabase";

/** Gera uma data no formato YYYY-MM-DD para preencher campos `<input type="date">`. */
function getToday(): string {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60_000;
    return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}

/**
 * Centraliza a regra de negócio do DevTrack. A página só pede uma ação ao hook;
 * o hook persiste primeiro no IndexedDB e depois atualiza a tela.
 */
export function useDevTrack() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [studySessions, setStudySessions] = useState<StudySession[]>([]);
    const [internshipEntries, setInternshipEntries] = useState<InternshipEntry[]>([]);
    const [pendingSyncCount, setPendingSyncCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    /** Carrega todas as tabelas uma única vez quando o componente que usa o hook monta. */
    const loadData = useCallback(async () => {
        setIsLoading(true);

        const [storedTasks, storedSessions, storedEntries, queuedChanges] = await Promise.all([
            getTasks(),
            getStudySessions(),
            getInternshipEntries(),
            getPendingSyncCount(),
        ]);

        setTasks(storedTasks);
        setStudySessions(storedSessions);
        setInternshipEntries(storedEntries);
        setPendingSyncCount(queuedChanges);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    /** Cria a tarefa localmente antes de existir qualquer backend. */
    const createTask = useCallback(async (data: NewTask) => {
        const now = new Date().toISOString();
        const task: Task = {
            ...data,
            id: crypto.randomUUID(),
            status: "pendente",
            createdAt: now,
            updatedAt: now,
            syncStatus: "pendente",
        };

        await saveTask(task);
        setTasks((currentTasks) => [task, ...currentTasks]);
        setPendingSyncCount((count) => count + 1);
    }, []);

    /** Atualiza somente o status sem mutar o array antigo do React. */
    const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
        const currentTask = tasks.find((task) => task.id === taskId);
        if (!currentTask) return;

        const updatedTask: Task = {
            ...currentTask,
            status,
            updatedAt: new Date().toISOString(),
            syncStatus: "pendente",
        };

        await saveTask(updatedTask);
        setTasks((currentTasks) =>
            currentTasks.map((task) => (task.id === taskId ? updatedTask : task)),
        );
        setPendingSyncCount((count) => count + 1);
    }, [tasks]);

    /** Cria e salva uma nova sessão de estudo. */
    const createStudySession = useCallback(async (data: NewStudySession) => {
        const session: StudySession = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            syncStatus: "pendente",
        };

        await saveStudySession(session);
        setStudySessions((currentSessions) => [session, ...currentSessions]);
        setPendingSyncCount((count) => count + 1);
    }, []);

    /** Cria e salva uma nova anotação do diário de estágio. */
    const createInternshipEntry = useCallback(async (data: NewInternshipEntry) => {
        const entry: InternshipEntry = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            syncStatus: "pendente",
        };

        await saveInternshipEntry(entry);
        setInternshipEntries((currentEntries) => [entry, ...currentEntries]);
        setPendingSyncCount((count) => count + 1);
    }, []);

    /** Calcula métricas a partir dos dados, em vez de duplicar números em outro state. */
    const metrics = useMemo(() => {
        const today = getToday();
        const pendingTasks = tasks.filter((task) => task.status !== "concluida").length;
        const completedTasks = tasks.filter((task) => task.status === "concluida").length;
        const studyMinutesToday = studySessions
            .filter((session) => session.date === today)
            .reduce((total, session) => total + session.minutes, 0);

        return { pendingTasks, completedTasks, studyMinutesToday };
    }, [studySessions, tasks]);

    return {
        tasks,
        studySessions,
        internshipEntries,
        pendingSyncCount,
        isLoading,
        metrics,
        today: getToday(),
        createTask,
        updateTaskStatus,
        createStudySession,
        createInternshipEntry,
    };
}
