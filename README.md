# DevTrack

MVP offline-first para organizar tarefas da faculdade, sessões de estudo e o diário de estágio. Ele foi construído como material de estudo: os arquivos têm comentários explicando a responsabilidade de cada função e decisão principal.

## O que já funciona

- Criar e concluir tarefas por área: faculdade, estágio ou pessoal.
- Registrar minutos de estudo e visualizar o foco do dia.
- Criar registros de aprendizados e bloqueios do estágio.
- Persistir tudo no `IndexedDB`, mesmo sem login ou internet.
- Guardar cada alteração numa fila local de sincronização para uma API futura.
- Abrir novamente sem internet depois da primeira visita online, por meio do service worker.
- Animações de transição e modal com Framer Motion.
- Ícone próprio para PWA e iPhone em `public/apple-touch-icon.png`.
- Planejador de estudos com IA local opcional: sugere tarefas para revisão antes de salvar.

## Rodar localmente

```bash
npm install
npm run dev
```

O assistente na nuvem também funciona em desenvolvimento: copie `.env.example` para
`.env.local`, preencha `GEMINI_API_KEY` e reinicie o `npm run dev`. O `vite` sozinho não
executa a pasta `api`, então um plugin em `vite.config.ts` roda a mesma função
`api/plan.ts` que a Vercel usa em produção.

Para validar a versão de produção:

```bash
npm run build
npm run preview
```

## Mapa para estudar o código

| Arquivo | Papel no projeto |
| --- | --- |
| `src/interfaces.ts` | Define os modelos TypeScript: tarefa, estudo, diário e fila de sync. |
| `src/services/offlineDatabase.ts` | É a camada que conversa com o IndexedDB. Nenhum componente acessa o banco diretamente. |
| `src/hooks/useDevTrack.ts` | Junta regras de negócio e estado React: carregar, criar e atualizar. |
| `src/hooks/useLocalPlanner.ts` | Carrega o modelo local apenas sob demanda e valida as tarefas sugeridas. |
| `src/context/AssistantContext.tsx` | Mantém uma única IA carregada enquanto o usuário troca de aba. |
| `src/components/StudyPlanner.tsx` | Coleta objetivo e prazo; deixa você aprovar cada tarefa antes de persistir. |
| `src/components/AssistantModal.tsx` | Adapta o planejador ao contexto de Hoje, Tarefas, Estudos ou Estágio. |
| `src/pages/home.tsx` | Controla a tela ativa, modal aberto e transforma os dados em JSX. |
| `src/components/CreateModal.tsx` | Formulário controlado que cria os três tipos de registro. |
| `src/components/Modal.tsx` | Modal reutilizável e sua animação com Framer Motion. |
| `src/components/Sidebar.tsx` | Navegação entre Hoje, Tarefas, Estudos e Estágio. |
| `src/styles.ts` | Todos os `styled-components` e a identidade Bauhaus. |
| `public/sw.js` | Cache do app para reabrir sem rede. |

## Como o offline-first funciona

```text
Clique no formulário
        ↓
useDevTrack cria o objeto com UUID e data
        ↓
offlineDatabase salva no IndexedDB (funciona sem rede)
        ↓
offlineDatabase enfileira uma SyncOperation
        ↓
React atualiza a tela
        ↓
Futuro SyncService envia a fila para Spring Boot quando houver conexão
```

O ponto importante é a ordem: o usuário nunca espera o servidor para ver a mudança. Quando você criar a API, faça um `SyncService` ler `syncQueue`, enviar as operações e removê-las só depois de uma resposta de sucesso.

## IA local (beta)

O botão **Assistente** aparece em todas as abas e adapta o planejamento ao contexto atual. Na primeira utilização, o navegador precisa de internet para baixar os pesos e mostra o progresso real de 0% a 100%; depois, a geração roda localmente e o modelo fica no cache do navegador. O recurso exige WebGPU e aproximadamente 1,4 GB de memória de GPU, portanto alguns iPhones e navegadores não vão suportá-lo. O app continua completamente utilizável sem IA.

Cada plano inclui uma introdução, dicas gerais, explicação de como executar cada etapa e termos para encontrar materiais. O modelo não cria URLs: o DevTrack transforma os termos em buscas reais no Google e YouTube. A geração do plano continua offline, mas abrir materiais externos naturalmente exige internet.

Durante a geração, o WebLLM envia a resposta em streaming. A interface transforma os trechos recebidos em um progresso estimado, limitado a 94% até o JSON ser validado; o 100% só aparece quando o plano está realmente pronto. Um `system prompt` separado obriga introdução, dicas e tarefas a serem escritas em português brasileiro.

## Próximo desafio

Implemente o `SyncService` sem mexer na tela:

1. Crie uma função que lê a fila no `offlineDatabase`.
2. Envie cada operação para uma rota do Spring Boot.
3. Apague da fila apenas se o `fetch` retornar sucesso.
4. Chame essa função no evento `window.addEventListener("online", ...)`.

Pegadinha: não limpe a fila antes de receber a resposta da API. Se a rede cair no meio, você perderia uma alteração local — exatamente o erro que offline-first evita.
