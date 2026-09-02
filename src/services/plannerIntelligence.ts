/** Aba que abriu o assistente. Ela influencia o tom, não limita o assunto pedido. */
export type PlannerContext = "today" | "tasks" | "study" | "internship";

/** Dados mínimos usados tanto pela IA quanto pelo plano local de segurança. */
export type PlannerInput = {
    objective: string;
    deadline?: string;
    dailyMinutes: number;
    context?: PlannerContext;
};

/** Etapa revisável antes de virar uma tarefa persistida no IndexedDB. */
export type PlannedTask = {
    title: string;
    reason: string;
    estimatedMinutes: number;
    /** Orientação concreta; o nome histórico foi mantido para não quebrar a interface. */
    howToStudy: string;
};

/** Plano completo exibido no assistente. */
export type StudyPlan = {
    introduction: string;
    tips: string[];
    tasks: PlannedTask[];
    /**
     * De onde saíram as etapas realmente exibidas. Sem isto a interface anuncia
     * "NESTE APARELHO" mesmo quando o validador trocou tudo pelo plano de regras.
     * `mixed` é o caso comum em modelo pequeno: ele acerta parte das etapas.
     */
    tasksOrigin?: "ai" | "mixed" | "fallback";
    /** Qual regra recusou as etapas da IA, para a recusa não virar silêncio. */
    rejectionReason?: string;
};

/** Intenções gerais atendidas sem assumir que o assunto é desenvolvimento. */
export type GoalIntent =
    | "learn"
    | "refactor"
    | "create"
    | "fix"
    | "research"
    | "prepare"
    | "organize"
    | "execute";

/** Leitura determinística do pedido usada para orientar e fiscalizar a IA. */
export type ObjectiveProfile = {
    intent: GoalIntent;
    focus: string;
    subject: string;
    requirements: string[];
    keywords: string[];
    domain: string;
    explicitLegalTopic: boolean;
};

/** Tecnologias conhecidas servem para links oficiais, nunca para limitar assuntos. */
const TECH_TERMS = [
    { label: "React", aliases: ["react", "reactjs", "react.js"] },
    { label: "TypeScript", aliases: ["typescript"] },
    { label: "JavaScript", aliases: ["javascript"] },
    { label: "Java", aliases: ["java"] },
    { label: "Spring", aliases: ["spring", "spring boot"] },
    { label: "Node.js", aliases: ["node", "nodejs", "node.js"] },
    { label: "HTML", aliases: ["html"] },
    { label: "CSS", aliases: ["css"] },
    { label: "API", aliases: ["api", "apis"] },
    { label: "Git", aliases: ["git"] },
    { label: "SQL", aliases: ["sql"] },
] as const;

/** Palavras de ligação são descartadas ao medir se uma resposta continua no tema. */
const STOP_WORDS = new Set([
    "a",
    "ao",
    "aos",
    "as",
    "com",
    "como",
    "da",
    "das",
    "de",
    "do",
    "dos",
    "e",
    "em",
    "eu",
    "meu",
    "minha",
    "na",
    "nas",
    "no",
    "nos",
    "o",
    "os",
    "ou",
    "para",
    "por",
    "preciso",
    "projeto",
    "que",
    "quero",
    "se",
    "sem",
    "sabe",
    "sera",
    "sobre",
    "tudo",
    "um",
    "uma",
    "voce",
    "ja",
]);

/** Textos do antigo exemplo e frases vazias que um modelo pequeno pode copiar. */
const PLACEHOLDER_PATTERNS = [
    /estrategia curta/,
    /dica pratica/,
    /etapa especifica/,
    /texto curto/,
    /texto de orientacao/,
    /por que vem agora/,
    /acao pratica/,
    /seu objetivo/,
];

/** Normaliza acentos e caixa somente para comparações internas. */
export function normalizeForComparison(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

/** Escapa um termo antes de colocá-lo em uma expressão regular. */
function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Encontra tecnologias sem confundir, por exemplo, Java com JavaScript. */
export function extractTechTerms(objective: string): string[] {
    const normalizedObjective = normalizeForComparison(objective);

    return TECH_TERMS.filter(({ aliases }) =>
        aliases.some((alias) => {
            const wholeTerm = new RegExp(
                `(^|[^a-z0-9])${escapeRegExp(alias)}(?=$|[^a-z0-9])`,
            );
            return wholeTerm.test(normalizedObjective);
        }),
    ).map(({ label }) => label);
}

/** Detecta a ação principal antes de construir qualquer tarefa. */
function detectIntent(objective: string): GoalIntent {
    const normalized = normalizeForComparison(objective);
    const patterns: Array<[GoalIntent, RegExp]> = [
        ["refactor", /\b(refator|reformular|reestrutur|redesenh)/],
        ["fix", /\b(corrig|consert|resolver (?:um )?erro|ajust|melhor|otimiz)/],
        ["research", /\b(pesquis|investig|compar|analis)/],
        ["learn", /\b(aprend|estud|domin|pratic|entend)/],
        ["prepare", /\b(prepar|ensai|revisar para|prova|entrevista|apresentacao)/],
        ["organize", /\b(organiz|planej|prioriz|rotina|agenda)/],
        ["create", /\b(cri|mont|constru|desenvolv|produz|escrev)/],
    ];

    return patterns.find(([, pattern]) => pattern.test(normalized))?.[0] ?? "execute";
}

/** Remove pedidos sobre "montar um plano" para sobrar o trabalho de verdade. */
function removePlanningRequest(text: string): string {
    return text
        .replace(
            /^\s*(?:por favor[, ]*)?(?:eu\s+)?(?:quero|preciso|gostaria(?:\s+de)?)(?:\s+que(?:\s+voc[eê])?)?\s+(?:monte|montar|crie|criar|fa[cç]a|fazer)?\s*(?:um\s+)?plano\s+(?:para|de)?\s*/i,
            "",
        )
        .replace(/^\s*(?:eu\s+)?(?:quero|preciso|gostaria de)\s+/i, "")
        .trim();
}

/** Limpa o começo de cada requisito sem apagar o verbo que explica a ação. */
function cleanRequirement(text: string): string {
    return text
        .replace(/^\s*(?:e\s+)?(?:eu\s+)?(?:tamb[eé]m\s+)?(?:preciso|quero|devo)\s+/i, "")
        .replace(/[.;]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Separa o foco dos requisitos explícitos. A divisão por "e" só acontece
 * quando a próxima palavra é uma ação, preservando nomes como "HTML e CSS".
 */
function splitObjective(
    objective: string,
    intent: GoalIntent,
): { focus: string; requirements: string[] } {
    const cleaned = removePlanningRequest(objective);
    const pieces = cleaned
        .split(
            /\s*[,;]\s*|\s+e\s+(?=(?:alterar|ajustar|conferir|revisar|validar|trocar|mudar|adicionar|remover|organizar|comparar|controlar|testar|definir|corrigir|melhorar)\b)/i,
        )
        .map(cleanRequirement)
        .filter(Boolean);

    /** Localiza a parte que contém a intenção quando o pedido começa com contexto. */
    const intentEvidence: Record<GoalIntent, RegExp> = {
        learn: /\b(aprend|estud|domin|pratic|entend)/,
        refactor: /\b(refator|reformular|reestrutur|redesenh)/,
        create: /\b(cri|mont|constru|desenvolv|produz|escrev)/,
        fix: /\b(corrig|consert|resolver|ajust|melhor|otimiz)/,
        research: /\b(pesquis|investig|compar|analis)/,
        prepare: /\b(prepar|ensai|revisar|prova|entrevista|apresentacao)/,
        organize: /\b(organiz|planej|prioriz|rotina|agenda)/,
        execute: /./,
    };
    const focusIndex = pieces.findIndex((piece) =>
        intentEvidence[intent].test(normalizeForComparison(piece)),
    );
    const selectedIndex = focusIndex >= 0 ? focusIndex : 0;
    const requirements = pieces.filter(
        (piece, index) =>
            index !== selectedIndex &&
            normalizeForComparison(piece).split(/\s+/).length >= 3,
    );

    return {
        focus: pieces[selectedIndex] || cleaned || objective.trim(),
        requirements: requirements.slice(0, 4),
    };
}

/** Retira o verbo principal para obter um assunto curto que cabe nos títulos. */
function extractSubject(focus: string, objective: string, intent: GoalIntent): string {
    const technologies = extractTechTerms(objective);
    if (intent === "learn" && technologies.length > 0) {
        return technologies.join(" e ");
    }

    const withoutVerb = focus
        .replace(
            /^(?:refatorar|reformular|reestruturar|redesenhar|corrigir|consertar|resolver|ajustar|melhorar|otimizar|pesquisar|investigar|comparar|analisar|aprender|estudar|dominar|praticar|entender|preparar|organizar|planejar|priorizar|criar|montar|construir|desenvolver|produzir|escrever|executar)\s+/i,
            "",
        )
        .replace(/^(?:um|uma|o|a)\s+/i, "")
        .replace(/\s+/g, " ")
        .trim();

    return (withoutVerb || focus).slice(0, 90);
}

/** Classifica apenas para escolher fontes e linguagem; nenhum domínio é obrigatório. */
function detectDomain(objective: string): string {
    const normalized = normalizeForComparison(objective);
    const domains: Array<[string, RegExp]> = [
        ["design e produto", /\b(design|catalogo|interface|layout|cor|tema|marca|onda|touch|prototipo|ux|ui)\b/],
        ["tecnologia", /\b(codigo|software|sistema|aplicativo|site|banco de dados|frontend|backend|api)\b/],
        ["estudos", /\b(aula|faculdade|curso|prova|trabalho academico|materia)\b/],
        ["carreira", /\b(estagio|emprego|curriculo|entrevista|portfolio|carreira)\b/],
        ["idiomas", /\b(ingles|espanhol|frances|idioma|conversacao)\b/],
        ["viagem", /\b(viagem|viajar|hotel|hospedagem|passagem|turismo|roteiro)\b/],
        ["finanças", /\b(dinheiro|orcamento|financas|financiamento|investimento|divida|gastos)\b/],
        ["saúde", /\b(saude|treino|dieta|sintoma|medicamento|terapia)\b/],
        ["jurídico", /\b(direito civil|direito penal|faculdade de direito|curso de direito|advocacia|juridic)\b/],
    ];

    if (extractTechTerms(objective).length > 0) return "tecnologia";
    return domains.find(([, pattern]) => pattern.test(normalized))?.[0] ?? "geral";
}

/** Gera palavras úteis para detectar deriva de assunto nas respostas. */
function extractKeywords(text: string): string[] {
    const words = normalizeForComparison(text)
        .replace(/[^a-z0-9]+/g, " ")
        .split(/\s+/)
        .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));

    /** Array.from mantém compatibilidade com o target ES5 deste projeto. */
    return Array.from(new Set(words)).slice(0, 18);
}

/** Constrói a leitura compartilhada pelo prompt, validador, fallback e busca. */
export function analyzeObjective(objective: string): ObjectiveProfile {
    /** O verbo "monte" do pedido de plano não pode virar a intenção "criar". */
    const intent = detectIntent(removePlanningRequest(objective));
    const { focus, requirements } = splitObjective(objective, intent);
    const subject = extractSubject(focus, objective, intent);
    const explicitLegalTopic = /\b(direito civil|direito penal|faculdade de direito|curso de direito|advocacia|juridic)/.test(
        normalizeForComparison(objective),
    );

    return {
        intent,
        focus,
        subject,
        requirements,
        keywords: extractKeywords(`${focus} ${requirements.join(" ")}`),
        domain: detectDomain(objective),
        explicitLegalTopic,
    };
}

/** Evita tempos inválidos ou maiores que o bloco informado pela pessoa. */
function getSessionMinutes(dailyMinutes: number): number {
    return Math.min(120, Math.max(10, Math.round(dailyMinutes) || 30));
}

/** Junta os requisitos de forma curta para reutilizar nas tarefas locais. */
function describeRequirements(profile: ObjectiveProfile): string {
    return profile.requirements.length > 0
        ? profile.requirements.join("; ")
        : `concluir ${profile.focus} com um resultado verificável`;
}

/** Remove o verbo inicial para criar um complemento curto de título. */
function requirementHeadline(requirements: string[], fallback: string): string {
    const headline = requirements
        .map((requirement) =>
            requirement.replace(
                /^(?:alterar|ajustar|conferir|revisar|validar|trocar|mudar|adicionar|remover|organizar|comparar|testar|definir|corrigir|melhorar)\s+/i,
                "",
            ).replace(/^(?:o|a|os|as|um|uma)\s+/i, ""),
        )
        .join(" e ");

    return (headline || fallback).slice(0, 85);
}

/** Atalho tipado para manter os templates menores e legíveis. */
function task(
    title: string,
    reason: string,
    howToStudy: string,
    minutes: number,
): PlannedTask {
    return { title, reason, howToStudy, estimatedMinutes: minutes };
}

/** Plano de aprendizado: diagnóstico, fonte, prática e aplicação independente. */
function createLearningTasks(profile: ObjectiveProfile, minutes: number): PlannedTask[] {
    const subject = profile.subject;
    return [
        task(
            `Diagnosticar o que você já sabe sobre ${subject}`,
            "Começar pelas lacunas evita rever tudo sem necessidade.",
            "Explique o assunto sem consultar material, marque dúvidas concretas e transforme cada dúvida em uma pergunta que possa ser pesquisada.",
            minutes,
        ),
        task(
            `Estudar os fundamentos de ${subject} em fonte confiável`,
            "Uma base organizada reduz a dependência de exemplos prontos.",
            "Escolha uma fonte primária ou material de referência, faça anotações com suas palavras e reproduza um exemplo pequeno mudando os dados.",
            minutes,
        ),
        task(
            `Praticar ${subject} sem acompanhar o passo a passo`,
            "A tentativa independente mostra onde a compreensão ainda quebra.",
            "Feche a referência, resolva um exercício curto e pesquise somente a dúvida específica que impedir seu avanço.",
            minutes,
        ),
        task(
            `Aplicar ${subject} em uma entrega pequena`,
            "Produzir algo verificável consolida o aprendizado e mostra progresso real.",
            "Crie uma entrega simples, teste o resultado e registre o que funcionou, o que falhou e qual será a próxima melhoria.",
            minutes,
        ),
    ];
}

/** Plano de refatoração serve para interface, documento, processo ou código. */
function createRefactorTasks(profile: ObjectiveProfile, minutes: number): PlannedTask[] {
    const requirements = describeRequirements(profile);
    const headline = requirementHeadline(profile.requirements, profile.subject);
    return [
        task(
            `Auditar o estado atual: ${profile.subject}`,
            "Uma refatoração segura começa distinguindo problema real de preferência pessoal.",
            `Mapeie os itens afetados e registre o estado atual com evidências. Confira especialmente estes requisitos: ${requirements}.`,
            minutes,
        ),
        task(
            `Definir critérios para ${headline}`,
            "Critérios observáveis impedem mudanças sem direção e facilitam a revisão.",
            "Descreva o resultado esperado, as regras que precisam ser preservadas e como cada requisito será considerado aprovado antes de alterar qualquer coisa.",
            minutes,
        ),
        task(
            `Refatorar por partes: ${profile.subject}`,
            "Mudanças menores permitem comparar, corrigir e voltar atrás com menos risco.",
            `Aplique um requisito por vez, começando pelo que afeta mais partes. Após cada alteração, compare com o estado anterior e registre a decisão tomada: ${requirements}.`,
            minutes,
        ),
        task(
            `Validar resultado e requisitos: ${profile.subject}`,
            "A última etapa confirma o resultado completo, não apenas a ausência de erros visíveis.",
            "Faça uma revisão final em diferentes cenários, confira cada item do checklist, registre pendências e guarde evidências de antes e depois.",
            minutes,
        ),
    ];
}

/** Plano de criação transforma uma ideia em escopo, rascunho, versão e revisão. */
function createCreationTasks(profile: ObjectiveProfile, minutes: number): PlannedTask[] {
    const requirements = describeRequirements(profile);
    return [
        task(
            `Definir o resultado mínimo de ${profile.subject}`,
            "Um escopo pequeno e explícito evita começar por detalhes secundários.",
            `Escreva quem usará o resultado, qual problema será resolvido e o que precisa existir na primeira versão. Inclua: ${requirements}.`,
            minutes,
        ),
        task(
            `Organizar referências e estrutura de ${profile.subject}`,
            "Referências confiáveis e uma estrutura inicial reduzem retrabalho.",
            "Reúna até três referências, compare padrões úteis e monte um rascunho com as partes essenciais antes de produzir a versão completa.",
            minutes,
        ),
        task(
            `Produzir a primeira versão de ${profile.subject}`,
            "Uma versão utilizável gera aprendizado mais rápido que planejamento infinito.",
            "Construa primeiro o fluxo principal, marque decisões provisórias e deixe melhorias opcionais fora desta rodada.",
            minutes,
        ),
        task(
            `Testar e revisar ${profile.subject}`,
            "A revisão baseada em critérios encontra problemas que o autor deixa passar.",
            `Simule o uso real, confira os requisitos — ${requirements} — e faça somente as correções necessárias para fechar a primeira versão.`,
            minutes,
        ),
    ];
}

/** Plano de correção separa sintoma, causa, mudança e prevenção. */
function createFixTasks(profile: ObjectiveProfile, minutes: number): PlannedTask[] {
    const requirements = describeRequirements(profile);
    return [
        task(
            `Reproduzir e delimitar o problema em ${profile.subject}`,
            "Um sintoma reproduzível evita corrigir a parte errada.",
            `Registre o que acontece, o resultado esperado e as condições em que o problema aparece. Considere também: ${requirements}.`,
            minutes,
        ),
        task(
            `Encontrar a causa principal em ${profile.subject}`,
            "Separar causa de consequência evita uma correção temporária.",
            "Compare um cenário que funciona com outro que falha, altere uma variável por vez e registre a evidência que confirma ou elimina cada hipótese.",
            minutes,
        ),
        task(
            `Aplicar a menor correção segura em ${profile.subject}`,
            "Uma mudança focada reduz efeitos colaterais e facilita a validação.",
            "Corrija primeiro a causa confirmada, preserve o comportamento que já funciona e registre exatamente o que mudou e por quê.",
            minutes,
        ),
        task(
            `Validar a correção e prevenir regressões`,
            "Testar o caso original e casos próximos confirma que o problema não foi deslocado.",
            "Repita o cenário inicial, teste limites relacionados e crie um checklist, teste ou registro que ajude a detectar o mesmo problema no futuro.",
            minutes,
        ),
    ];
}

/** Plano de pesquisa prioriza pergunta, fonte, comparação e síntese. */
function createResearchTasks(profile: ObjectiveProfile, minutes: number): PlannedTask[] {
    return [
        task(
            `Definir as perguntas centrais sobre ${profile.subject}`,
            "Perguntas claras impedem que a pesquisa vire apenas acúmulo de links.",
            "Escreva de três a cinco perguntas que a pesquisa precisa responder e defina quais evidências seriam suficientes para cada uma.",
            minutes,
        ),
        task(
            `Buscar fontes confiáveis sobre ${profile.subject}`,
            "A qualidade da conclusão depende da origem e da atualidade das informações.",
            "Priorize fontes primárias, instituições reconhecidas e materiais com autoria e data. Registre o link e a pergunta respondida por cada fonte.",
            minutes,
        ),
        task(
            `Comparar evidências e divergências sobre ${profile.subject}`,
            "Comparar fontes reduz o risco de aceitar uma única opinião como fato.",
            "Monte uma tabela com afirmação, evidência, fonte, data e limitações. Marque pontos de acordo e contradições que exigem nova busca.",
            minutes,
        ),
        task(
            `Sintetizar uma conclusão útil sobre ${profile.subject}`,
            "A síntese transforma pesquisa em uma decisão ou próximo passo.",
            "Responda às perguntas iniciais com suas palavras, indique o nível de confiança e liste o que ainda não pode ser concluído.",
            minutes,
        ),
    ];
}

/** Plano de preparação organiza critérios, material, ensaio e checagem final. */
function createPreparationTasks(profile: ObjectiveProfile, minutes: number): PlannedTask[] {
    const requirements = describeRequirements(profile);
    return [
        task(
            `Mapear o que será exigido em ${profile.subject}`,
            "Conhecer critérios e restrições permite praticar o que realmente importa.",
            `Liste resultado esperado, prazo, formato e pontos obrigatórios. Inclua estes requisitos: ${requirements}.`,
            minutes,
        ),
        task(
            `Preparar os materiais essenciais para ${profile.subject}`,
            "Ter o necessário organizado reduz interrupções durante a execução.",
            "Reúna referências, documentos e recursos indispensáveis; descarte materiais duplicados e deixe uma ordem clara de uso.",
            minutes,
        ),
        task(
            `Simular a execução de ${profile.subject}`,
            "O ensaio revela lacunas que uma leitura passiva não mostra.",
            "Faça uma tentativa nas condições mais próximas do cenário real, marque dificuldades e corrija primeiro os pontos de maior impacto.",
            minutes,
        ),
        task(
            `Fazer a checagem final de ${profile.subject}`,
            "Uma revisão curta protege contra esquecimentos de última hora.",
            "Use um checklist com critérios, materiais, prazo e plano alternativo. Encerre quando todos os itens obrigatórios tiverem evidência de conclusão.",
            minutes,
        ),
    ];
}

/** Plano de organização transforma volume solto em prioridade, agenda e revisão. */
function createOrganizationTasks(profile: ObjectiveProfile, minutes: number): PlannedTask[] {
    return [
        task(
            `Levantar pendências e recursos: ${profile.subject}`,
            "Uma visão completa evita organizar apenas o que está mais visível.",
            "Liste compromissos, recursos, pendências e restrições sem tentar ordenar. Depois remova duplicados e marque o que tem prazo.",
            minutes,
        ),
        task(
            `Priorizar as próximas ações: ${profile.subject}`,
            "Prioridade combina impacto, urgência e esforço, não apenas ordem de chegada.",
            "Classifique os itens por impacto e urgência, escolha no máximo três prioridades e explique por que o restante pode esperar.",
            minutes,
        ),
        task(
            `Distribuir em blocos executáveis: ${profile.subject}`,
            "Blocos pequenos tornam o plano compatível com o tempo realmente disponível.",
            "Quebre cada prioridade em uma ação com verbo, resultado esperado e duração. Coloque os blocos mais difíceis no período de maior energia.",
            minutes,
        ),
        task(
            `Revisar e ajustar a organização: ${profile.subject}`,
            "Um plano útil muda quando a realidade mostra novas restrições.",
            "Ao final do primeiro ciclo, registre o que foi concluído, o que travou e qual ajuste de prioridade ou duração será feito no próximo.",
            minutes,
        ),
    ];
}

/** Plano neutro para objetivos que não encaixam com segurança nas demais intenções. */
function createExecutionTasks(profile: ObjectiveProfile, minutes: number): PlannedTask[] {
    const requirements = describeRequirements(profile);
    return [
        task(
            `Definir o resultado esperado de ${profile.subject}`,
            "Um resultado observável dá direção e deixa claro quando a tarefa terminou.",
            `Escreva o estado atual, o resultado final e os limites da execução. Considere: ${requirements}.`,
            minutes,
        ),
        task(
            `Preparar recursos e próximos passos de ${profile.subject}`,
            "Antecipar dependências reduz paradas e decisões improvisadas.",
            "Liste materiais, informações, pessoas e decisões necessárias; resolva primeiro o bloqueio que impede todas as outras ações.",
            minutes,
        ),
        task(
            `Executar a parte principal de ${profile.subject}`,
            "Trabalhar em uma entrega por vez mantém o progresso visível.",
            "Faça a menor versão que já produz resultado, registre decisões importantes e deixe itens opcionais para uma rodada posterior.",
            minutes,
        ),
        task(
            `Conferir e encerrar ${profile.subject}`,
            "A conferência final evita considerar concluído algo que ainda tem requisito aberto.",
            "Compare o resultado com os critérios iniciais, teste os cenários relevantes e registre pendências com responsável ou próximo passo.",
            minutes,
        ),
    ];
}

/** Escolhe o template pela intenção detectada, e não pelo assunto do pedido. */
export function createFallbackPlan(input: PlannerInput): StudyPlan {
    const profile = analyzeObjective(input.objective);
    const minutes = getSessionMinutes(input.dailyMinutes);
    const factories: Record<GoalIntent, () => PlannedTask[]> = {
        learn: () => createLearningTasks(profile, minutes),
        refactor: () => createRefactorTasks(profile, minutes),
        create: () => createCreationTasks(profile, minutes),
        fix: () => createFixTasks(profile, minutes),
        research: () => createResearchTasks(profile, minutes),
        prepare: () => createPreparationTasks(profile, minutes),
        organize: () => createOrganizationTasks(profile, minutes),
        execute: () => createExecutionTasks(profile, minutes),
    };

    return {
        introduction: `O plano foi dividido em quatro entregas progressivas para ${profile.focus}. Cada bloco cabe em até ${minutes} minutos e termina com um resultado que pode ser conferido.`,
        tips: [
            `Use estes requisitos como checklist durante o plano: ${describeRequirements(profile)}.`,
            "Guarde uma evidência curta de cada etapa — anotação, foto, arquivo, teste ou comparação — para não depender da memória.",
            "Se uma etapa ultrapassar o tempo disponível, pare em um ponto registrável e transforme o restante na próxima ação.",
        ],
        tasks: factories[profile.intent](),
    };
}

/** Detecta conteúdo de exemplo antes que ele chegue à tela. */
function containsPlaceholder(text: string): boolean {
    const normalized = normalizeForComparison(text);
    return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(normalized));
}

/** Detecta uma interpretação jurídica somente quando o pedido não era jurídico. */
function containsUnexpectedLegalTopic(text: string, profile: ObjectiveProfile): boolean {
    if (profile.explicitLegalTopic) return false;
    return /\b(juridic\w*|advocacia|direito civil|direito penal|constituicao|legislacao|leis?)\b/.test(
        normalizeForComparison(text),
    );
}

/**
 * Comparar palavra inteira reprovava a etapa certa por causa de flexão:
 * "organizo" não casava com "organizar", nem "casas" com "casa". Quatro letras
 * de radical bastam para reconhecer a mesma palavra sem exigir a mesma forma.
 */
const KEYWORD_STEM_LENGTH = 4;

/** Trata duas palavras como a mesma quando compartilham o radical. */
function sharesRadical(word: string, otherWord: string): boolean {
    if (word === otherWord) return true;
    if (Math.min(word.length, otherWord.length) < KEYWORD_STEM_LENGTH) return false;

    return (
        word.slice(0, KEYWORD_STEM_LENGTH) ===
        otherWord.slice(0, KEYWORD_STEM_LENGTH)
    );
}

/** Confere se ao menos uma palavra importante do pedido aparece na etapa. */
function staysOnTopic(taskToCheck: PlannedTask, profile: ObjectiveProfile): boolean {
    if (profile.keywords.length === 0) return true;
    const taskWords = extractKeywords(
        `${taskToCheck.title} ${taskToCheck.reason} ${taskToCheck.howToStudy}`,
    );

    return profile.keywords.some((keyword) =>
        taskWords.some((taskWord) => sharesRadical(taskWord, keyword)),
    );
}

/**
 * Fuga de assunto é característica do plano, não de cada etapa. Uma etapa como
 * "Definir cronograma e recursos" pertence ao pedido sem repetir nenhuma palavra
 * dele, então exigir a palavra literal em cada uma descartava plano bom.
 *
 * Exigir metade ainda reprovava demais: um plano coeso costuma citar o assunto
 * na primeira etapa e seguir em pronomes. Uma âncora já separa o modelo que
 * respondeu ao pedido daquele que trocou de assunto — que é o único caso que
 * esta regra existe para pegar.
 */
function planStaysOnTopic(tasks: PlannedTask[], profile: ObjectiveProfile): boolean {
    if (profile.keywords.length === 0 || tasks.length === 0) return true;

    return tasks.some((item) => staysOnTopic(item, profile));
}

/** Rejeita títulos que apenas repetem o pedido inteiro em vez de nomear uma ação. */
function hasFocusedTitle(title: string, input: PlannerInput): boolean {
    const normalizedTitle = normalizeForComparison(title);
    const normalizedObjective = normalizeForComparison(input.objective);
    const copiedMostOfObjective =
        normalizedTitle.length > 70 &&
        normalizedObjective.includes(normalizedTitle.slice(0, 60));

    return title.trim().length >= 8 && title.trim().length <= 100 && !copiedMostOfObjective;
}

/**
 * Radicais de ação, e não imperativos fechados. Um texto bem escrito conjuga o
 * verbo — "listar", "anotadas", "simulação", "Realize" — e a lista antiga só
 * aceitava a forma exata, reprovando plano bom por causa da conjugação.
 */
const ACTION_STEMS = [
    "anot",
    "aplic",
    "assist",
    "avali",
    "classific",
    "compar",
    "confer",
    "confir",
    "convers",
    "defin",
    "descrev",
    "divid",
    "escolh",
    "escrev",
    "escut",
    "execut",
    "identific",
    "list",
    "mape",
    "marc",
    "mont",
    "organiz",
    "ouc",
    "ouv",
    "pesquis",
    "pratic",
    "prepar",
    "realiz",
    "registr",
    "reproduz",
    "respond",
    "reun",
    "revis",
    "selecion",
    "simul",
    "test",
    "trein",
    "utiliz",
    "verific",
];

/**
 * Radicais curtos demais para virar prefixo solto: "cri" acharia "critério" e
 * "us" acharia qualquer coisa. Estes vão com as terminações escritas na mão.
 */
const ACTION_EXACT_FORMS =
    "cri(?:e|ar|ando|ad[oa]s?)|fa(?:ca|zer|zendo)|us(?:e|ar|ando)|ajud\\w*|le(?:ia|r)";

/**
 * A lista curada acima cobre 39 radicais; o português tem milhares de verbos.
 * "Combine com sua prima", "Avise no sábado" e "Reserve o horário" eram todos
 * reprovados por ausência na lista, não por falta de ação.
 *
 * Este padrão reconhece a morfologia: infinitivo (-ar/-er/-ir) e gerúndio
 * (-ando/-endo/-indo). Ele aceita substantivos com a mesma terminação — "lugar",
 * "mulher" — e isso é aceitável: a regra existe para barrar orientação vaga, e
 * o tamanho mínimo já faz esse trabalho. Errar para o lado de aceitar o texto
 * da IA é exatamente a troca que este projeto quer.
 */
const VERB_MORPHOLOGY = "\\b\\w{3,}(?:ando|endo|indo)\\b|\\b\\w{4,}(?:ar|er|ir)\\b";

const ACTION_PATTERN = new RegExp(
    `\\b(?:${ACTION_STEMS.join("|")})\\w*|\\b(?:${ACTION_EXACT_FORMS})\\b|${VERB_MORPHOLOGY}`,
);

/** Tamanho do plano de regras, e o alvo quando é preciso completar a IA. */
const PLAN_TASK_COUNT = 4;

/**
 * A partir daqui o plano da IA vale sozinho, sem completar com etapa de regra.
 * Três etapas pensadas para o pedido real valem mais que quatro genéricas.
 */
const MIN_AI_TASKS = 2;

/** Teto só para uma resposta prolixa não virar uma lista sem fim na tela. */
const MAX_AI_TASKS = 6;

/** Uma frase curta já justifica a ordem; exigir mais só reprovava texto bom. */
const MIN_REASON_LENGTH = 28;

/**
 * Medido no Qwen3-0.6B: ele escreve orientações de 45 a 55 caracteres. A régua
 * fica abaixo da menor medição de propósito — o objetivo é barrar texto vazio,
 * não reprovar uma instrução curta porém concreta. O valor original, 70,
 * reprovava 100% das respostas de um modelo desse porte.
 */
const MIN_GUIDANCE_LENGTH = 35;

/**
 * Nomeia a primeira regra que reprovou a etapa, ou `null` se ela passou.
 * Um booleano diz que o plano foi recusado; isto diz por quê.
 */
function describeTaskRejection(
    taskToCheck: PlannedTask,
    input: PlannerInput,
    profile: ObjectiveProfile,
): string | null {
    const completeText = `${taskToCheck.title} ${taskToCheck.reason} ${taskToCheck.howToStudy}`;
    const reasonLength = taskToCheck.reason.trim().length;
    const guidanceLength = taskToCheck.howToStudy.trim().length;

    /** O tema é conferido no plano inteiro por `planStaysOnTopic`, não aqui. */
    if (containsPlaceholder(completeText)) return "texto de exemplo (placeholder)";
    if (containsUnexpectedLegalTopic(completeText, profile)) {
        return "virou assunto jurídico sem o pedido ser jurídico";
    }
    if (!hasFocusedTitle(taskToCheck.title, input)) {
        return `título com ${taskToCheck.title.trim().length} caracteres fora da faixa 8–100, ou repetindo o pedido`;
    }
    /**
     * `reason` vazio é resultado do descarte de duplicata feito na leitura, não
     * descuido do modelo. A etapa continua válida pelo `howToStudy`, que é a
     * parte acionável — recusá-la aqui devolveria o plano genérico à tela.
     */
    if (reasonLength > 0 && reasonLength < MIN_REASON_LENGTH) {
        return `reason curto: ${reasonLength}/${MIN_REASON_LENGTH} caracteres`;
    }
    if (guidanceLength < MIN_GUIDANCE_LENGTH) {
        return `howToStudy curto: ${guidanceLength}/${MIN_GUIDANCE_LENGTH} caracteres`;
    }
    if (!ACTION_PATTERN.test(normalizeForComparison(taskToCheck.howToStudy))) {
        return "howToStudy sem nenhum verbo de ação reconhecido";
    }

    return null;
}

/** Aprova apenas etapas específicas, detalhadas e conectadas ao pedido. */
function isValidGeneratedTask(
    taskToCheck: PlannedTask,
    input: PlannerInput,
    profile: ObjectiveProfile,
): boolean {
    return describeTaskRejection(taskToCheck, input, profile) === null;
}

/** Remove Markdown ou raciocínio extra antes de tentar interpretar o JSON. */
function extractJson(rawText: string): string {
    const withoutFence = rawText
        .replace(/^\s*```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();
    const firstBrace = withoutFence.indexOf("{");
    const lastBrace = withoutFence.lastIndexOf("}");

    return firstBrace >= 0 && lastBrace > firstBrace
        ? withoutFence.slice(firstBrace, lastBrace + 1)
        : withoutFence;
}

/** Converte a resposta desconhecida em tipos seguros, sem confiar no TypeScript. */
function parseGeneratedPlan(rawText: string, input: PlannerInput): StudyPlan {
    const data: unknown = JSON.parse(extractJson(rawText));
    if (!data || typeof data !== "object" || !("tasks" in data)) {
        throw new Error("Resposta sem uma lista de tarefas.");
    }

    const candidatePlan = data as {
        introduction?: unknown;
        tips?: unknown;
        tasks?: unknown;
    };
    if (!Array.isArray(candidatePlan.tasks)) {
        throw new Error("A lista de tarefas não é válida.");
    }

    const minutes = getSessionMinutes(input.dailyMinutes);
    const tasks = candidatePlan.tasks
        .filter((item) => Boolean(item) && typeof item === "object")
        .map((item) => {
            const candidate = item as Partial<PlannedTask>;
            if (
                typeof candidate.title !== "string" ||
                typeof candidate.reason !== "string" ||
                typeof candidate.howToStudy !== "string"
            ) {
                return null;
            }
            const estimatedMinutes = Number(candidate.estimatedMinutes);
            const reason = candidate.reason.trim();
            const howToStudy = candidate.howToStudy.trim();
            /**
             * O prompt pede coisas diferentes nos dois campos: `reason` justifica
             * a posição da etapa e `howToStudy` diz como executá-la. Um modelo
             * pequeno copia a mesma frase nos dois, e a tela mostrava o texto
             * repetido como se fosse conteúdo. Fica o acionável; a cópia sai.
             */
            const isDuplicatedField =
                normalizeForComparison(reason) === normalizeForComparison(howToStudy);

            return {
                title: candidate.title.trim(),
                reason: isDuplicatedField ? "" : reason,
                howToStudy,
                estimatedMinutes: Number.isFinite(estimatedMinutes)
                    ? Math.min(minutes, Math.max(10, Math.round(estimatedMinutes)))
                    : minutes,
            } satisfies PlannedTask;
        })
        .filter((item): item is PlannedTask => item !== null);

    return {
        introduction:
            typeof candidatePlan.introduction === "string"
                ? candidatePlan.introduction.trim()
                : "",
        tips: (Array.isArray(candidatePlan.tips) ? candidatePlan.tips : [])
            .filter((tip): tip is string => typeof tip === "string")
            .map((tip) => tip.trim()),
        tasks,
    };
}

/** Mantém itens únicos enquanto preserva a ordem progressiva do plano. */
function uniqueTasks(tasks: PlannedTask[]): PlannedTask[] {
    return tasks.filter(
        (item, index, allItems) =>
            allItems.findIndex(
                (candidate) =>
                    normalizeForComparison(candidate.title) ===
                    normalizeForComparison(item.title),
            ) === index,
    );
}

/**
 * A IA escreve o plano; as regras existem como rede, não como formato. Uma
 * resposta vazia, genérica ou quebrada ainda termina em um plano utilizável,
 * mas qualquer etapa que o modelo acerte chega intacta à tela.
 */
export function createResilientPlan(rawText: string, input: PlannerInput): StudyPlan {
    const fallback = createFallbackPlan(input);
    const profile = analyzeObjective(input.objective);

    /** Sem texto nenhum modelo respondeu: não há recusa a explicar. */
    if (!rawText.trim()) {
        return { ...fallback, tasksOrigin: "fallback" };
    }

    let generated: StudyPlan;
    try {
        generated = parseGeneratedPlan(rawText, input);
    } catch (caughtError) {
        const detail =
            caughtError instanceof Error ? caughtError.message : "erro desconhecido";

        return {
            ...fallback,
            tasksOrigin: "fallback",
            /** JSON cortado no meio é o sintoma clássico de `max_tokens` curto. */
            rejectionReason: `a resposta não é um JSON completo (${detail}) — provavelmente foi cortada antes do fim`,
        };
    }

    const isPresentableText = (text: string): boolean =>
        text.trim().length >= 35 &&
        !containsPlaceholder(text) &&
        !containsUnexpectedLegalTopic(text, profile);

    /**
     * As dicas da IA valem todas. Antes duas das três vinham sempre do plano de
     * regras, então mesmo um plano 100% da IA exibia dois textos genéricos fixos.
     */
    const generatedTips = generated.tips.filter(isPresentableText);

    /** Guarda a regra que barrou cada etapa antes de descartá-las. */
    const rejections = generated.tasks
        .map((item) => describeTaskRejection(item, input, profile))
        .filter((item): item is string => item !== null);
    const approvedTasks = uniqueTasks(
        generated.tasks.filter((item) => isValidGeneratedTask(item, input, profile)),
    );

    const staysOnTopic = planStaysOnTopic(approvedTasks, profile);

    /**
     * A ordem de preferência é a IA primeiro. O plano de regras deixou de ser o
     * formato obrigatório e virou rede de segurança: ele só aparece quando o
     * modelo não entregou nada aproveitável.
     *
     * Isso inclui abrir mão das quatro etapas fixas. Um plano com três etapas
     * pensadas para o pedido real é melhor que quatro moldes preenchidos, e
     * completar um plano bom só para bater a contagem devolvia a genérica à tela.
     */
    let tasks: PlannedTask[];
    let tasksOrigin: NonNullable<StudyPlan["tasksOrigin"]>;
    let rejectionReason: string | undefined;

    if (!staysOnTopic) {
        tasks = fallback.tasks;
        tasksOrigin = "fallback";
        /** Sem as palavras esperadas a recusa é impossível de conferir. */
        rejectionReason = `nenhuma etapa citou o assunto do pedido (procurava o radical de: ${profile.keywords.join(", ") || "nenhuma palavra-chave extraída"})`;
    } else if (approvedTasks.length === 0) {
        /** Só aqui o plano de regras assume sozinho: a IA não entregou nada usável. */
        tasks = fallback.tasks;
        tasksOrigin = "fallback";
        rejectionReason = `nenhuma das ${generated.tasks.length} etapas passou — ${rejections.join("; ") || "sem detalhe"}`;
    } else if (approvedTasks.length >= MIN_AI_TASKS) {
        /** O plano é da IA e do tamanho que ela julgou necessário. */
        tasks = approvedTasks.slice(0, MAX_AI_TASKS);
        tasksOrigin = "ai";

        /** Etapas recusadas ainda interessam: são o sinal para ajustar o prompt. */
        if (rejections.length) {
            rejectionReason = `${rejections.length} etapa(s) da IA descartadas — ${rejections.join("; ")}`;
        }
    } else {
        /**
         * Uma única etapa aprovada não sustenta um plano, mas jogá-la fora seria
         * voltar ao genérico. O complemento vem do FIM do plano de regras: as
         * últimas etapas são execução e conferência, que fecham bem depois da IA.
         * Puxar do início traria "Definir o resultado esperado" para a última
         * posição e quebraria a progressão.
         */
        const missing = PLAN_TASK_COUNT - approvedTasks.length;
        tasks = [...approvedTasks, ...fallback.tasks.slice(-missing)];
        tasksOrigin = "mixed";
        rejectionReason = `${missing} etapa(s) completadas pelas regras — ${rejections.join("; ") || "a IA devolveu menos etapas do que o pedido"}`;
    }

    return {
        /** A introdução da IA fala do assunto real; a local entra se ela reprovar. */
        introduction: isPresentableText(generated.introduction)
            ? generated.introduction.trim()
            : fallback.introduction,
        /** O plano de regras só escreve as dicas quando a IA não escreveu nenhuma. */
        tips: generatedTips.length ? generatedTips.slice(0, 3) : fallback.tips,
        tasks,
        tasksOrigin,
        rejectionReason,
    };
}

/** Nome amigável da intenção para o prompt em português. */
function intentLabel(intent: GoalIntent): string {
    const labels: Record<GoalIntent, string> = {
        learn: "aprender ou desenvolver habilidade",
        refactor: "refatorar ou revisar algo existente",
        create: "criar uma primeira versão",
        fix: "corrigir ou melhorar um problema",
        research: "pesquisar e chegar a uma conclusão",
        prepare: "preparar-se para uma situação",
        organize: "organizar rotina, recursos ou prioridades",
        execute: "executar um objetivo geral",
    };
    return labels[intent];
}

/**
 * Monta um prompt geral e sem valores de exemplo. Isso impede o modelo pequeno
 * de copiar "estratégia curta" ou "dica prática" para a resposta final.
 */
export function createPlannerPrompt(input: PlannerInput): string {
    const profile = analyzeObjective(input.objective);
    const contextLabels: Record<PlannerContext, string> = {
        today: "planejamento do dia",
        tasks: "organização de tarefas",
        study: "estudos e desenvolvimento pessoal",
        internship: "trabalho e estágio",
    };

    return `Você cria planos práticos para qualquer assunto da vida pessoal, acadêmica ou profissional.

PEDIDO ORIGINAL: ${input.objective}
LEITURA JÁ FEITA PELO APLICATIVO:
- intenção: ${intentLabel(profile.intent)}
- foco central: ${profile.focus}
- assunto curto: ${profile.subject}
- requisitos obrigatórios: ${profile.requirements.join(" | ") || "nenhum requisito adicional explícito"}
- domínio provável: ${profile.domain}
- contexto da tela: ${contextLabels[input.context ?? "study"]}
- prazo: ${input.deadline || "não informado"}
- duração máxima de cada etapa: ${getSessionMinutes(input.dailyMinutes)} minutos

Crie de 3 a 5 etapas em ordem de execução — quantas o pedido realmente exigir. Cada etapa deve produzir um resultado verificável e cobrir os requisitos obrigatórios.
Não presuma que o assunto é tecnologia. Não transforme uma expressão ambígua em outra profissão ou área sem evidência no pedido.
Não copie o pedido inteiro nos títulos. Não use frases genéricas, placeholders, URLs ou nomes inventados de cursos e profissionais.
Cada reason deve explicar, em uma frase completa, por que esta etapa vem nesta posição.
Cada howToStudy deve ter duas ou três frases e responder três coisas: o que fazer, com qual material ou pessoa, e como saber que a etapa terminou.
Escreva somente em português brasileiro.

Retorne apenas um objeto JSON. O objeto raiz precisa ter as chaves introduction, tips e tasks. Tips deve conter 3 strings. Tasks deve conter de 3 a 5 objetos, cada um com title, reason, estimatedMinutes e howToStudy. Não escreva Markdown nem texto fora do JSON.`;
}

/**
 * Cria buscas curtas a partir da interpretação, não da frase inteira digitada.
 * Os complementos variam entre aprender, executar e pesquisar.
 */
export function createResourceSearchQuery(
    objective: string,
    taskTitle: string,
    provider: "google" | "youtube",
): string {
    const profile = analyzeObjective(objective);
    const requirement = requirementHeadline(profile.requirements, "");
    const googleHints: Partial<Record<GoalIntent, string>> = {
        learn: "guia fundamentos exercícios fontes confiáveis",
        refactor:
            profile.domain === "design e produto"
                ? "auditoria visual design system acessibilidade referências"
                : "refatoração checklist validação boas práticas",
        create: "referências checklist critérios primeira versão",
        fix: "diagnóstico causa raiz checklist validação",
        research: "fontes confiáveis referências dados oficiais",
        prepare: "checklist preparação critérios exemplos",
        organize:
            profile.domain === "viagem"
                ? "roteiro orçamento checklist planejamento"
                : "método prioridades checklist planejamento",
        execute: "boas práticas checklist referências",
    };
    const sensitiveDomain =
        profile.domain === "saúde" ||
        profile.domain === "finanças" ||
        profile.domain === "jurídico";
    const sourceHint =
        provider === "youtube"
            ? `${intentLabel(profile.intent)} passo a passo estudo de caso português`
            : sensitiveDomain
                ? "fontes oficiais orientação profissional referências"
                : googleHints[profile.intent] ?? "boas práticas checklist referências";
    const parts = [profile.subject, requirement, taskTitle, sourceHint]
        .map((part) => part.trim())
        .filter(Boolean);
    const seenWords = new Set<string>();

    /** Mantém a primeira ocorrência de cada palavra para evitar assunto duplicado. */
    const compactWords = parts
        .join(" ")
        .replace(/[.,;:!?()[\]{}]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .filter((word) => {
            const normalizedWord = normalizeForComparison(word);
            if (STOP_WORDS.has(normalizedWord) || seenWords.has(normalizedWord)) {
                return false;
            }
            seenWords.add(normalizedWord);
            return true;
        });

    return compactWords.join(" ").slice(0, 220);
}
