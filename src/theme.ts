/** Os dois temas usam a paleta Bauhaus: preto, creme, vermelho, azul e amarelo. */
export type ThemeMode = "light" | "dark";

/** Contrato de cores consumido pelos styled-components. */
export type AppTheme = { mode: ThemeMode; colors: { canvas: string; surface: string; ink: string; muted: string; line: string; red: string; blue: string; yellow: string; green: string; }; };

/** Tema claro Neo-Bauhaus: neutros suaves deixam as cores primárias respirarem. */
const lightTheme: AppTheme = { mode: "light", colors: { canvas: "#f4f3ee", surface: "#fffefa", ink: "#20231f", muted: "#70736c", line: "#dfe0d9", red: "#ec5b47", blue: "#4675bd", yellow: "#f4cc4d", green: "#82a98c" } };

/**
 * Dark com hierarquia: fundo quase preto, superfícies levemente elevadas e texto quente.
 * As cores de marca perdem um pouco de saturação para não cansar o olho à noite.
 */
const darkTheme: AppTheme = { mode: "dark", colors: { canvas: "#151714", surface: "#20231f", ink: "#f6f3ea", muted: "#b3b5ad", line: "#363a34", red: "#ef6d5a", blue: "#79a2de", yellow: "#f1cf63", green: "#9abd9f" } };

/** Mapa usado pelo App para escolher o tema de acordo com o estado atual. */
export const themes: Record<ThemeMode, AppTheme> = { light: lightTheme, dark: darkTheme };

/** Ensina ao TypeScript que `theme` dentro do styled-components segue `AppTheme`. */
declare module "styled-components" { export interface DefaultTheme extends AppTheme {} }
