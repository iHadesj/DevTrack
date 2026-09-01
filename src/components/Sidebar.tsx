import { BookOpenCheck, BriefcaseBusiness, CheckSquare2, CircleDot, LayoutDashboard } from "lucide-react";
import { BauhausBand, BauhausMotif } from "./BauhausMotif";
import { Brand, BrandMark, NavItem, NavLabel, OfflineBadge, SidebarFooter, SidebarNav, SidebarShell } from "../styles";

/** Telas que o menu lateral pode selecionar. A união impede navegar para uma tela inválida. */
export type AppView = "Hoje" | "Tarefas" | "Estudos" | "Estágio";

/** Props que tornam a Sidebar controlada pela página pai. */
type SidebarProps = { activeView: AppView; pendingSyncCount: number; onSelect: (view: AppView) => void; };

/** Itens declarados como dados para o JSX só precisar percorrer a lista. */
const navigation = [
    { label: "Hoje" as const, icon: LayoutDashboard },
    { label: "Tarefas" as const, icon: CheckSquare2 },
    { label: "Estudos" as const, icon: BookOpenCheck },
    { label: "Estágio" as const, icon: BriefcaseBusiness },
];

/** Menu lateral com o estado atual da sincronização offline-first. */
export function Sidebar({ activeView, pendingSyncCount, onSelect }: SidebarProps) {
    return <SidebarShell className="sidebar"><BauhausMotif variant="sidebar" /><Brand><BrandMark><CircleDot size={18} /></BrandMark><span>devtrack</span></Brand><BauhausBand /><SidebarNav aria-label="Navegação principal"><NavLabel>Meu espaço</NavLabel>{navigation.map(({ label, icon: Icon }) => <NavItem key={label} type="button" $active={activeView === label} onClick={() => onSelect(label)}><Icon size={18} />{label}</NavItem>)}</SidebarNav><SidebarFooter><OfflineBadge><strong><CircleDot size={11} /> Offline-first ativo</strong>{pendingSyncCount === 0 ? "Tudo salvo neste dispositivo." : `${pendingSyncCount} alteração(ões) na fila de sync.`}</OfflineBadge></SidebarFooter></SidebarShell>;
}
