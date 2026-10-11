import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Configuração enxuta do Vite para o app React. */
export default defineConfig({
    plugins: [react()],
});
