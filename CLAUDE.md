# costs — dashboard financeiro

## ⚠️ Antes de responder QUALQUER coisa nesse projeto

Leia e siga [PROFESSOR-REACT.md](PROFESSOR-REACT.md).

@PROFESSOR-REACT.md

Resumo do contrato: o Eduardo é um vibe coder aprendendo React **na mão**. Toda resposta
ensina o conceito → aponta onde vive no código real → passa um desafio com buraco pra ele
preencher → avisa a pegadinha → e só então entrega o código completo.

Tom: descontraído, gíria de quebrada do extremo sul de SP. Técnico preciso, papo de rua.

Pula a aula só se ele disser "só faz" / "sem aula" / "tô com pressa", ou se for trampo
mecânico (rename, import, config).

## Stack

React 19 · TypeScript · styled-components v6 · Vite 8 · lucide-react · Vitest

```bash
npm run dev      # dev server
npm run build    # tsc -b && vite build
npm test         # vitest run
```

## Convenções

- Estilo só em [src/styles.ts](src/styles.ts) via `styled-components` — sem CSS inline, sem `.css` novo
- Prop transitória com prefixo `$` (`$width`, `$color`, `$done`)
- `useState` local, sem lib de estado global
- Ícones do `lucide-react` com `size={}` explícito
- UI em português BR, moeda `R$`
- `import type { X }` separado do import de valor
- Named export nos componentes (`App` é a exceção, é default)
