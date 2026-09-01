import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/** Formato Web usado pela Vercel em `api/plan.ts`: entra Request, sai Response. */
type WebHandler = (request: Request) => Promise<Response>;

/**
 * Em produção a Vercel executa `api/plan.ts`. O `vite` sozinho serve arquivo e
 * módulo, não executa nada da pasta `api`, então em desenvolvimento a rota
 * `/api/plan` simplesmente não existe e o cliente cai no plano determinístico.
 *
 * Este plugin roda o MESMO handler dentro do dev server. Nenhuma regra de
 * negócio é duplicada: o arquivo da função continua sendo a única fonte.
 */
function apiDevMiddleware(env: Record<string, string>): Plugin {
    return {
        name: "devtrack-api-dev",
        /** No build não existe servidor para hospedar middleware. */
        apply: "serve",
        configureServer(server) {
            server.middlewares.use("/api/plan", async (req, res, next) => {
                if (req.method !== "POST") return next();

                /**
                 * A chave vive apenas neste processo Node. O bundle do navegador
                 * nunca a enxerga, porque só variáveis com prefixo `VITE_` são
                 * injetadas em `import.meta.env`.
                 *
                 * A checagem de valor é obrigatória: `process.env` guarda apenas
                 * strings, então atribuir `undefined` grava o texto "undefined" e
                 * o handler montaria a URL `models/undefined`.
                 */
                if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY ??= env.GEMINI_API_KEY;
                if (env.GEMINI_MODEL) process.env.GEMINI_MODEL ??= env.GEMINI_MODEL;

                try {
                    /** `ssrLoadModule` recarrega o arquivo a cada save, como o HMR. */
                    const loaded = await server.ssrLoadModule("/api/plan.ts");
                    const handler = loaded.default as WebHandler;

                    /** O `req` do Node é um stream; o handler espera o corpo inteiro. */
                    const chunks: Buffer[] = [];
                    for await (const chunk of req) chunks.push(chunk as Buffer);

                    const response = await handler(
                        new Request("http://localhost/api/plan", {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: Buffer.concat(chunks).toString("utf8"),
                        }),
                    );

                    res.statusCode = response.status;
                    response.headers.forEach((value, key) => res.setHeader(key, value));
                    res.end(await response.text());
                } catch (caughtError) {
                    /** Sem isto qualquer falha vira um 500 mudo, impossível de depurar. */
                    const detail =
                        caughtError instanceof Error
                            ? caughtError.message
                            : "erro desconhecido";

                    res.statusCode = 500;
                    res.setHeader("content-type", "application/json");
                    res.end(
                        JSON.stringify({ error: `Falha no /api/plan local: ${detail}` }),
                    );
                }
            });
        },
    };
}

export default defineConfig(({ mode }) => {
    /** Prefixo vazio carrega todas as variáveis do `.env.local`, inclusive sem `VITE_`. */
    const env = loadEnv(mode, process.cwd(), "");

    return { plugins: [react(), apiDevMiddleware(env)] };
});
