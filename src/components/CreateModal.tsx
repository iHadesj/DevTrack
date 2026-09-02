import { useState, type FormEvent } from "react";
import type { Area, NewInternshipEntry, NewStudySession, NewTask } from "../interfaces";
import { Form, FormField, PrimaryButton } from "../styles";
import { Modal } from "./Modal";

/** Define qual formulário será exibido pelo mesmo componente de modal. */
export type CreateMode = "task" | "study" | "internship";

/** Props: cada callback sobe os dados para o hook que conhece o IndexedDB. */
type CreateModalProps = { mode: CreateMode; today: string; onClose: () => void; onCreateTask: (data: NewTask) => Promise<void>; onCreateStudySession: (data: NewStudySession) => Promise<void>; onCreateInternshipEntry: (data: NewInternshipEntry) => Promise<void>; };

/** Textos do modal por tipo, mantendo a apresentação fora da regra de submit. */
const modalCopy: Record<CreateMode, { title: string; description: string; button: string }> = {
    task: { title: "Nova tarefa", description: "Salva localmente primeiro. Você não perde o registro sem internet.", button: "Criar tarefa" },
    study: { title: "Registrar estudo", description: "Guarde o foco de hoje para enxergar sua consistência.", button: "Salvar sessão" },
    internship: { title: "Registrar estágio", description: "Transforme o dia de trabalho em memória útil para sua evolução.", button: "Salvar registro" },
};

/** Formulário modal que muda de campos conforme o fluxo escolhido pelo usuário. */
export function CreateModal({ mode, today, onClose, onCreateTask, onCreateStudySession, onCreateInternshipEntry }: CreateModalProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [taskTitle, setTaskTitle] = useState("");
    const [taskDetails, setTaskDetails] = useState("");
    const [area, setArea] = useState<Area>("faculdade");
    const [dueDate, setDueDate] = useState("");
    const [subject, setSubject] = useState("");
    const [minutes, setMinutes] = useState("60");
    const [studyLinksText, setStudyLinksText] = useState("");
    const [studyNotes, setStudyNotes] = useState("");
    const [entryTitle, setEntryTitle] = useState("");
    const [learning, setLearning] = useState("");
    const [blocker, setBlocker] = useState("");

    /** Lê o `mode`, manda os dados ao callback correto e só fecha quando a escrita termina. */
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        /** String vazia vira `undefined` para o banco não guardar descrição em branco. */
        if (mode === "task") await onCreateTask({ title: taskTitle.trim(), area, dueDate: dueDate || undefined, details: taskDetails.trim() || undefined });
        if (mode === "study") {
            /** Cada linha não vazia vira um link; isso permite colar vários materiais de uma vez. */
            const studyLinks = studyLinksText
                .split("\n")
                .map((link) => link.trim())
                .filter(Boolean);

            await onCreateStudySession({
                subject: subject.trim(),
                minutes: Number(minutes),
                date: today,
                studyLinks,
                notes: studyNotes.trim() || undefined,
            });
        }
        if (mode === "internship") await onCreateInternshipEntry({ title: entryTitle.trim(), learning: learning.trim(), blocker: blocker.trim() || undefined, date: today });
        setIsSaving(false);
        onClose();
    };

    /** Retorna somente os campos específicos do tipo de registro selecionado. */
    const fields = () => {
        if (mode === "task") return <><FormField>Tarefa<input required autoFocus value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Ex.: revisar API REST" /></FormField><FormField>Como fazer (opcional)<textarea rows={3} value={taskDetails} onChange={(event) => setTaskDetails(event.target.value)} placeholder="Ex.: reler a doc de autenticação e refazer o fluxo de login do zero." /></FormField><FormField>Área<select value={area} onChange={(event) => setArea(event.target.value as Area)}><option value="faculdade">Faculdade</option><option value="estagio">Estágio</option><option value="pessoal">Pessoal</option></select></FormField><FormField>Prazo (opcional)<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></FormField></>;
        if (mode === "study") return <><FormField>Assunto<input required autoFocus value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Ex.: React e hooks" /></FormField><FormField>Minutos de foco<input required min="1" max="720" type="number" value={minutes} onChange={(event) => setMinutes(event.target.value)} /></FormField><FormField>Links de estudo (opcional)<textarea rows={3} value={studyLinksText} onChange={(event) => setStudyLinksText(event.target.value)} placeholder={"Um link por linha\nhttps://react.dev/learn"} /></FormField><FormField>Observações (opcional)<textarea rows={3} value={studyNotes} onChange={(event) => setStudyNotes(event.target.value)} placeholder="Ex.: entendi melhor como o useEffect reage às dependências." /></FormField></>;
        return <><FormField>O que você fez?<input required autoFocus value={entryTitle} onChange={(event) => setEntryTitle(event.target.value)} placeholder="Ex.: corrigi o fluxo de login" /></FormField><FormField>O que aprendeu?<textarea required rows={3} value={learning} onChange={(event) => setLearning(event.target.value)} placeholder="Ex.: como o refresh token funciona" /></FormField><FormField>Ficou travado em algo? (opcional)<textarea rows={2} value={blocker} onChange={(event) => setBlocker(event.target.value)} placeholder="Ex.: ainda preciso entender CORS" /></FormField></>;
    };

    const copy = modalCopy[mode];
    return <Modal title={copy.title} description={copy.description} onClose={onClose}><Form onSubmit={handleSubmit}>{fields()}<PrimaryButton type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : copy.button}</PrimaryButton></Form></Modal>;
}
