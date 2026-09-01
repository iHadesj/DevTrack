import { BauhausBandShell, BauhausMotifShell, type MotifShape, type MotifVariant } from "../styles";

/** Contextos mudam escala e posição sem duplicar as formas geométricas. */
export type BauhausMotifVariant = MotifVariant;

/** Props mantêm o componente exclusivamente decorativo e reutilizável. */
type BauhausMotifProps = {
    variant: BauhausMotifVariant;
};

/**
 * A composição de cada contexto é dado, não CSS condicional.
 * Trocar a receita aqui muda a tela inteira sem tocar em nenhuma regra de estilo.
 */
const shapesByVariant: Record<BauhausMotifVariant, MotifShape[]> = {
    page: ["circle", "square", "bar", "ring", "dots", "cross"],
    hero: ["circle", "quarter", "bar", "ring", "triangle", "stripes"],
    sidebar: ["circle", "half", "dots"],
    promo: ["circle", "arc", "cross"],
    modal: ["circle", "quarter", "dots"],
    panel: ["circle", "bar", "dots"],
    stat: ["ring", "cross"],
    /* Listas longas ocupam a esquerda, então o motivo se encosta no alto à direita. */
    journal: ["circle", "half", "cross"],
    planner: ["circle", "arc", "cross"],
};

/**
 * Composição vetorial feita com CSS: círculo, meia-lua, quarto, quadrado,
 * triângulo, barra, anel, arco, trama de pontos, hachura e cruz.
 * `aria-hidden` impede leitores de tela de anunciarem elementos sem significado.
 */
export function BauhausMotif({ variant }: BauhausMotifProps) {
    return (
        <BauhausMotifShell className="bauhaus-motif" $variant={variant} aria-hidden="true">
            {shapesByVariant[variant].map((shape) => (
                <span key={shape} className={`shape-${shape}`} />
            ))}
        </BauhausMotifShell>
    );
}

/**
 * Régua horizontal feita de blocos primários: separa seções sem virar um `<hr>` comum.
 * Retângulo, círculo e triângulo aparecem na mesma escala, como no alfabeto da escola.
 */
export function BauhausBand() {
    return (
        <BauhausBandShell aria-hidden="true">
            <span className="band-bar" />
            <span className="band-dot" />
            <span className="band-block" />
            <span className="band-wedge" />
            <span className="band-rule" />
        </BauhausBandShell>
    );
}
