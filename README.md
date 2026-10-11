# DevTrack

MVP pessoal, offline-first, para organizar tarefas da faculdade, sessões de estudo e o diário de estágio. Ele nasceu para a minha própria rotina, mas foi pensado de um jeito que pode ser disponibilizado para outras pessoas que vivem esse mesmo corre.

## O que já funciona

- Criar e concluir tarefas por área: faculdade, estágio ou pessoal.
- Registrar minutos de estudo e visualizar o foco do dia.
- Criar registros de aprendizados e bloqueios do estágio.
- Persistir tudo no `IndexedDB`, mesmo sem login ou internet.
- Guardar cada alteração numa fila local de sincronização para uma API futura.
- Abrir novamente sem internet depois da primeira visita online, por meio do service worker.
- Animações de transição e modal com Framer Motion.
- Ícone próprio para PWA e iPhone em `public/apple-touch-icon.png`.

## Rodar localmente

```bash
npm install
npm run dev
```

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
| `src/pages/home.tsx` | Controla a tela ativa, os modais e transforma os dados em JSX. |
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

## Próximo desafio

Implemente o `SyncService` sem mexer na tela:

1. Crie uma função que lê a fila no `offlineDatabase`.
2. Envie cada operação para uma rota do Spring Boot.
3. Apague da fila apenas se o `fetch` retornar sucesso.
4. Chame essa função no evento `window.addEventListener("online", ...)`.

Pegadinha: não limpe a fila antes de receber a resposta da API. Se a rede cair no meio, você perderia uma alteração local — exatamente o erro que offline-first evita.
