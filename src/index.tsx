import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

/** Monta a árvore React dentro da div `root` do index.html. */
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

/** Registra o service worker só em produção; no Vite dev ele atrapalharia o hot reload. */
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}
