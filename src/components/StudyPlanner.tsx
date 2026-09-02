import { BrainCircuit, Check, ChevronDown, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { BauhausMotif } from "./BauhausMotif";
import { useAssistant } from "../context/AssistantContext";
import {
    extractTechTerms,
    createResourceSearchQuery,
} from "../services/plannerIntelligence";
import type { PlannedTask, PlannerContext } from "../hooks/useLocalPlanner";
import type { Area, NewTask } from "../interfaces";
import {
    DownloadNotice,
    DownloadProgressBar,
    DownloadProgressFill,
    DownloadProgressLabel,
    Form,
    FormField,
    PlannerCard,
    PlannerHeader,
    PlannerMeta,
    PlannerStatus,
    PlanGuidance,
    PlanGuidanceContent,
    PlanGuidanceToggle,
    PrimaryButton,
    ResourceLink,
    ResourceLinks,
    SuggestionDetails,
    SuggestionDetailsToggle,
    SuggestionItem,
    SuggestionList,
    SuggestionReason,
    SuggestionTitleRow,
} from "../styles";

/** Configura o mesmo assistente para a aba atual sem duplicar sua lógica. */
type StudyPlannerProps = {
    onCreateTask: (task: NewTask) => Promise<void>;
    context?: PlannerContext;
    taskArea?: Area;
    embedded?: boolean;
    heading?: string;
    objectivePlaceholder?: string;
};

/**
 * Fontes primárias conhecidas pelo app. Elas não dependem da IA e apontam para
 * documentação mantida por cada tecnologia, evitando indicação inventada.
 */
const OFFICIAL_DOCUMENTATION: Record<string, string> = {
    React: "https://react.dev/learn",
    TypeScript: "https://www.typescriptlang.org/docs/",
    JavaScript: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript",
    Java: "https://dev.java/learn/",
    Spring: "https://spring.io/guides",
    "Node.js": "https://nodejs.org/en/learn",
    HTML: "https://developer.mozilla.org/pt-BR/docs/Web/HTML",
    CSS: "https://developer.mozilla.org/pt-BR/docs/Web/CSS",
    Git: "https://git-scm.com/doc",
};

/** Converte string vazia em undefined para o banco não guardar prazo falso. */
function getDueDate(date: string): string | undefined {
    return date || undefined;
}

/**
 * Preserva a API do componente, mas delega a interpretação ao mesmo service
 * usado pelo prompt e pelo fallback. Assim as três partes entendem o pedido igual.
 */
export function createMaterialSearchQuery(
    objective: string,
    taskTitle: string,
    provider: "google" | "youtube",
): string {
    return createResourceSearchQuery(objective, taskTitle, provider);
}

/** Monta a URL real no navegador; nenhuma URL é inventada pelo modelo local. */
function createSearchUrl(
    objective: string,
    taskTitle: string,
    provider: "google" | "youtube",
): string {
    const query = createMaterialSearchQuery(objective, taskTitle, provider);
    const encodedQuery = encodeURIComponent(query);

    return provider === "youtube"
        ? `https://www.youtube.com/results?search_query=${encodedQuery}`
        : `https://www.google.com/search?q=${encodedQuery}`;
}

/** Retorna a primeira documentação oficial compatível com o objetivo. */
function getOfficialDocumentationUrl(objective: string): string | undefined {
    const firstDocumentedTechnology = extractTechTerms(objective).find(
        (term) => OFFICIAL_DOCUMENTATION[term],
    );

    return firstDocumentedTechnology
        ? OFFICIAL_DOCUMENTATION[firstDocumentedTechnology]
        : undefined;
}

/**
 * A IA sugere e a pessoa aprova. O componente pode aparecer como card em Estudos
 * ou embutido no modal global acessível por todas as abas.
 */
export function StudyPlanner({
    onCreateTask,
    context = "study",
    taskArea = "faculdade",
    embedded = false,
    heading = "Me ajuda a planejar",
    objectivePlaceholder = "Ex.: aprender React para a prova de sexta",
}: StudyPlannerProps) {
    const {
        state,
        mode,
        status,
        error,
        downloadProgress,
        generationProgress,
        isSupported,
        isModelReady,
        createPlan,
    } = useAssistant();
    const [objective, setObjective] = useState("");
    const [deadline, setDeadline] = useState("");
    const [dailyMinutes, setDailyMinutes] = useState("45");
    const [suggestions, setSuggestions] = useState<PlannedTask[]>([]);
    const [introduction, setIntroduction] = useState("");
    const [tips, setTips] = useState<string[]>([]);
    const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
    const [expandedTitles, setExpandedTitles] = useState<string[]>([]);
    const [isGuidanceOpen, setIsGuidanceOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    /** Solicita o plano e seleciona todas as sugestões para a etapa de revisão. */
    const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            const plan = await createPlan({
                objective: objective.trim(),
                deadline: getDueDate(deadline),
                dailyMinutes: Number(dailyMinutes),
                context,
            });
            setIntroduction(plan.introduction);
            setTips(plan.tips);
            setSuggestions(plan.tasks);
            setSelectedTitles(plan.tasks.map((task) => task.title));
            /** No mobile o resultado começa resumido para preservar a hierarquia. */
            setExpandedTitles([]);
            setIsGuidanceOpen(false);
        } catch {
            // A mensagem detalhada já fica no Context e aparece em PlannerStatus.
        }
    };

    /** Alterna uma sugestão de forma imutável para o React perceber a mudança. */
    const toggleSuggestion = (title: string) => {
        setSelectedTitles((currentTitles) =>
            currentTitles.includes(title)
                ? currentTitles.filter((currentTitle) => currentTitle !== title)
                : [...currentTitles, title],
        );
    };

    /** Abre somente a explicação escolhida; as demais tarefas continuam compactas. */
    const toggleTaskDetails = (title: string) => {
        setExpandedTitles((currentTitles) =>
            currentTitles.includes(title)
                ? currentTitles.filter((currentTitle) => currentTitle !== title)
                : [...currentTitles, title],
        );
    };

    /** Salva no IndexedDB somente as sugestões marcadas pelo usuário. */
    const saveSelectedTasks = async () => {
        const selectedTasks = suggestions.filter((task) =>
            selectedTitles.includes(task.title),
        );
        if (!selectedTasks.length) return;

        setIsSaving(true);
        try {
            await Promise.all(
                selectedTasks.map((task) =>
                    onCreateTask({
                        title: task.title,
                        area: taskArea,
                        dueDate: getDueDate(deadline),
                        /**
                         * O plano só existia enquanto o modal estava aberto: a tarefa
                         * salva perdia o "como fazer" e virava um título solto.
                         * `filter(Boolean)` cobre o `reason` vazio de etapa duplicada.
                         */
                        details: [task.reason, task.howToStudy]
                            .filter(Boolean)
                            .join("\n\n"),
                    }),
                ),
            );
            setSuggestions([]);
            setSelectedTitles([]);
            setIntroduction("");
            setTips([]);
            setExpandedTitles([]);
            setIsGuidanceOpen(false);
        } finally {
            setIsSaving(false);
        }
    };

    /** O texto do botão nunca promete um download que este aparelho não fará. */
    const buttonLabel =
        state === "downloading"
            ? `Baixando... ${downloadProgress}%`
            : state === "generating"
                ? "Criando plano..."
                : !isSupported
                    ? "Gerar plano"
                    : isModelReady
                        ? "Gerar plano offline"
                        : "Baixar assistente e gerar";

    /** Etiqueta honesta sobre quem escreveu o plano que está na tela. */
    const modeLabel =
        mode === "ai"
            ? "NESTE APARELHO"
            : mode === "cloud"
                ? "IA NA NUVEM"
                : mode === "mixed"
                    ? "IA + REGRAS DO DEVTRACK"
                    : "REGRAS DO DEVTRACK";

    return (
        <PlannerCard
            $embedded={embedded}
            className={embedded ? "planner-embedded" : undefined}
        >
            {/* Embutido no modal o cartão perde o fundo, então o motivo do modal já basta. */}
            {!embedded && <BauhausMotif variant="planner" />}
            <PlannerHeader>
                <div>
                    <PlannerMeta>ASSISTENTE · BETA</PlannerMeta>
                    <h2>
                        <BrainCircuit size={20} /> {heading}
                    </h2>
                    <p>
                        Quando o aparelho aguenta, a IA roda aqui dentro e funciona offline.
                        Se não aguentar, o plano vem da IA na nuvem — e sem internet o
                        DevTrack monta sozinho.
                    </p>
                </div>
                <Sparkles size={28} aria-hidden="true" />
            </PlannerHeader>

            {/*
              * O formulário existe em qualquer aparelho: o que muda entre eles é
              * apenas qual degrau responde, nunca a possibilidade de planejar.
              */}
            <>
                    {!isSupported ? (
                        <DownloadNotice>
                            <strong>Sem modelo local neste aparelho.</strong>
                            Com internet, o plano é criado pela IA na nuvem e seu objetivo
                            é enviado para processamento. Sem internet, o DevTrack monta o
                            plano com as próprias regras.
                        </DownloadNotice>
                    ) : (
                        !isModelReady && (
                            <DownloadNotice>
                                <strong>Primeiro uso: internet obrigatória.</strong>
                                O modelo precisa ser baixado uma vez. Depois disso, o
                                assistente cria planos offline neste aparelho.
                            </DownloadNotice>
                        )
                    )}

                    {state === "downloading" && (
                        <div>
                            <DownloadProgressLabel>
                                <span>Baixando assistente</span>
                                <strong>{downloadProgress}%</strong>
                            </DownloadProgressLabel>
                            <DownloadProgressBar
                                role="progressbar"
                                aria-label="Download do assistente"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={downloadProgress}
                            >
                                <DownloadProgressFill $progress={downloadProgress} />
                            </DownloadProgressBar>
                        </div>
                    )}

                    {state === "generating" && (
                        <div>
                            <DownloadProgressLabel>
                                <span>Criando plano · progresso estimado</span>
                                <strong>{generationProgress}%</strong>
                            </DownloadProgressLabel>
                            <DownloadProgressBar
                                role="progressbar"
                                aria-label="Criação do plano"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={generationProgress}
                            >
                                <DownloadProgressFill $progress={generationProgress} />
                            </DownloadProgressBar>
                        </div>
                    )}

                    <Form onSubmit={handleGenerate}>
                        <FormField>
                            O que você precisa organizar?
                            <textarea
                                required
                                rows={3}
                                value={objective}
                                onChange={(event) => setObjective(event.target.value)}
                                placeholder={objectivePlaceholder}
                            />
                        </FormField>

                        <FormField>
                            Prazo (opcional)
                            <input
                                type="date"
                                value={deadline}
                                onChange={(event) => setDeadline(event.target.value)}
                            />
                        </FormField>

                        <FormField>
                            Minutos disponíveis por dia
                            <input
                                required
                                min="10"
                                max="480"
                                type="number"
                                value={dailyMinutes}
                                onChange={(event) => setDailyMinutes(event.target.value)}
                            />
                        </FormField>

                        <PrimaryButton
                            type="submit"
                            disabled={state === "downloading" || state === "generating"}
                        >
                            <Sparkles size={15} />
                            {buttonLabel}
                        </PrimaryButton>
                    </Form>
            </>

            {/*
              * O status conta o desfecho; o erro conta por que o degrau local caiu.
              * Antes um substituía o outro, então a causa nunca chegava à tela.
              */}
            <PlannerStatus>{status}</PlannerStatus>
            {error && <PlannerStatus $error>{error}</PlannerStatus>}

            {introduction && (
                <PlanGuidance>
                    <PlanGuidanceToggle
                        type="button"
                        $open={isGuidanceOpen}
                        aria-expanded={isGuidanceOpen}
                        onClick={() => setIsGuidanceOpen((current) => !current)}
                    >
                        <strong>Como seguir este plano</strong>
                        <ChevronDown size={16} />
                    </PlanGuidanceToggle>
                    <PlanGuidanceContent $open={isGuidanceOpen}>
                        <div>
                            <p>{introduction}</p>
                            {tips.length > 0 && (
                                <ul>
                                    {tips.map((tip) => (
                                        <li key={tip}>{tip}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </PlanGuidanceContent>
                </PlanGuidance>
            )}

            {suggestions.length > 0 && (
                <SuggestionList>
                    {/* Quem gerou vem junto do aviso: a origem do plano não fica oculta. */}
                    <PlannerMeta>REVISE ANTES DE SALVAR · {modeLabel}</PlannerMeta>
                    {suggestions.map((task) => {
                        const isSelected = selectedTitles.includes(task.title);
                        const isExpanded = expandedTitles.includes(task.title);
                        const officialDocumentationUrl =
                            getOfficialDocumentationUrl(objective);

                        return (
                            <SuggestionItem key={task.title} $selected={isSelected}>
                                <input
                                    type="checkbox"
                                    aria-label={`Selecionar ${task.title}`}
                                    checked={isSelected}
                                    onChange={() => toggleSuggestion(task.title)}
                                />
                                <div>
                                    <SuggestionTitleRow>
                                        <strong>{task.title}</strong>
                                        <small>≈ {task.estimatedMinutes} min</small>
                                    </SuggestionTitleRow>
                                    <SuggestionDetailsToggle
                                        type="button"
                                        aria-expanded={isExpanded}
                                        onClick={() => toggleTaskDetails(task.title)}
                                    >
                                        {isExpanded ? "Ocultar detalhes" : "Ver detalhes"}
                                    </SuggestionDetailsToggle>
                                    <SuggestionDetails $open={isExpanded}>
                                        <div>
                                            {/* Vazio quando era cópia do "Como fazer": não rende linha em branco. */}
                                            {task.reason && (
                                                <SuggestionReason>
                                                    {task.reason}
                                                </SuggestionReason>
                                            )}
                                            <SuggestionReason>
                                                <b>Como fazer:</b> {task.howToStudy}
                                            </SuggestionReason>
                                            <ResourceLinks>
                                                {officialDocumentationUrl && (
                                                    <ResourceLink
                                                        href={officialDocumentationUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        Docs oficiais ↗
                                                    </ResourceLink>
                                                )}
                                            <ResourceLink
                                                href={createSearchUrl(
                                                    objective,
                                                    task.title,
                                                    "google",
                                                )}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Buscar material ↗
                                            </ResourceLink>
                                                <ResourceLink
                                                    href={createSearchUrl(
                                                        objective,
                                                        task.title,
                                                        "youtube",
                                                    )}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Ver vídeos ↗
                                                </ResourceLink>
                                            </ResourceLinks>
                                        </div>
                                    </SuggestionDetails>
                                </div>
                            </SuggestionItem>
                        );
                    })}

                    <PrimaryButton
                        type="button"
                        disabled={isSaving || selectedTitles.length === 0}
                        onClick={() => void saveSelectedTasks()}
                    >
                        <Check size={15} />
                        {isSaving ? "Salvando..." : "Salvar tarefas selecionadas"}
                    </PrimaryButton>
                </SuggestionList>
            )}
        </PlannerCard>
    );
}
