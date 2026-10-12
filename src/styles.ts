import { createGlobalStyle, css } from "styled-components";
import styled from "styled-components";

/** Estilos globais: a fonte é local do sistema para o app continuar legível sem internet. */
export const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-width: 320px;
    overflow-x: hidden; 
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: ${({ theme }) => theme.colors.canvas};
    color: ${({ theme }) => theme.colors.ink}; }
    button,
    input,
    select, 
    textarea { font: inherit; } 
    button { cursor: pointer; }
      *,
  *::before,
  *::after {
    transition:
      color 220ms ease,
      background-color 220ms ease,
      border-color 220ms ease,
      fill 220ms ease,
      stroke 220ms ease;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      transition-duration: 0.01ms;
    }
  }
`;

const motifHost = css`
  position: relative;
  > *:not(.bauhaus-motif) {
    position: relative;
    z-index: 1;
  }
`;

const buttonMotion = css`
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    color 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease;
  &:active {
    transform: translateY(1px) scale(0.98);
  }
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.yellow};
    outline-offset: 3px;
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/** Casca principal: blocos, cores sólidas e geometria são referências diretas ao Bauhaus. */
export const AppShell = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  background: ${({ theme }) => theme.colors.canvas};
  /* Malha de pontos: o papel milimetrado que a Bauhaus usava para construir a forma. */
  background-image: radial-gradient(
    circle at 1px 1px,
    ${({ theme }) => theme.colors.line} 1px,
    transparent 0
  );
  background-size: 26px 26px;
`;
export const SidebarShell = styled.aside`
  ${motifHost};
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 28px 18px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #151713;
  color: #f8f3e8;
  border-right: 2px solid ${({ theme }) => theme.colors.ink};
`;
export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
  margin: 0 8px 18px;
  font-size: 23px;
  font-weight: 900;
  letter-spacing: -1.6px;
`;
export const BrandMark = styled.span`
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  background: ${({ theme }) => theme.colors.red};
  color: ${({ theme }) => theme.colors.canvas};
  border-radius: ${({ theme }) => theme.radii.round};
`;
export const SidebarNav = styled.nav`
  display: grid;
  gap: 7px;
`;
export const NavLabel = styled.p`
  margin: 0 9px 9px;
  color: #a8aa9f;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
`;
/** O item ativo ganha um bloco amarelo cheio e uma barra vermelha à esquerda. */
export const NavItem = styled.button<{ $active?: boolean }>`
  ${buttonMotion};
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px 10px 12px 14px;
  color: ${({ $active }) => ($active ? "#151713" : "#d7d8ce")};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.yellow : "transparent"};
  border: 0;
  border-radius: ${({ theme }) => theme.radii.block};
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? 800 : 600)};
  text-align: left;
  transition:
    transform 0.18s ease,
    color 0.22s ease,
    background 0.18s ease,
    border-color 0.22s ease;
  &::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 5px;
    content: "";
    background: ${({ $active, theme }) =>
      $active ? theme.colors.red : "transparent"};
  }
  &:hover {
    transform: translateX(4px);
    background: ${({ theme }) => theme.colors.blue};
    color: #151713;
  }
  &:active {
    transform: translateX(4px) translateY(1px) scale(0.98);
  }
`;
export const SidebarFooter = styled.div`
  margin-top: auto;
  display: grid;
  gap: 12px;
`;
export const OfflineBadge = styled.div`
  padding: 12px;
  border: 2px solid #45473f;
  border-radius: ${({ theme }) => theme.radii.block};
  color: #d7d8ce;
  font-size: 11px;
  line-height: 1.45;
  strong {
    display: flex;
    align-items: center;
    gap: 6px;
    color: ${({ theme }) => theme.colors.yellow};
  }
`;
export const MainContent = styled.main`
  ${motifHost};
  width: min(100%, 1280px);
  padding: 42px 54px 64px;
  margin: 0 auto;
`;
export const Topbar = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;
`;
export const Eyebrow = styled.span`
  display: block;
  margin-bottom: 9px;
  color: ${({ theme }) => theme.colors.muted};
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 1.3px;
`;
export const PageTitle = styled.h1`
  max-width: 650px;
  margin: 0;
  font-size: clamp(31px, 4vw, 48px);
  font-weight: 950;
  line-height: 0.98;
  letter-spacing: -3px;
`;

/** Contextos disponíveis para o motivo geométrico; cada um tem escala e recorte próprios. */
export type MotifVariant =
  | "page"
  | "hero"
  | "sidebar"
  | "modal"
  | "panel"
  | "stat"
  | "journal";
/** Vocabulário de formas primárias — o alfabeto visual da Bauhaus. */
export type MotifShape =
  | "circle"
  | "half"
  | "quarter"
  | "square"
  | "triangle"
  | "bar"
  | "ring"
  | "arc"
  | "dots"
  | "stripes"
  | "cross";

type MotifProps = { $variant: MotifVariant };
/** Escala de cada contexto: as formas são as mesmas, só o tamanho relativo muda. */
const motifScale: Record<MotifVariant, number> = {
  page: 0.72,
  hero: 1,
  sidebar: 0.38,
  modal: 0.46,
  panel: 0.44,
  stat: 0.3,
  journal: 0.5,
};
/** Recuo lateral por contexto, para o motivo não colidir com o texto do bloco. */
const motifShift: Record<MotifVariant, string> = {
  page: "6%",
  hero: "8%",
  sidebar: "0%",
  modal: "3%",
  panel: "4%",
  stat: "6%",
  journal: "5%",
};
/** Minimalismo é dosagem: o herói pode gritar, o painel só sussurra. */
const motifOpacity: Record<MotifVariant, number> = {
  page: 0.16,
  hero: 0.95,
  sidebar: 0.5,
  modal: 0.5,
  panel: 0.2,
  stat: 0.5,
  journal: 0.22,
};
/**
 * Camada decorativa absoluta — o pai precisa ter `position: relative`.
 * `pointer-events: none` garante que as formas nunca roubem clique do conteúdo.
 */
export const BauhausMotifShell = styled.span<MotifProps>`
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  overflow: hidden;
  pointer-events: none;
  --motif-scale: ${({ $variant }: MotifProps) => motifScale[$variant]};
  --motif-shift: ${({ $variant }: MotifProps) => motifShift[$variant]};
  opacity: ${({ $variant }: MotifProps) => motifOpacity[$variant]};

  span {
    position: absolute;
    display: block;
  }
  /* Círculo: a forma perfeita, sempre no alto à direita. */
  .shape-circle {
    top: calc(-9% * var(--motif-scale));
    right: var(--motif-shift);
    width: calc(196px * var(--motif-scale));
    height: calc(196px * var(--motif-scale));
    background: ${({ theme }) => theme.colors.yellow};
    border-radius: ${({ theme }) => theme.radii.round};
  }
  /* Meia-lua apoiada na base, como as colunas do cartaz de 1923. */
  .shape-half {
    bottom: 0;
    left: 24%;
    width: calc(132px * var(--motif-scale));
    height: calc(66px * var(--motif-scale));
    background: ${({ theme }) => theme.colors.red};
    border-radius: calc(132px * var(--motif-scale))
      calc(132px * var(--motif-scale)) 0 0;
  }
  /* Quarto de círculo ancorado na quina inferior esquerda. */
  .shape-quarter {
    bottom: 0;
    left: 0;
    width: calc(158px * var(--motif-scale));
    height: calc(158px * var(--motif-scale));
    background: ${({ theme }) => theme.colors.blue};
    border-radius: 0 100% 0 0;
  }
  .shape-square {
    bottom: 9%;
    left: var(--motif-shift);
    width: calc(112px * var(--motif-scale));
    height: calc(112px * var(--motif-scale));
    background: ${({ theme }) => theme.colors.blue};
    transform: rotate(14deg);
  }
  /* Triângulo puro via clip-path: nada de border hack. */
  .shape-triangle {
    top: 13%;
    left: 31%;
    width: calc(98px * var(--motif-scale));
    height: calc(86px * var(--motif-scale));
    background: ${({ theme }) => theme.colors.red};
    clip-path: polygon(50% 0, 100% 100%, 0 100%);
  }
  .shape-bar {
    top: 44%;
    left: -4%;
    width: calc(230px * var(--motif-scale));
    height: calc(22px * var(--motif-scale));
    background: ${({ theme }) => theme.colors.red};
    border-radius: ${({ theme }) => theme.radii.pill};
  }
  .shape-ring {
    right: 27%;
    bottom: calc(-11% * var(--motif-scale));
    width: calc(142px * var(--motif-scale));
    height: calc(142px * var(--motif-scale));
    background: transparent;
    border: calc(13px * var(--motif-scale)) solid
      ${({ theme }) => theme.colors.ink};
    border-radius: ${({ theme }) => theme.radii.round};
  }
  .shape-arc {
    top: 16%;
    right: 34%;
    width: calc(104px * var(--motif-scale));
    height: calc(52px * var(--motif-scale));
    background: ${({ theme }) => theme.colors.green};
    border-radius: calc(104px * var(--motif-scale))
      calc(104px * var(--motif-scale)) 0 0;
  }
  /* Trama de pontos: repetição modular, o lado "grid" da escola. */
  .shape-dots {
    right: 7%;
    bottom: 11%;
    width: calc(150px * var(--motif-scale));
    height: calc(112px * var(--motif-scale));
    background-image: radial-gradient(
      ${({ theme }) => theme.colors.ink} calc(2px * var(--motif-scale)),
      transparent calc(2.4px * var(--motif-scale))
    );
    background-size: calc(17px * var(--motif-scale))
      calc(17px * var(--motif-scale));
  }
  /* Hachura a 45°: a diagonal que dá movimento à composição estática. */
  .shape-stripes {
    top: 0;
    left: 2%;
    width: calc(96px * var(--motif-scale));
    height: calc(190px * var(--motif-scale));
    background-image: repeating-linear-gradient(
      45deg,
      ${({ theme }) => theme.colors.ink} 0 calc(3px * var(--motif-scale)),
      transparent calc(3px * var(--motif-scale)) calc(11px * var(--motif-scale))
    );
  }
  /* Cruz construída com dois gradientes — duas barras, zero markup extra. */
  .shape-cross {
    top: 21%;
    right: 9%;
    width: calc(58px * var(--motif-scale));
    height: calc(58px * var(--motif-scale));
    background-image:
      linear-gradient(${({ theme }) => theme.colors.ink} 0 0),
      linear-gradient(${({ theme }) => theme.colors.ink} 0 0);
    background-repeat: no-repeat;
    background-position: center;
    background-size:
      100% calc(12px * var(--motif-scale)),
      calc(12px * var(--motif-scale)) 100%;
  }
`;

/**
 * Faixa de blocos primários: régua Bauhaus que separa seções sem usar uma linha comum.
 * Retângulo, círculo e triângulo aparecem lado a lado, na mesma escala.
 */
export const BauhausBandShell = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 12px;
  margin: 0 0 26px;
  span {
    display: block;
    height: 100%;
  }
  .band-bar {
    flex: 2 1 0;
    background: ${({ theme }) => theme.colors.red};
  }
  .band-dot {
    flex: 0 0 12px;
    background: ${({ theme }) => theme.colors.blue};
    border-radius: ${({ theme }) => theme.radii.round};
  }
  .band-block {
    flex: 1 1 0;
    background: ${({ theme }) => theme.colors.yellow};
  }
  .band-wedge {
    flex: 0 0 14px;
    background: ${({ theme }) => theme.colors.ink};
    clip-path: polygon(0 100%, 100% 100%, 50% 0);
  }
  .band-rule {
    flex: 3 1 0;
    height: 2px;
    background: ${({ theme }) => theme.colors.ink};
  }
`;

/** Hero mostrado apenas na primeira jornada: orienta o usuário antes de exibir cards vazios. */
export const WelcomeHero = styled.section`
  ${motifHost};
  overflow: hidden;
  min-height: 430px;
  padding: clamp(30px, 5vw, 64px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: #151713;
  color: #f8f3e8;
  border: 2px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radii.block};
`;
export const WelcomeEyebrow = styled.span`
  margin-bottom: 16px;
  color: ${({ theme }) => theme.colors.yellow};
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1.5px;
`;
export const WelcomeTitle = styled.h2`
  max-width: 660px;
  margin: 0;
  font-size: clamp(38px, 6vw, 76px);
  font-weight: 950;
  line-height: 0.9;
  letter-spacing: -5px;
`;
export const WelcomeText = styled.p`
  max-width: 445px;
  margin: 25px 0 0;
  color: #d7d5cb;
  font-size: 15px;
  line-height: 1.55;
`;
export const WelcomeActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 29px;
`;
export const WelcomeNote = styled.span`
  margin-top: 24px;
  color: #b8b7ae;
  font-size: 11px;
`;
export const TopActions = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
`;
export const IconButton = styled.button`
  ${buttonMotion};
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  color: ${({ theme }) => theme.colors.ink};
  background: ${({ theme }) => theme.colors.surface};
  border: 2px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radii.round};
  &:hover {
    transform: translateY(-2px) rotate(-4deg);
    background: ${({ theme }) => theme.colors.blue};
    box-shadow: 3px 3px 0 ${({ theme }) => theme.colors.ink};
  }
  &:active {
    transform: scale(0.92);
    box-shadow: none;
  }
`;
export const PrimaryButton = styled.button`
  ${buttonMotion};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 16px;
  color: ${({ theme }) => theme.colors.canvas};
  background: ${({ theme }) => theme.colors.red};
  border: 2px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radii.block};
  box-shadow: 4px 4px 0 ${({ theme }) => theme.colors.ink};
  font-size: 12px;
  font-weight: 850;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    color 0.22s ease,
    background-color 0.22s ease,
    border-color 0.22s ease;
  &:hover {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 ${({ theme }) => theme.colors.ink};
  }
  &:active {
    transform: translate(4px, 4px);
    box-shadow: 0 0 0 ${({ theme }) => theme.colors.ink};
  }
`;
export const MetricsGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 18px;
`;
/**
 * Cada card é um bloco de cor chapado com um quarto de círculo na quina.
 * O recorte muda de canto por tom, então a fileira nunca fica simétrica demais.
 */
export const StatCardShell = styled.article<{
  $tone: "yellow" | "blue" | "red";
}>`
  ${motifHost};
  min-height: 158px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${({ theme, $tone }) => theme.colors[$tone]};
  border: 2px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radii.block};
  &::after {
    position: absolute;
    z-index: 0;
    width: 96px;
    height: 96px;
    content: "";
    background: ${({ theme }) => theme.colors.ink};
    opacity: 0.1;
    ${({ $tone }) =>
      $tone === "yellow"
        ? "right: -26px; bottom: -26px; border-radius: 50%;"
        : $tone === "blue"
          ? "right: 0; top: 0; border-radius: 0 0 0 100%;"
          : "left: -20px; bottom: -34px; clip-path: polygon(50% 0, 100% 100%, 0 100%);"}
  }
`;
export const StatTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 800;
`;
export const StatIcon = styled.span`
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  color: ${({ theme }) => theme.colors.canvas};
  background: ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radii.round};
`;
export const StatValue = styled.strong`
  margin-top: auto;
  font-size: 42px;
  line-height: 1;
  letter-spacing: -2.8px;
`;
export const StatDescription = styled.span`
  margin-top: 8px;
  font-size: 11px;
  font-weight: 650;
`;
export const ContentGrid = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.8fr);
  gap: 18px;
`;
/** Todo painel carrega um anel cortado pela quina: assinatura geométrica discreta. */
export const Panel = styled.section`
  ${motifHost};
  padding: 23px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  border: 2px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radii.block};
  &::after {
    position: absolute;
    right: -38px;
    bottom: -38px;
    z-index: 0;
    width: 124px;
    height: 124px;
    content: "";
    border: 15px solid ${({ theme }) => theme.colors.line};
    border-radius: ${({ theme }) => theme.radii.round};
  }
`;
export const PanelHeading = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
`;
/** O kicker ganha um quadradinho de cor: rótulo vira sinal gráfico. */
export const PanelKicker = styled.span`
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 6px;
  color: ${({ theme }) => theme.colors.muted};
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 1.15px;
  &::before {
    width: 9px;
    height: 9px;
    content: "";
    background: ${({ theme }) => theme.colors.red};
  }
`;
export const PanelTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  letter-spacing: -1.1px;
`;
export const TaskList = styled.div`
  display: grid;
  gap: 9px;
`;
export const TaskRow = styled.article`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 2px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.block};
`;
export const TaskCheck = styled.button<{ $done: boolean }>`
  ${buttonMotion};
  display: grid;
  flex: 0 0 auto;
  width: 25px;
  height: 25px;
  place-items: center;
  color: ${({ theme }) => theme.colors.canvas};
  background: ${({ $done, theme }) =>
    $done ? theme.colors.green : "transparent"};
  border: 2px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radii.round};
  &:hover {
    transform: scale(1.08);
    background: ${({ $done, theme }) =>
      $done ? theme.colors.green : theme.colors.yellow};
  }
  &:active {
    transform: scale(0.9);
  }
`;
export const TaskText = styled.div<{ $done: boolean }>`
  min-width: 0;
  flex: 1;
  strong {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    text-decoration: ${({ $done }) => ($done ? "line-through" : "none")};
  }
  span {
    display: block;
    margin-top: 4px;
    color: ${({ theme }) => theme.colors.muted};
    font-size: 10px;
  }
  p {
    display: -webkit-box;
    overflow: hidden;
    margin: 6px 0 0;
    color: ${({ theme }) => theme.colors.muted};
    font-size: 11px;
    line-height: 1.4;
    white-space: pre-line;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
`;
export const AreaPill = styled.span<{
  $area: "faculdade" | "estagio" | "pessoal";
}>`
  padding: 5px 8px;
  color: ${({ theme }) => theme.colors.ink};
  background: ${({ $area, theme }) =>
    $area === "faculdade"
      ? theme.colors.yellow
      : $area === "estagio"
        ? theme.colors.blue
        : theme.colors.green};
  border: 2px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
`;
export const FocusNumber = styled.strong`
  display: block;
  margin: 31px 0 5px;
  font-size: 62px;
  letter-spacing: -4px;
`;
export const FocusCaption = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font-size: 12px;
  line-height: 1.45;
`;
export const DashedRule = styled.div`
  margin: 24px 0;
  border-top: 2px dashed ${({ theme }) => theme.colors.ink};
`;
export const EntryList = styled.div`
  display: grid;
  gap: 10px;
`;
export const EntryCard = styled.article`
  padding: 13px;
  background: ${({ theme }) => theme.colors.canvas};
  border-left: 8px solid ${({ theme }) => theme.colors.red};
  border-radius: ${({ theme }) => theme.radii.block};
  strong,
  p,
  small,
  a {
    display: block;
  }
  strong {
    font-size: 12px;
  }
  p {
    margin: 7px 0 0;
    color: ${({ theme }) => theme.colors.muted};
    font-size: 11px;
    line-height: 1.45;
  }
  a {
    width: max-content;
    margin-top: 8px;
    color: ${({ theme }) => theme.colors.red};
    font-size: 10px;
    font-weight: 850;
  }
  small {
    margin-top: 8px;
    font-size: 9px;
    font-weight: 800;
  }
`;
export const EmptyState = styled.p`
  padding: 28px 10px;
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  text-align: center;
  font-size: 12px;
`;
export const ViewPanel = styled(Panel)`
  min-height: 430px;
`;
export const Form = styled.form`
  display: grid;
  gap: 17px;
`;
export const FormField = styled.label`
  display: grid;
  gap: 7px;
  color: ${({ theme }) => theme.colors.ink};
  font-size: 11px;
  font-weight: 850;
  input,
  select,
  textarea {
    width: 100%;
    padding: 10px 11px;
    resize: vertical;
    color: ${({ theme }) => theme.colors.ink};
    background: ${({ theme }) => theme.colors.canvas};
    border: 2px solid ${({ theme }) => theme.colors.ink};
    border-radius: ${({ theme }) => theme.radii.block};
  }
`;
export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(21, 23, 25, 0.65);
  /**
   * O wrapper de animação do framer-motion precisa de largura própria. Sem ela
   * ele encolhe para \`max-content\`, muda de tamanho a cada mudança de conteúdo
   * — e o \`place-items: center\` reposiciona o modal a cada uma. Pior: quando o
   * conteúdo passa da tela, o item centralizado transborda para os dois lados e
   * a borda esquerda fica fora de alcance.
   */
  > div {
    width: min(100%, 620px);
  }
`;
/** A largura vem do wrapper; aqui só resta preencher o espaço já reservado. */
export const ModalContainer = styled.div`
  ${motifHost};
  width: 100%;
  max-height: calc(100dvh - 40px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  border: 2px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radii.block};
  box-shadow: 10px 10px 0 ${({ theme }) => theme.colors.blue};
`;
export const ModalHeader = styled.header`
  flex: 0 0 auto;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 22px 16px;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 2px solid ${({ theme }) => theme.colors.ink};
`;
export const ModalTitle = styled.h2`
  margin: 0;
  font-size: 23px;
  letter-spacing: -1.3px;
`;
export const ModalDescription = styled.p`
  margin: 6px 0 0;
  color: ${({ theme }) => theme.colors.muted};
  font-size: 12px;
  line-height: 1.4;
`;
export const ModalBody = styled.div`
  min-height: 0;
  padding: 22px;
  overflow-y: auto;
  overscroll-behavior: contain;
`;
export const ModalFooter = styled.footer`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 22px 22px;
  border-top: 2px solid ${({ theme }) => theme.colors.line};
`;
export const SecondaryButton = styled.button`
  ${buttonMotion};
  min-height: 38px;
  padding: 0 14px;
  color: ${({ theme }) => theme.colors.ink};
  background: transparent;
  border: 2px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radii.block};
  font-size: 11px;
  font-weight: 800;
  &:hover {
    transform: translateY(-2px);
    background: ${({ theme }) => theme.colors.yellow};
    box-shadow: 3px 3px 0 ${({ theme }) => theme.colors.ink};
  }
  &:active {
    transform: translateY(1px) scale(0.98);
    box-shadow: none;
  }
`;
export const ModalCloseButton = styled(SecondaryButton)`
  min-width: 38px;
  padding: 0;
  border-radius: ${({ theme }) => theme.radii.round};
  &:hover {
    transform: rotate(90deg);
    color: ${({ theme }) => theme.colors.canvas};
    background: ${({ theme }) => theme.colors.red};
    box-shadow: 2px 2px 0 ${({ theme }) => theme.colors.ink};
  }
  &:active {
    transform: rotate(90deg) scale(0.9);
    box-shadow: none;
  }
`;

/** Ajustes de layout para telas pequenas sem apagar as informações importantes. */
export const ResponsiveStyles = createGlobalStyle`
  /** Tablet: a sidebar vira cabeçalho, mas as métricas ainda aproveitam a largura. */
  @media (max-width: 850px) {
    ${AppShell} { display: block; }
    ${SidebarShell} { position: static; width: 100%; height: auto; padding: 15px 16px 13px; border-right: 0; border-bottom: 2px solid ${({ theme }) => theme.colors.ink}; }
    ${Brand} { margin: 0 3px 13px; }
    ${SidebarNav} { display: flex; overflow-x: auto; gap: 6px; scrollbar-width: none; }
    ${SidebarNav}::-webkit-scrollbar { display: none; }
    ${NavLabel}, ${SidebarFooter} { display: none; }
    ${NavItem} { flex: 1 0 auto; width: auto; justify-content: center; white-space: nowrap; }
    ${MainContent} { padding: 28px 20px 46px; }
    ${MetricsGrid} { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    ${ContentGrid} { grid-template-columns: 1fr; }
    ${Topbar} { align-items: flex-end; }
    ${TopActions} { flex-wrap: wrap; justify-content: flex-end; }
  }

  /** Celular: densidade própria, em vez de simplesmente empilhar cartões desktop. */
  @media (max-width: 620px) {
    ${SidebarShell} { padding: 12px 12px 10px; }
    ${Brand} { margin-bottom: 10px; font-size: 20px; letter-spacing: -1.2px; }
    ${BrandMark} { width: 29px; height: 29px; }
    ${NavItem} { min-width: 0; gap: 6px; padding: 9px 7px 9px 11px; font-size: 10px; }
    ${NavItem} svg { width: 15px; height: 15px; }

    ${MainContent} { padding: 22px 14px 38px; }
    ${Topbar} { display: grid; gap: 16px; margin-bottom: 14px; }
    ${BauhausBandShell} { height: 9px; margin-bottom: 18px; }
    ${Eyebrow} { margin-bottom: 7px; font-size: 8px; line-height: 1.45; }
    ${PageTitle} { max-width: 360px; font-size: clamp(29px, 9vw, 36px); line-height: .94; letter-spacing: -2.4px; }
    ${TopActions} { width: 100%; justify-content: flex-start; gap: 8px; }
    ${TopActions} .action-label { display: none; }
    ${TopActions} ${PrimaryButton} { width: 40px; min-height: 40px; padding: 0; box-shadow: 2px 2px 0 ${({ theme }) => theme.colors.ink}; }
    ${IconButton} { width: 40px; height: 40px; }

    ${MetricsGrid} { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px; }
    ${MetricsGrid} > :nth-child(3) { grid-column: 1 / -1; }
    ${StatCardShell} { min-height: 122px; padding: 14px; }
    ${MetricsGrid} > :nth-child(3) { min-height: 106px; }
    ${StatTop} { font-size: 9px; }
    ${StatIcon} { width: 27px; height: 27px; }
    ${StatValue} { font-size: 31px; letter-spacing: -2px; }
    ${StatDescription} { margin-top: 6px; font-size: 9px; line-height: 1.35; }

    ${ContentGrid} { gap: 12px; }
    ${Panel}, ${ViewPanel} { min-height: 0; padding: 16px; }
    ${PanelHeading} { gap: 10px; margin-bottom: 15px; }
    ${PanelTitle} { font-size: 17px; }
    ${PanelKicker} { font-size: 8px; }
    ${PanelHeading} ${PrimaryButton} { min-height: 36px; padding: 0 11px; font-size: 10px; box-shadow: 2px 2px 0 ${({ theme }) => theme.colors.ink}; }
    ${TaskRow} { gap: 9px; padding: 10px; }
    ${AreaPill} { padding: 4px 7px; font-size: 8px; }
    ${FocusNumber} { margin-top: 22px; font-size: 46px; }

    ${WelcomeHero} { min-height: 390px; padding: 25px 22px; }
    ${WelcomeTitle} { max-width: 310px; font-size: clamp(42px, 13vw, 56px); letter-spacing: -3.6px; }
    ${WelcomeText} { margin-top: 20px; font-size: 13px; }
    ${WelcomeActions} { gap: 9px; margin-top: 23px; }
    ${WelcomeActions} button { min-height: 38px; padding: 0 11px; font-size: 9px; }

    ${FormField} { min-width: 0; gap: 5px; font-size: 9px; }
    ${FormField} input, ${FormField} textarea { min-width: 0; padding: 9px 10px; font-size: 10px; line-height: 1.35; }
    ${FormField} textarea { min-height: 58px; }
    ${Form} ${PrimaryButton} { min-height: 38px; box-shadow: 3px 3px 0 ${({ theme }) => theme.colors.ink}; font-size: 10px; }
    /** O teclado virtual reduz a área visível, então o modal fica centralizado. */
    ${ModalOverlay} { align-items: center; padding: 10px; }
    ${ModalContainer} { max-height: calc(100dvh - 20px); box-shadow: 5px 5px 0 ${({ theme }) => theme.colors.blue}; }
    ${ModalHeader} { align-items: center; padding: 12px 14px 10px; }
    ${ModalTitle} { font-size: 19px; letter-spacing: -1px; }
    ${ModalDescription} { display: none; }
    ${ModalCloseButton} { min-width: 34px; min-height: 34px; }
    ${ModalBody} { padding: 13px 14px 18px; scrollbar-width: thin; }
  }

  /** Celulares muito estreitos voltam os campos auxiliares para uma coluna. */
  @media (max-width: 370px) {
    ${ModalOverlay} { padding: 6px; }
    ${ModalContainer} { max-height: calc(100dvh - 12px); }
  }
`;
