import type { LucideIcon } from "lucide-react";
import { StatCardShell, StatDescription, StatIcon, StatTop, StatValue } from "../styles";

/** Props deixam o card reutilizável para qualquer métrica do dashboard. */
type StatCardProps = { label: string; value: string; description: string; icon: LucideIcon; tone: "yellow" | "blue" | "red"; };

/** Exibe uma métrica em um bloco colorido, inspirado em formas Bauhaus. */
export function StatCard({ label, value, description, icon: Icon, tone }: StatCardProps) {
    return <StatCardShell $tone={tone}><StatTop><span>{label}</span><StatIcon><Icon size={17} /></StatIcon></StatTop><StatValue>{value}</StatValue><StatDescription>{description}</StatDescription></StatCardShell>;
}
