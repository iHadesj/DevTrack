import { AnimatePresence, motion } from "framer-motion";
import {
    BookOpenCheck,
    BrainCircuit,
    BriefcaseBusiness,
    Check,
    CheckSquare2,
    Moon,
    Plus,
    Sparkles,
    Sun,
    Timer,
} from "lucide-react";
import { useMemo, useState } from "react";
import { BauhausBand, BauhausMotif } from "../components/BauhausMotif";
import { CreateModal, type CreateMode } from "../components/CreateModal";
import { AssistantModal } from "../components/AssistantModal";
import { Sidebar, type AppView } from "../components/Sidebar";
import { StatCard } from "../components/StatCard";
import { StudyPlanner } from "../components/StudyPlanner";
import { useDevTrack } from "../hooks/useDevTrack";
import { useAssistant } from "../context/AssistantContext";
import type { Task } from "../interfaces";
import {
    AppShell,
    AssistantButton,
    AssistantPromo,
    AssistantPromoIcon,
    AreaPill,
    ContentGrid,
    DashedRule,
    EmptyState,
    EntryCard,
    EntryList,
    Eyebrow,
    FocusCaption,
    FocusNumber,
    IconButton,
    MainContent,
    MetricsGrid,
    Panel,
    PanelHeading,
    PanelKicker,
    PanelTitle,
    PageTitle,
    PrimaryButton,
    TaskCheck,
    TaskList,
    TaskRow,
    TaskText,
    StudyLayout,
    TopActions,
    Topbar,
    ViewPanel,
    WelcomeActions,
    WelcomeEyebrow,
    WelcomeHero,
    WelcomeNote,
    WelcomeText,
    WelcomeTitle,
} from "../styles";
import type { ThemeMode } from "../theme";

/** Props recebidas do App: o estado do tema fica no nível mais alto da árvore. */
type HomeProps = {
    mode: ThemeMode;
    onToggleTheme: () => void;
};

/** Textos por tela mantêm o JSX principal livre de vários ifs de apresentação. */
const viewCopy: Record<
    AppView,
    { eyebrow: string; title: string; button: string; modal: CreateMode }
> = {
    Hoje: {
        eyebrow: "SEU ESPAÇO, SEU RITMO",
        title: "Bora fazer o dia render.",
        button: "Nova tarefa",
        modal: "task",
    },
    Tarefas: {
        eyebrow: "PLANEJAMENTO",
        title: "Tudo que precisa sair da cabeça.",
        button: "Nova tarefa",
        modal: "task",
    },
    Estudos: {
        eyebrow: "CONSISTÊNCIA",
        title: "Tempo focado vira repertório.",
        button: "Registrar estudo",
        modal: "study",
    },
    Estágio: {
        eyebrow: "MEMÓRIA DE CARREIRA",
        title: "Registra hoje. Agradece no futuro.",
        button: "Novo registro",
        modal: "internship",
    },
};

/**
 * A entrada da tela usa só opacidade e deslocamento curto.
 * Esse tipo de movimento orienta o olhar, em vez de virar enfeite.
 */
const entrance = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
};

/** Formata a data sem depender de uma biblioteca externa. */
function formatLongDate(): string {
    return new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
    })
        .format(new Date())
        .toUpperCase();
}

/** Mostra minutos em um texto curto e mais humano na tela. */
function formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}min` : ""}`;
}

/** Exibe a data ISO salva no banco em formato brasileiro. */
function formatDate(date: string): string {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
    }).format(new Date(`${date}T12:00:00`));
}

/** Página central: junta os dados do hook, escolhe a tela e controla os modais. */
export function Home({ mode, onToggleTheme }: HomeProps) {
    const [activeView, setActiveView] = useState<AppView>("Hoje");
    const [modalMode, setModalMode] = useState<CreateMode | null>(null);
    const [assistantOpen, setAssistantOpen] = useState(false);
    const { isModelReady } = useAssistant();
    const {
        tasks,
        studySessions,
        internshipEntries,
        pendingSyncCount,
        isLoading,
        metrics,
        today,
        createTask,
        updateTaskStatus,
        createStudySession,
        createInternshipEntry,
    } = useDevTrack();
    const copy = viewCopy[activeView];

    /** Filtra só o que está em aberto para o painel de prioridades do dia. */
    const openTasks = useMemo(
        () => tasks.filter((task) => task.status !== "concluida"),
        [tasks],
    );

    /**
     * A tela de boas-vindas aparece somente enquanto o banco ainda está vazio.
     * Depois do primeiro registro, o usuário vai direto para o dashboard.
     */
    const isFirstJourney =
        !isLoading &&
        tasks.length === 0 &&
        studySessions.length === 0 &&
        internshipEntries.length === 0;

    /** Alterna concluída/pendente. O hook grava no IndexedDB e depois atualiza o React. */
    const toggleTask = async (task: Task) => {
        await updateTaskStatus(
            task.id,
            task.status === "concluida" ? "pendente" : "concluida",
        );
    };

    /** Renderiza uma linha de tarefa em qualquer tela, sem duplicar o mesmo JSX. */
    const renderTask = (task: Task) => {
        const isDone = task.status === "concluida";

        return (
            <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -12 }}
            >
                <TaskRow>
                    <TaskCheck
                        type="button"
                        aria-label={isDone ? "Marcar como pendente" : "Concluir tarefa"}
                        $done={isDone}
                        onClick={() => void toggleTask(task)}
                    >
                        {isDone && <Check size={15} />}
                    </TaskCheck>
                    <TaskText $done={isDone}>
                        <strong>{task.title}</strong>
                        <span>
                            {task.dueDate
                                ? `Prazo: ${formatDate(task.dueDate)}`
                                : "Sem prazo definido"}
                        </span>
                        {/* Ausente nas tarefas criadas antes do campo existir. */}
                        {task.details && <p title={task.details}>{task.details}</p>}
                    </TaskText>
                    <AreaPill $area={task.area}>{task.area}</AreaPill>
                </TaskRow>
            </motion.div>
        );
    };

    /**
     * Trocamos os cards zerados por uma abertura mais convidativa na primeira visita.
     * O botão já leva à ação útil: criar a primeira tarefa local.
     */
    const renderFirstJourney = () => (
        <motion.div {...entrance}>
            <WelcomeHero>
                {/* A composição completa: círculo, quarto, barra, anel, triângulo e hachura. */}
                <BauhausMotif variant="hero" />
                <WelcomeEyebrow>OFFLINE-FIRST · FEITO PARA A VIDA REAL</WelcomeEyebrow>
                <WelcomeTitle>
                    Organiza o corre.
                    <br />
                    Faz acontecer.
                </WelcomeTitle>
                <WelcomeText>
                    Faculdade, estágio e estudo no mesmo lugar — mesmo quando a internet
                    some. Começa com uma tarefa de cinco minutos.
                </WelcomeText>
                <WelcomeActions>
                    <PrimaryButton type="button" onClick={() => setModalMode("task")}>
                        <Sparkles size={16} />
                        Criar meu primeiro passo
                    </PrimaryButton>
                    <AssistantButton type="button" onClick={() => setAssistantOpen(true)}>
                        <BrainCircuit size={16} />
                        Conhecer o assistente
                    </AssistantButton>
                </WelcomeActions>
                <WelcomeNote>
                    Sem cadastro. A IA precisa de internet apenas no primeiro download;
                    depois, também funciona offline.
                </WelcomeNote>
            </WelcomeHero>
        </motion.div>
    );

    /** Dashboard normal, usado depois que a primeira ação já foi registrada. */
    const renderDashboard = () => (
        <>
            <motion.div {...entrance} transition={{ ...entrance.transition, delay: 0.08 }}>
                <MetricsGrid>
                    <StatCard
                        label="Tarefas abertas"
                        value={String(metrics.pendingTasks)}
                        description={`${metrics.completedTasks} concluída(s) até agora`}
                        icon={CheckSquare2}
                        tone="yellow"
                    />
                    <StatCard
                        label="Foco de hoje"
                        value={formatMinutes(metrics.studyMinutesToday)}
                        description="Tempo que você registrou estudando"
                        icon={Timer}
                        tone="blue"
                    />
                    <StatCard
                        label="Diário do estágio"
                        value={String(internshipEntries.length)}
                        description="Registros que viram repertório"
                        icon={BriefcaseBusiness}
                        tone="red"
                    />
                </MetricsGrid>
            </motion.div>

            <motion.div {...entrance} transition={{ ...entrance.transition, delay: 0.14 }}>
                <AssistantPromo>
                    <BauhausMotif variant="promo" />
                    <AssistantPromoIcon>
                        <BrainCircuit size={21} />
                    </AssistantPromoIcon>
                    <div>
                        <h2>Seu assistente local transforma objetivo em próximos passos.</h2>
                        <p>
                            {isModelReady
                                ? "Já baixado neste aparelho: pronto para criar planos offline."
                                : "Ainda não baixado: o primeiro uso precisa de internet; depois funciona offline."}
                        </p>
                    </div>
                    <AssistantButton type="button" onClick={() => setAssistantOpen(true)}>
                        <Sparkles size={15} />
                        {isModelReady ? "Abrir assistente" : "Ver como funciona"}
                    </AssistantButton>
                </AssistantPromo>
            </motion.div>

            <motion.div {...entrance} transition={{ ...entrance.transition, delay: 0.18 }}>
                <ContentGrid>
                    <Panel>
                        <PanelHeading>
                            <div>
                                <PanelKicker>PRÓXIMOS PASSOS</PanelKicker>
                                <PanelTitle>Prioridades de hoje</PanelTitle>
                            </div>
                            <PrimaryButton type="button" onClick={() => setModalMode("task")}>
                                <Plus size={15} />
                                Adicionar
                            </PrimaryButton>
                        </PanelHeading>
                        <TaskList>
                            <AnimatePresence>
                                {isLoading ? (
                                    <EmptyState>Carregando seus dados locais...</EmptyState>
                                ) : openTasks.length ? (
                                    openTasks.slice(0, 5).map(renderTask)
                                ) : (
                                    <EmptyState>
                                        Sem pendências. Use esse respiro para registrar seu próximo
                                        passo.
                                    </EmptyState>
                                )}
                            </AnimatePresence>
                        </TaskList>
                    </Panel>

                    <Panel>
                        <BauhausMotif variant="panel" />
                        <PanelKicker>FOCO</PanelKicker>
                        <PanelTitle>Estudo de hoje</PanelTitle>
                        <FocusNumber>{formatMinutes(metrics.studyMinutesToday)}</FocusNumber>
                        <FocusCaption>
                            Não precisa fazer perfeito, só precisa aparecer no seu histórico.
                        </FocusCaption>
                        <DashedRule />
                        <PrimaryButton type="button" onClick={() => setModalMode("study")}>
                            <BookOpenCheck size={15} />
                            Registrar foco
                        </PrimaryButton>
                    </Panel>
                </ContentGrid>
            </motion.div>
        </>
    );

    /** Conteúdo das telas que não são o dashboard: cada uma usa os dados reais do IndexedDB. */
    const renderSecondaryView = () => {
        if (activeView === "Tarefas") {
            return (
                <ViewPanel>
                    <BauhausMotif variant="journal" />
                    <PanelHeading>
                        <div>
                            <PanelKicker>LISTA COMPLETA</PanelKicker>
                            <PanelTitle>Suas tarefas</PanelTitle>
                        </div>
                        <span>{tasks.length} no total</span>
                    </PanelHeading>
                    <TaskList>
                        <AnimatePresence>
                            {tasks.length ? (
                                tasks.map(renderTask)
                            ) : (
                                <EmptyState>
                                    Começa por uma tarefa pequena. Menos atrito, mais chance de usar
                                    todo dia.
                                </EmptyState>
                            )}
                        </AnimatePresence>
                    </TaskList>
                </ViewPanel>
            );
        }

        if (activeView === "Estudos") {
            return (
                <StudyLayout>
                    <StudyPlanner onCreateTask={createTask} />
                    <ViewPanel>
                    <BauhausMotif variant="journal" />
                    <PanelHeading>
                        <div>
                            <PanelKicker>HISTÓRICO DE FOCO</PanelKicker>
                            <PanelTitle>Sessões registradas</PanelTitle>
                        </div>
                        <PrimaryButton type="button" onClick={() => setModalMode("study")}>
                            <Plus size={15} />
                            Estudar
                        </PrimaryButton>
                    </PanelHeading>
                    <EntryList>
                        {studySessions.length ? (
                            studySessions.map((session) => (
                                <EntryCard key={session.id}>
                                    <strong>{session.subject}</strong>
                                    <p>{formatMinutes(session.minutes)} de foco.</p>
                                    {session.notes && <p>{session.notes}</p>}
                                    {/* `?? []` mantém compatibilidade com sessões criadas antes deste campo existir. */}
                                    {(session.studyLinks ?? []).map((link) => (
                                        <a key={link} href={link} target="_blank" rel="noreferrer">
                                            Abrir material de estudo ↗
                                        </a>
                                    ))}
                                    <small>{formatDate(session.date)}</small>
                                </EntryCard>
                            ))
                        ) : (
                            <EmptyState>
                                Seu tempo de estudo vai aparecer aqui quando você registrar a primeira
                                sessão.
                            </EmptyState>
                        )}
                    </EntryList>
                    </ViewPanel>
                </StudyLayout>
            );
        }

        return (
            <ViewPanel>
                <BauhausMotif variant="journal" />
                <PanelHeading>
                    <div>
                        <PanelKicker>DIÁRIO DO ESTÁGIO</PanelKicker>
                        <PanelTitle>O que você construiu</PanelTitle>
                    </div>
                    <PrimaryButton type="button" onClick={() => setModalMode("internship")}>
                        <Plus size={15} />
                        Registrar
                    </PrimaryButton>
                </PanelHeading>
                <EntryList>
                    {internshipEntries.length ? (
                        internshipEntries.map((entry) => (
                            <EntryCard key={entry.id}>
                                <strong>{entry.title}</strong>
                                <p>{entry.learning}</p>
                                {entry.blocker && <p>Bloqueio: {entry.blocker}</p>}
                                <small>{formatDate(entry.date)}</small>
                            </EntryCard>
                        ))
                    ) : (
                        <EmptyState>
                            Registre a primeira entrega ou aprendizado do estágio para criar seu
                            histórico.
                        </EmptyState>
                    )}
                </EntryList>
            </ViewPanel>
        );
    };

    return (
        <>
            <AppShell className="app-shell">
                <Sidebar
                    activeView={activeView}
                    pendingSyncCount={pendingSyncCount}
                    onSelect={setActiveView}
                />

                <MainContent>
                    {/* Fundo geométrico de página inteira, em opacidade baixa. */}
                    <BauhausMotif variant="page" />
                    <motion.div {...entrance}>
                        <Topbar>
                            <div>
                                <Eyebrow>
                                    {formatLongDate()} · {copy.eyebrow}
                                </Eyebrow>
                                <PageTitle>{copy.title}</PageTitle>
                            </div>
                            <TopActions>
                                <AssistantButton
                                    type="button"
                                    aria-label="Abrir assistente"
                                    onClick={() => setAssistantOpen(true)}
                                >
                                    <BrainCircuit size={16} />
                                    <span className="action-label">Assistente</span>
                                </AssistantButton>
                                <IconButton
                                    type="button"
                                    aria-label={
                                        mode === "light"
                                            ? "Ativar tema escuro"
                                            : "Ativar tema claro"
                                    }
                                    onClick={onToggleTheme}
                                >
                                    {mode === "light" ? <Moon size={18} /> : <Sun size={18} />}
                                </IconButton>
                                <PrimaryButton
                                    type="button"
                                    aria-label={copy.button}
                                    onClick={() => setModalMode(copy.modal)}
                                >
                                    <Plus size={16} />
                                    <span className="action-label">{copy.button}</span>
                                </PrimaryButton>
                            </TopActions>
                        </Topbar>
                        <BauhausBand />
                    </motion.div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeView}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                        >
                            {activeView === "Hoje"
                                ? isFirstJourney
                                    ? renderFirstJourney()
                                    : renderDashboard()
                                : renderSecondaryView()}
                        </motion.div>
                    </AnimatePresence>
                </MainContent>
            </AppShell>

            <AnimatePresence>
                {modalMode && (
                    <CreateModal
                        mode={modalMode}
                        today={today}
                        onClose={() => setModalMode(null)}
                        onCreateTask={createTask}
                        onCreateStudySession={createStudySession}
                        onCreateInternshipEntry={createInternshipEntry}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {assistantOpen && (
                    <AssistantModal
                        activeView={activeView}
                        onClose={() => setAssistantOpen(false)}
                        onCreateTask={createTask}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
