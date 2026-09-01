import { useEffect, useState } from "react";
import { ThemeProvider } from "styled-components";
import { AssistantProvider } from "./context/AssistantContext";
import { Home } from "./pages/home";
import { GlobalStyle, ResponsiveStyles } from "./styles";
import { themes, type ThemeMode } from "./theme";

/** Componente raiz: guarda só o tema e entrega o resto da aplicação para a Home. */
function App() {
    const [mode, setMode] = useState<ThemeMode>("light");
    const theme = themes[mode];

    /** Alterna o valor atual entre os dois temas disponíveis. */
    const toggleTheme = () => setMode((current) => (current === "light" ? "dark" : "light"));

    /** Mantém a barra do navegador alinhada com a cor do tema ativo. */
    useEffect(() => {
        document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.colors.canvas);
    }, [theme]);

    return (
        <ThemeProvider theme={theme}>
            <GlobalStyle />
            <ResponsiveStyles />
            <AssistantProvider>
                <Home mode={mode} onToggleTheme={toggleTheme} />
            </AssistantProvider>
        </ThemeProvider>
    );
}

export default App;
