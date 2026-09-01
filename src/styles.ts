import { createGlobalStyle, css } from "styled-components";
import styled from "styled-components";

/** Estilos globais: a fonte é local do sistema para o app continuar legível sem internet. */
export const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }
  body { margin: 0; min-width: 320px; overflow-x: hidden; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: ${({ theme }) => theme.colors.canvas}; color: ${({ theme }) => theme.colors.ink}; }
  button, input, select, textarea { font: inherit; } button { cursor: pointer; }
`;

/**
 * Todo bloco que hospeda formas decorativas precisa disso.
 * `position: relative` cria o contexto de posicionamento, e a regra do filho
 * devolve o conteúdo para cima — sem ela o motivo pinta por cima do texto.
 */
const motifHost = css`
  position: relative;
  > *:not(.bauhaus-motif) { position: relative; z-index: 1; }
`;

/** Casca principal: blocos, cores sólidas e geometria são referências diretas ao Bauhaus. */
export const AppShell = styled.div`
  min-height: 100vh; display: grid; grid-template-columns: 248px minmax(0, 1fr);
  background: ${({ theme }) => theme.colors.canvas};
  /* Malha de pontos: o papel milimetrado que a Bauhaus usava para construir a forma. */
  background-image: radial-gradient(circle at 1px 1px, ${({ theme }) => theme.colors.line} 1px, transparent 0);
  background-size: 26px 26px;
`;
export const SidebarShell = styled.aside`
  ${motifHost};
  position: sticky; top: 0; height: 100vh; padding: 28px 18px; display: flex; flex-direction: column; overflow: hidden; background: #151713; color: #f8f3e8; border-right: 2px solid ${({ theme }) => theme.colors.ink};
`;
export const Brand = styled.div`
  display: flex; align-items: center; gap: 11px; margin: 0 8px 18px; font-size: 23px; font-weight: 900; letter-spacing: -1.6px;
`;
export const BrandMark = styled.span`
  width: 32px; height: 32px; display: grid; place-items: center; background: ${({ theme }) => theme.colors.red}; color: ${({ theme }) => theme.colors.canvas}; border-radius: ${({ theme }) => theme.radii.round};
`;
export const SidebarNav = styled.nav`display: grid; gap: 7px;`;
export const NavLabel = styled.p`
  margin: 0 9px 9px; color: #a8aa9f; font-size: 10px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;
`;
/** O item ativo ganha um bloco amarelo cheio e uma barra vermelha à esquerda. */
export const NavItem = styled.button<{ $active?: boolean }>`
  position: relative; width: 100%; display: flex; align-items: center; gap: 11px; padding: 12px 10px 12px 14px; color: ${({ $active }) => ($active ? "#151713" : "#d7d8ce")}; background: ${({ $active, theme }) => ($active ? theme.colors.yellow : "transparent")}; border: 0; border-radius: ${({ theme }) => theme.radii.block}; font-size: 13px; font-weight: ${({ $active }) => ($active ? 800 : 600)}; text-align: left; transition: transform .18s ease, background .18s ease;
  &::before { position: absolute; top: 0; bottom: 0; left: 0; width: 5px; content: ""; background: ${({ $active, theme }) => ($active ? theme.colors.red : "transparent")}; }
  &:hover { transform: translateX(4px); background: ${({ theme }) => theme.colors.blue}; color: #151713; }
`;
export const SidebarFooter = styled.div`margin-top: auto; display: grid; gap: 12px;`;
export const OfflineBadge = styled.div`
  padding: 12px; border: 2px solid #45473f; border-radius: ${({ theme }) => theme.radii.block}; color: #d7d8ce; font-size: 11px; line-height: 1.45;
  strong { display: flex; align-items: center; gap: 6px; color: ${({ theme }) => theme.colors.yellow}; }
`;
export const MainContent = styled.main`${motifHost}; width: min(100%, 1280px); padding: 42px 54px 64px; margin: 0 auto;`;
export const Topbar = styled.header`display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 18px;`;
export const Eyebrow = styled.span`display: block; margin-bottom: 9px; color: ${({ theme }) => theme.colors.muted}; font-size: 10px; font-weight: 900; letter-spacing: 1.3px;`;
export const PageTitle = styled.h1`max-width: 650px; margin: 0; font-size: clamp(31px, 4vw, 48px); font-weight: 950; line-height: .98; letter-spacing: -3px;`;

/** Contextos disponíveis para o motivo geométrico; cada um tem escala e recorte próprios. */
export type MotifVariant = "page" | "hero" | "sidebar" | "promo" | "modal" | "panel" | "stat" | "journal" | "planner";
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
const motifScale: Record<MotifVariant, number> = { page: .72, hero: 1, sidebar: .38, promo: .5, modal: .46, panel: .44, stat: .3, journal: .5, planner: .58 };
/** Recuo lateral por contexto, para o motivo não colidir com o texto do bloco. */
const motifShift: Record<MotifVariant, string> = { page: "6%", hero: "8%", sidebar: "0%", promo: "2%", modal: "3%", panel: "4%", stat: "6%", journal: "5%", planner: "3%" };
/** Minimalismo é dosagem: o herói pode gritar, o painel só sussurra. */
const motifOpacity: Record<MotifVariant, number> = { page: .16, hero: .95, sidebar: .5, promo: .55, modal: .5, panel: .2, stat: .5, journal: .22, planner: .3 };
/**
 * Camada decorativa absoluta — o pai precisa ter `position: relative`.
 * `pointer-events: none` garante que as formas nunca roubem clique do conteúdo.
 */
export const BauhausMotifShell = styled.span<MotifProps>`
  position: absolute; inset: 0; z-index: 0; display: block; overflow: hidden; pointer-events: none;
  --motif-scale: ${({ $variant }: MotifProps) => motifScale[$variant]};
  --motif-shift: ${({ $variant }: MotifProps) => motifShift[$variant]};
  opacity: ${({ $variant }: MotifProps) => motifOpacity[$variant]};

  span { position: absolute; display: block; }
  /* Círculo: a forma perfeita, sempre no alto à direita. */
  .shape-circle { top: calc(-9% * var(--motif-scale)); right: var(--motif-shift); width: calc(196px * var(--motif-scale)); height: calc(196px * var(--motif-scale)); background: ${({ theme }) => theme.colors.yellow}; border-radius: ${({ theme }) => theme.radii.round}; }
  /* Meia-lua apoiada na base, como as colunas do cartaz de 1923. */
  .shape-half { bottom: 0; left: 24%; width: calc(132px * var(--motif-scale)); height: calc(66px * var(--motif-scale)); background: ${({ theme }) => theme.colors.red}; border-radius: calc(132px * var(--motif-scale)) calc(132px * var(--motif-scale)) 0 0; }
  /* Quarto de círculo ancorado na quina inferior esquerda. */
  .shape-quarter { bottom: 0; left: 0; width: calc(158px * var(--motif-scale)); height: calc(158px * var(--motif-scale)); background: ${({ theme }) => theme.colors.blue}; border-radius: 0 100% 0 0; }
  .shape-square { bottom: 9%; left: var(--motif-shift); width: calc(112px * var(--motif-scale)); height: calc(112px * var(--motif-scale)); background: ${({ theme }) => theme.colors.blue}; transform: rotate(14deg); }
  /* Triângulo puro via clip-path: nada de border hack. */
  .shape-triangle { top: 13%; left: 31%; width: calc(98px * var(--motif-scale)); height: calc(86px * var(--motif-scale)); background: ${({ theme }) => theme.colors.red}; clip-path: polygon(50% 0, 100% 100%, 0 100%); }
  .shape-bar { top: 44%; left: -4%; width: calc(230px * var(--motif-scale)); height: calc(22px * var(--motif-scale)); background: ${({ theme }) => theme.colors.red}; border-radius: ${({ theme }) => theme.radii.pill}; }
  .shape-ring { right: 27%; bottom: calc(-11% * var(--motif-scale)); width: calc(142px * var(--motif-scale)); height: calc(142px * var(--motif-scale)); background: transparent; border: calc(13px * var(--motif-scale)) solid ${({ theme }) => theme.colors.ink}; border-radius: ${({ theme }) => theme.radii.round}; }
  .shape-arc { top: 16%; right: 34%; width: calc(104px * var(--motif-scale)); height: calc(52px * var(--motif-scale)); background: ${({ theme }) => theme.colors.green}; border-radius: calc(104px * var(--motif-scale)) calc(104px * var(--motif-scale)) 0 0; }
  /* Trama de pontos: repetição modular, o lado "grid" da escola. */
  .shape-dots { right: 7%; bottom: 11%; width: calc(150px * var(--motif-scale)); height: calc(112px * var(--motif-scale)); background-image: radial-gradient(${({ theme }) => theme.colors.ink} calc(2px * var(--motif-scale)), transparent calc(2.4px * var(--motif-scale))); background-size: calc(17px * var(--motif-scale)) calc(17px * var(--motif-scale)); }
  /* Hachura a 45°: a diagonal que dá movimento à composição estática. */
  .shape-stripes { top: 0; left: 2%; width: calc(96px * var(--motif-scale)); height: calc(190px * var(--motif-scale)); background-image: repeating-linear-gradient(45deg, ${({ theme }) => theme.colors.ink} 0 calc(3px * var(--motif-scale)), transparent calc(3px * var(--motif-scale)) calc(11px * var(--motif-scale))); }
  /* Cruz construída com dois gradientes — duas barras, zero markup extra. */
  .shape-cross { top: 21%; right: 9%; width: calc(58px * var(--motif-scale)); height: calc(58px * var(--motif-scale)); background-image: linear-gradient(${({ theme }) => theme.colors.ink} 0 0), linear-gradient(${({ theme }) => theme.colors.ink} 0 0); background-repeat: no-repeat; background-position: center; background-size: 100% calc(12px * var(--motif-scale)), calc(12px * var(--motif-scale)) 100%; }
`;

/**
 * Faixa de blocos primários: régua Bauhaus que separa seções sem usar uma linha comum.
 * Retângulo, círculo e triângulo aparecem lado a lado, na mesma escala.
 */
export const BauhausBandShell = styled.div`
  display: flex; align-items: center; gap: 6px; height: 12px; margin: 0 0 26px;
  span { display: block; height: 100%; }
  .band-bar { flex: 2 1 0; background: ${({ theme }) => theme.colors.red}; }
  .band-dot { flex: 0 0 12px; background: ${({ theme }) => theme.colors.blue}; border-radius: ${({ theme }) => theme.radii.round}; }
  .band-block { flex: 1 1 0; background: ${({ theme }) => theme.colors.yellow}; }
  .band-wedge { flex: 0 0 14px; background: ${({ theme }) => theme.colors.ink}; clip-path: polygon(0 100%, 100% 100%, 50% 0); }
  .band-rule { flex: 3 1 0; height: 2px; background: ${({ theme }) => theme.colors.ink}; }
`;

/** Hero mostrado apenas na primeira jornada: orienta o usuário antes de exibir cards vazios. */
export const WelcomeHero = styled.section`
  ${motifHost};
  overflow: hidden; min-height: 430px; padding: clamp(30px, 5vw, 64px); display: flex; flex-direction: column; justify-content: center; background: #151713; color: #f8f3e8; border: 2px solid ${({ theme }) => theme.colors.ink}; border-radius: ${({ theme }) => theme.radii.block};
`;
export const WelcomeEyebrow = styled.span`margin-bottom: 16px; color: ${({ theme }) => theme.colors.yellow}; font-size: 11px; font-weight: 900; letter-spacing: 1.5px;`;
export const WelcomeTitle = styled.h2`max-width: 660px; margin: 0; font-size: clamp(38px, 6vw, 76px); font-weight: 950; line-height: .9; letter-spacing: -5px;`;
export const WelcomeText = styled.p`max-width: 445px; margin: 25px 0 0; color: #d7d5cb; font-size: 15px; line-height: 1.55;`;
export const WelcomeActions = styled.div`display: flex; flex-wrap: wrap; gap: 12px; margin-top: 29px;`;
export const WelcomeNote = styled.span`margin-top: 24px; color: #b8b7ae; font-size: 11px;`;
export const TopActions = styled.div`display: flex; align-items: center; gap: 9px;`;
/** Botão persistente: torna o assistente encontrável em qualquer aba. */
export const AssistantButton = styled.button`
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 42px; padding: 0 16px; color: #151713; background: ${({ theme }) => theme.colors.yellow}; border: 2px solid ${({ theme }) => theme.colors.ink}; border-radius: ${({ theme }) => theme.radii.pill}; font-size: 11px; font-weight: 900; transition: transform .18s ease;
  &:hover { transform: translateY(-2px); }
`;
export const IconButton = styled.button`
  display: grid; width: 42px; height: 42px; place-items: center; color: ${({ theme }) => theme.colors.ink}; background: ${({ theme }) => theme.colors.surface}; border: 2px solid ${({ theme }) => theme.colors.ink}; border-radius: ${({ theme }) => theme.radii.round};
`;
export const PrimaryButton = styled.button`
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 42px; padding: 0 16px; color: ${({ theme }) => theme.colors.canvas}; background: ${({ theme }) => theme.colors.red}; border: 2px solid ${({ theme }) => theme.colors.ink}; border-radius: ${({ theme }) => theme.radii.block}; box-shadow: 4px 4px 0 ${({ theme }) => theme.colors.ink}; font-size: 12px; font-weight: 850; transition: transform .16s ease, box-shadow .16s ease;
  &:hover { transform: translate(2px, 2px); box-shadow: 2px 2px 0 ${({ theme }) => theme.colors.ink}; }
`;
export const MetricsGrid = styled.section`display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 18px;`;
/**
 * Cada card é um bloco de cor chapado com um quarto de círculo na quina.
 * O recorte muda de canto por tom, então a fileira nunca fica simétrica demais.
 */
export const StatCardShell = styled.article<{ $tone: "yellow" | "blue" | "red" }>`
  ${motifHost};
  min-height: 158px; padding: 20px; display: flex; flex-direction: column; overflow: hidden; background: ${({ theme, $tone }) => theme.colors[$tone]}; border: 2px solid ${({ theme }) => theme.colors.ink}; border-radius: ${({ theme }) => theme.radii.block};
  &::after {
    position: absolute; z-index: 0; width: 96px; height: 96px; content: ""; background: ${({ theme }) => theme.colors.ink}; opacity: .1;
    ${({ $tone }) => ($tone === "yellow"
        ? "right: -26px; bottom: -26px; border-radius: 50%;"
        : $tone === "blue"
            ? "right: 0; top: 0; border-radius: 0 0 0 100%;"
            : "left: -20px; bottom: -34px; clip-path: polygon(50% 0, 100% 100%, 0 100%);")}
  }
`;
export const StatTop = styled.div`display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 800;`;
export const StatIcon = styled.span`display: grid; width: 30px; height: 30px; place-items: center; color: ${({ theme }) => theme.colors.canvas}; background: ${({ theme }) => theme.colors.ink}; border-radius: ${({ theme }) => theme.radii.round};`;
export const StatValue = styled.strong`margin-top: auto; font-size: 42px; line-height: 1; letter-spacing: -2.8px;`;
export const StatDescription = styled.span`margin-top: 8px; font-size: 11px; font-weight: 650;`;
export const ContentGrid = styled.section`display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(280px, .8fr); gap: 18px;`;
/** Faixa da Home explica o valor da IA e seu comportamento offline antes do uso. */
export const AssistantPromo = styled.section`
  ${motifHost};
  display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 16px; margin: 0 0 18px; padding: 18px 20px; overflow: hidden; color: #151713; background: ${({ theme }) => theme.colors.yellow}; border: 2px solid ${({ theme }) => theme.colors.ink}; border-radius: ${({ theme }) => theme.radii.block};
  h2 { margin: 0; font-size: 17px; letter-spacing: -.7px; }
  p { margin: 4px 0 0; font-size: 11px; line-height: 1.45; }
`;
export const AssistantPromoIcon = styled.span`display: grid; width: 44px; height: 44px; place-items: center; color: #f8f3e8; background: #151713; border-radius: ${({ theme }) => theme.radii.round};`;
/** Todo painel carrega um anel cortado pela quina: assinatura geométrica discreta. */
export const Panel = styled.section`
  ${motifHost};
  padding: 23px; overflow: hidden; background: ${({ theme }) => theme.colors.surface}; border: 2px solid ${({ theme }) => theme.colors.ink}; border-radius: ${({ theme }) => theme.radii.block};
  &::after { position: absolute; right: -38px; bottom: -38px; z-index: 0; width: 124px; height: 124px; content: ""; border: 15px solid ${({ theme }) => theme.colors.line}; border-radius: ${({ theme }) => theme.radii.round}; }
`;
export const PanelHeading = styled.div`display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px;`;
/** O kicker ganha um quadradinho de cor: rótulo vira sinal gráfico. */
export const PanelKicker = styled.span`
  display: flex; align-items: center; gap: 7px; margin-bottom: 6px; color: ${({ theme }) => theme.colors.muted}; font-size: 10px; font-weight: 900; letter-spacing: 1.15px;
  &::before { width: 9px; height: 9px; content: ""; background: ${({ theme }) => theme.colors.red}; }
`;
export const PanelTitle = styled.h2`margin: 0; font-size: 20px; letter-spacing: -1.1px;`;
export const TaskList = styled.div`display: grid; gap: 9px;`;
export const TaskRow = styled.article`display: flex; align-items: center; gap: 12px; padding: 12px; border: 2px solid ${({ theme }) => theme.colors.line}; border-radius: ${({ theme }) => theme.radii.block};`;
export const TaskCheck = styled.button<{ $done: boolean }>`
  display: grid; flex: 0 0 auto; width: 25px; height: 25px; place-items: center; color: ${({ theme }) => theme.colors.canvas}; background: ${({ $done, theme }) => ($done ? theme.colors.green : "transparent")}; border: 2px solid ${({ theme }) => theme.colors.ink}; border-radius: ${({ theme }) => theme.radii.round};
`;
export const TaskText = styled.div<{ $done: boolean }>`
  min-width: 0; flex: 1;
  strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; text-decoration: ${({ $done }) => ($done ? "line-through" : "none")}; }
  span { display: block; margin-top: 4px; color: ${({ theme }) => theme.colors.muted}; font-size: 10px; }
`;
export const AreaPill = styled.span<{ $area: "faculdade" | "estagio" | "pessoal" }>`
  padding: 5px 8px; color: ${({ theme }) => theme.colors.ink}; background: ${({ $area, theme }) => ($area === "faculdade" ? theme.colors.yellow : $area === "estagio" ? theme.colors.blue : theme.colors.green)}; border: 2px solid ${({ theme }) => theme.colors.ink}; border-radius: ${({ theme }) => theme.radii.pill}; font-size: 9px; font-weight: 900; text-transform: uppercase;
`;
export const FocusNumber = styled.strong`display: block; margin: 31px 0 5px; font-size: 62px; letter-spacing: -4px;`;
export const FocusCaption = styled.p`margin: 0; color: ${({ theme }) => theme.colors.muted}; font-size: 12px; line-height: 1.45;`;
export const DashedRule = styled.div`margin: 24px 0; border-top: 2px dashed ${({ theme }) => theme.colors.ink};`;
export const EntryList = styled.div`display: grid; gap: 10px;`;
export const EntryCard = styled.article`
  padding: 13px; background: ${({ theme }) => theme.colors.canvas}; border-left: 8px solid ${({ theme }) => theme.colors.red}; border-radius: ${({ theme }) => theme.radii.block};
  strong, p, small, a { display: block; } strong { font-size: 12px; } p { margin: 7px 0 0; color: ${({ theme }) => theme.colors.muted}; font-size: 11px; line-height: 1.45; } a { width: max-content; margin-top: 8px; color: ${({ theme }) => theme.colors.red}; font-size: 10px; font-weight: 850; } small { margin-top: 8px; font-size: 9px; font-weight: 800; }
`;
export const EmptyState = styled.p`padding: 28px 10px; margin: 0; color: ${({ theme }) => theme.colors.muted}; text-align: center; font-size: 12px;`;
export const ViewPanel = styled(Panel)`min-height: 430px;`;
/** Agrupa o planejador e o histórico da página de Estudos com espaçamento consistente. */
export const StudyLayout = styled.div`display: grid; gap: 18px;`;
/** Cartão do assistente com uma cor de marca própria, sem competir com as tarefas. */
export const PlannerCard = styled(Panel)<{ $embedded?: boolean }>`
  padding: ${({ $embedded }) => ($embedded ? "0" : "23px")}; background: ${({ $embedded, theme }) => ($embedded ? "transparent" : theme.colors.blue)}; border: ${({ $embedded }) => ($embedded ? "0" : "2px solid")}; border-color: ${({ theme }) => theme.colors.ink};
  /* Sobre o azul o anel do Panel sumiria; aqui ele vira sombra da própria cor. */
  &::after { border-color: ${({ $embedded }) => ($embedded ? "transparent" : "rgba(21, 23, 19, .16)")}; }
`;
export const PlannerHeader = styled.header`
  display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 22px;
  h2 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 23px; letter-spacing: -1.2px; }
  p { max-width: 570px; margin: 9px 0 0; font-size: 12px; line-height: 1.5; }
`;
export const PlannerMeta = styled.span`display: block; margin-bottom: 7px; font-size: 10px; font-weight: 900; letter-spacing: 1.2px;`;
export const PlannerStatus = styled.p<{ $error?: boolean }>`
  margin: 17px 0 0; padding: 10px 12px; color: ${({ $error }) => ($error ? "#8b1e13" : "#151713")}; background: ${({ $error }) => ($error ? "#ffd8d1" : "rgba(255, 253, 247, .72)")}; border: 2px solid ${({ theme }) => theme.colors.ink}; border-radius: ${({ theme }) => theme.radii.block}; font-size: 11px; line-height: 1.4;
`;
/** Aviso aparece antes de qualquer download para o uso de internet nunca ser surpresa. */
export const DownloadNotice = styled.div`
  display: grid; gap: 4px; margin-bottom: 17px; padding: 13px 14px; color: #151713; background: ${({ theme }) => theme.colors.yellow}; border: 2px solid #151713; border-radius: ${({ theme }) => theme.radii.block}; font-size: 11px; line-height: 1.45;
  strong { font-size: 12px; }
`;
export const DownloadProgressLabel = styled.div`display: flex; justify-content: space-between; margin: 0 2px 7px; color: #151713; font-size: 11px; font-weight: 850;`;
export const DownloadProgressBar = styled.div`height: 12px; overflow: hidden; margin-bottom: 17px; background: rgba(255, 253, 247, .6); border: 2px solid #151713; border-radius: ${({ theme }) => theme.radii.block};`;
export const DownloadProgressFill = styled.div<{ $progress: number }>`width: ${({ $progress }) => `${$progress}%`}; height: 100%; background: ${({ theme }) => theme.colors.red}; transition: width .25s ease;`;
export const SuggestionList = styled.div`display: grid; gap: 10px; margin-top: 20px;`;
/** Bloco textual que explica a estratégia antes da lista operacional. */
export const PlanGuidance = styled.section`
  margin-top: 20px; padding: 14px 16px; color: #151713; background: rgba(255, 253, 247, .82); border: 2px solid #151713; border-radius: ${({ theme }) => theme.radii.block};
`;
/** Cabeçalho clicável mantém as dicas disponíveis sem ocupar a tela inteira. */
export const PlanGuidanceToggle = styled.button<{ $open: boolean }>`
  width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0; color: inherit; background: transparent; border: 0; text-align: left;
  strong { font-size: 13px; }
  svg { flex: 0 0 auto; transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")}); transition: transform .2s ease; }
`;
/** Linhas de grid permitem abrir o conteúdo sem um salto brusco de layout. */
export const PlanGuidanceContent = styled.div<{ $open: boolean }>`
  display: grid; grid-template-rows: ${({ $open }) => ($open ? "1fr" : "0fr")}; opacity: ${({ $open }) => ($open ? 1 : 0)}; transition: grid-template-rows .22s ease, opacity .18s ease;
  > div { min-height: 0; overflow: hidden; }
  p { margin: 9px 0 0; font-size: 11px; line-height: 1.55; }
  ul { display: grid; gap: 5px; margin: 11px 0 0; padding-left: 18px; font-size: 11px; line-height: 1.45; }
`;
export const SuggestionItem = styled.div<{ $selected?: boolean }>`
  display: flex; align-items: flex-start; gap: 11px; padding: 12px; color: #151713; background: ${({ $selected }) => ($selected ? "rgba(255, 253, 247, .82)" : "rgba(21, 23, 19, .1)")}; border: 2px solid #151713; border-radius: ${({ theme }) => theme.radii.block};
  input { width: 17px; height: 17px; margin-top: 2px; accent-color: #e44731; }
  > div { min-width: 0; flex: 1; }
`;
/** Título e duração formam a camada resumida de cada sugestão. */
export const SuggestionTitleRow = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
  strong { min-width: 0; font-size: 12px; line-height: 1.3; }
  small { flex: 0 0 auto; font-size: 9px; font-weight: 850; white-space: nowrap; }
`;
/** No desktop os detalhes ficam abertos; no celular podem ser recolhidos. */
export const SuggestionDetails = styled.div<{ $open: boolean }>`
  > div { min-height: 0; overflow: hidden; }

  @media (max-width: 620px) {
    display: grid; grid-template-rows: ${({ $open }) => ($open ? "1fr" : "0fr")}; opacity: ${({ $open }) => ($open ? 1 : 0)}; transition: grid-template-rows .22s ease, opacity .18s ease;
  }
`;
/** O botão aparece só onde recolher detalhes economiza espaço de verdade. */
export const SuggestionDetailsToggle = styled.button`
  display: none; margin-top: 7px; padding: 0; color: #151713; background: transparent; border: 0; font-size: 9px; font-weight: 900; text-decoration: underline;
  @media (max-width: 620px) { display: inline-flex; }
`;
export const SuggestionReason = styled.p`margin: 5px 0 0; font-size: 11px; line-height: 1.4;`;
/** Links são construídos pela aplicação com termos da IA; recursos externos exigem internet. */
export const ResourceLinks = styled.div`display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px;`;
export const ResourceLink = styled.a`
  padding: 6px 10px; color: #151713; background: ${({ theme }) => theme.colors.yellow}; border: 2px solid #151713; border-radius: ${({ theme }) => theme.radii.pill}; font-size: 9px; font-weight: 900; text-decoration: none;
  &:hover { background: ${({ theme }) => theme.colors.red}; }
`;
export const Form = styled.form`display: grid; gap: 17px;`;
export const FormField = styled.label`
  display: grid; gap: 7px; color: ${({ theme }) => theme.colors.ink}; font-size: 11px; font-weight: 850;
  input, select, textarea { width: 100%; padding: 10px 11px; resize: vertical; color: ${({ theme }) => theme.colors.ink}; background: ${({ theme }) => theme.colors.canvas}; border: 2px solid ${({ theme }) => theme.colors.ink}; border-radius: ${({ theme }) => theme.radii.block}; }
`;
export const ModalOverlay = styled.div`position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; padding: 20px; background: rgba(21, 23, 25, .65);`;
export const ModalContainer = styled.div`${motifHost}; width: min(100%, 620px); max-height: calc(100vh - 40px); display: flex; flex-direction: column; overflow: hidden; background: ${({ theme }) => theme.colors.surface}; border: 2px solid ${({ theme }) => theme.colors.ink}; border-radius: ${({ theme }) => theme.radii.block}; box-shadow: 10px 10px 0 ${({ theme }) => theme.colors.blue};`;
export const ModalHeader = styled.header`flex: 0 0 auto; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 22px 22px 16px; background: ${({ theme }) => theme.colors.surface}; border-bottom: 2px solid ${({ theme }) => theme.colors.ink};`;
export const ModalTitle = styled.h2`margin: 0; font-size: 23px; letter-spacing: -1.3px;`;
export const ModalDescription = styled.p`margin: 6px 0 0; color: ${({ theme }) => theme.colors.muted}; font-size: 12px; line-height: 1.4;`;
export const ModalBody = styled.div`min-height: 0; padding: 22px; overflow-y: auto; overscroll-behavior: contain;`;
export const ModalFooter = styled.footer`display: flex; justify-content: flex-end; gap: 10px; padding: 16px 22px 22px; border-top: 2px solid ${({ theme }) => theme.colors.line};`;
export const SecondaryButton = styled.button`min-height: 38px; padding: 0 14px; color: ${({ theme }) => theme.colors.ink}; background: transparent; border: 2px solid ${({ theme }) => theme.colors.ink}; border-radius: ${({ theme }) => theme.radii.block}; font-size: 11px; font-weight: 800;`;
export const ModalCloseButton = styled(SecondaryButton)`min-width: 38px; padding: 0; border-radius: ${({ theme }) => theme.radii.round};`;

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
    ${TopActions} ${AssistantButton}, ${TopActions} ${PrimaryButton} { width: 40px; min-height: 40px; padding: 0; box-shadow: 2px 2px 0 ${({ theme }) => theme.colors.ink}; }
    ${TopActions} ${AssistantButton} { border-radius: ${({ theme }) => theme.radii.round}; box-shadow: none; }
    ${IconButton} { width: 40px; height: 40px; }

    ${MetricsGrid} { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px; }
    ${MetricsGrid} > :nth-child(3) { grid-column: 1 / -1; }
    ${StatCardShell} { min-height: 122px; padding: 14px; }
    ${MetricsGrid} > :nth-child(3) { min-height: 106px; }
    ${StatTop} { font-size: 9px; }
    ${StatIcon} { width: 27px; height: 27px; }
    ${StatValue} { font-size: 31px; letter-spacing: -2px; }
    ${StatDescription} { margin-top: 6px; font-size: 9px; line-height: 1.35; }

    ${AssistantPromo} { grid-template-columns: 36px minmax(0, 1fr); gap: 11px; margin-bottom: 12px; padding: 14px; }
    ${AssistantPromoIcon} { width: 36px; height: 36px; }
    ${AssistantPromo} h2 { font-size: 14px; line-height: 1.05; }
    ${AssistantPromo} p { font-size: 9px; }
    ${AssistantPromo} button { grid-column: 2; min-height: 35px; width: max-content; padding: 0 11px; font-size: 9px; }

    ${ContentGrid}, ${StudyLayout} { gap: 12px; }
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

    ${PlannerCard} { padding: 14px; }
    .planner-embedded { padding: 0; }
    ${PlannerHeader} { gap: 10px; margin-bottom: 13px; }
    ${PlannerHeader} > svg { width: 20px; height: 20px; }
    ${PlannerHeader} h2 { gap: 6px; font-size: 17px; letter-spacing: -.8px; }
    ${PlannerHeader} h2 svg { width: 17px; height: 17px; }
    ${PlannerHeader} p { max-width: 320px; margin-top: 6px; font-size: 9px; line-height: 1.4; }
    ${PlannerMeta} { margin-bottom: 5px; font-size: 8px; }
    ${Form} { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 11px 9px; }
    ${Form} > ${FormField}:first-child, ${Form} > ${PrimaryButton} { grid-column: 1 / -1; }
    ${FormField} { min-width: 0; gap: 5px; font-size: 9px; }
    ${FormField} input, ${FormField} textarea { min-width: 0; padding: 9px 10px; font-size: 10px; line-height: 1.35; }
    ${FormField} textarea { min-height: 58px; }
    ${Form} ${PrimaryButton} { min-height: 38px; box-shadow: 3px 3px 0 ${({ theme }) => theme.colors.ink}; font-size: 10px; }
    ${PlannerStatus} { margin-top: 13px; padding: 8px 10px; font-size: 9px; }
    ${PlanGuidance} { margin-top: 13px; padding: 12px; }
    ${PlanGuidanceToggle} strong { font-size: 11px; }
    ${SuggestionList} { gap: 8px; margin-top: 14px; }
    ${SuggestionItem} { gap: 8px; padding: 10px; }
    ${SuggestionItem} input { width: 15px; height: 15px; }
    ${SuggestionTitleRow} strong { font-size: 10px; }
    ${SuggestionReason} { font-size: 9px; line-height: 1.45; }
    ${ResourceLinks} { margin-top: 8px; }

    ${ModalOverlay} { align-items: end; padding: 10px; }
    ${ModalOverlay} > div { width: 100%; }
    ${ModalContainer} { width: 100%; max-height: 82dvh; box-shadow: 0 -6px 0 ${({ theme }) => theme.colors.blue}; }
    ${ModalHeader} { align-items: center; padding: 12px 14px 10px; }
    ${ModalTitle} { font-size: 19px; letter-spacing: -1px; }
    ${ModalDescription} { display: none; }
    ${ModalCloseButton} { min-width: 34px; min-height: 34px; }
    ${ModalBody} { padding: 13px 14px 18px; scrollbar-width: thin; }
  }

  /** Celulares muito estreitos voltam os campos auxiliares para uma coluna. */
  @media (max-width: 370px) {
    ${Form} { grid-template-columns: 1fr; }
    ${Form} > ${FormField}:first-child, ${Form} > ${PrimaryButton} { grid-column: auto; }
    ${ModalOverlay} { padding: 6px; }
    ${ModalContainer} { max-height: 86dvh; }
  }
`;
