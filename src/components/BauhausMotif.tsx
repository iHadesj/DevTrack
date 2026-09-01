import { BauhausMotifShell } from "../styles";

/** Contextos mudam escala e posição sem duplicar as formas geométricas. */
export type BauhausMotifVariant =
    | "page"
    | "hero"
    | "sidebar"
    | "promo"
    | "modal";

/** Props mantêm o componente exclusivamente decorativo e reutilizável. */
type BauhausMotifProps = {
    variant: BauhausMotifVariant;
};

/**
 * Composição vetorial feita com CSS: círculo, quadrado, barra, anel e arco.
 * `aria-hidden` impede leitores de tela de anunciarem elementos sem significado.
 */
export function BauhausMotif({ variant }: BauhausMotifProps) {
    return (
        <BauhausMotifShell $variant={variant} aria-hidden="true">
            <span className="shape-circle" />
            <span className="shape-square" />
            <span className="shape-bar" />
            <span className="shape-ring" />
            <span className="shape-arc" />
        </BauhausMotifShell>
    );
}
