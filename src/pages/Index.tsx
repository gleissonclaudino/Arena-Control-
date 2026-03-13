import { Layout } from "@/components/Layout";
import { DollarSign, CalendarDays, TrendingUp, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

const statusConfig: Record<string, string> = {
  confirmada: "status-paid",
  pendente: "status-pending",
  cancelada: "status-cancelled",
};

const statusLabels: Record<string, string> = {
  confirmada: "Confirmado",
  pendente: "Pendente",
  cancelada: "Cancelado",
};

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const occupancyData = [
    { day: "Seg", ocupacao: 0 }, { day: "Ter", ocupacao: 0 }, { day: "Qua", ocupacao: 0 },
    { day: "Qui", ocupacao: 0 }, { day: "Sex", ocupacao: 0 }, { day: "Sáb", ocupacao: 0 }, { day: "Dom", ocupacao: 0 },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral da sua Arena hoje</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Receita Mensal"
            value={`R$ ${(stats?.receitaMensal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`}
            change={`${stats?.totalReservasMes || 0} reservas no mês`}
            icon={<DollarSign className="h-5 w-5" />}
            variant="primary"
          />
          <KPICard
            label="Total Reservas"
            value={String(stats?.totalReservasMes || 0)}
            change={`${stats?.reservasHoje || 0} hoje`}
            icon={<CalendarDays className="h-5 w-5" />}
          />
          <KPICard
            label="Esta Semana"
            value={String(stats?.reservasSemana || 0)}
            change="reservas na semana"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <KPICard
            label="Pendentes Pgto"
            value={String(stats?.pendentesCount || 0)}
            change={`R$ ${(stats?.pendentesValor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })} total`}
            icon={<AlertTriangle className="h-5 w-5" />}
            variant="warning"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Fluxo de Horários</h2>
              <span className="text-xs text-muted-foreground">Esta Semana</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={occupancyData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220 13% 91%)", fontSize: "12px" }}
                  formatter={(value: number) => [`${value}%`, "Ocupação"]}
                />
                <Bar dataKey="ocupacao" fill="hsl(145 63% 22%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Alerts */}
          <div className="bg-card rounded-xl border p-5">
            <h2 className="font-semibold text-foreground mb-4">Alertas Importantes</h2>
            <div className="space-y-3">
              {(stats?.pendentesCount || 0) > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[hsl(var(--arena-yellow-light))]">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-[hsl(var(--arena-yellow))]" />
                  <p className="text-sm text-foreground">{stats?.pendentesCount} reservas com pagamento pendente</p>
                </div>
              )}
              {(stats?.reservasHoje || 0) > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[hsl(var(--arena-blue-light))]">
                  <CalendarDays className="h-4 w-4 mt-0.5 flex-shrink-0 text-[hsl(var(--arena-blue))]" />
                  <p className="text-sm text-foreground">{stats?.reservasHoje} reservas agendadas para hoje</p>
                </div>
              )}
              {(stats?.pendentesCount || 0) === 0 && (stats?.reservasHoje || 0) === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum alerta no momento</p>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Reservations Table */}
        <div className="bg-card rounded-xl border">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="font-semibold text-foreground">Próximas Reservas</h2>
            <a href="/reservas" className="text-sm text-primary font-medium hover:underline">Ver Tudo →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t text-muted-foreground">
                  <th className="text-left font-medium px-5 py-3">Cliente</th>
                  <th className="text-left font-medium px-3 py-3">Quadra</th>
                  <th className="text-left font-medium px-3 py-3">Data</th>
                  <th className="text-left font-medium px-3 py-3">Horário</th>
                  <th className="text-left font-medium px-3 py-3">Status</th>
                  <th className="text-right font-medium px-5 py-3">Valor</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.upcoming || []).length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma reserva próxima</td></tr>
                ) : (
                  (stats?.upcoming || []).map((r: any) => (
                    <tr key={r.id} className="border-t hover:bg-muted/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground">{r.clientes?.nome || "—"}</td>
                      <td className="px-3 py-3 text-muted-foreground">{r.quadras?.nome || "—"}</td>
                      <td className="px-3 py-3 text-muted-foreground">{format(new Date(r.data + "T00:00:00"), "dd/MM")}</td>
                      <td className="px-3 py-3 text-muted-foreground">{r.hora_inicio?.slice(0, 5)} - {r.hora_fim?.slice(0, 5)}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig[r.status] || ""}`}>
                          {statusLabels[r.status] || r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-foreground">R$ {Number(r.valor).toFixed(0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function KPICard({ label, value, change, icon, variant = "default" }: {
  label: string; value: string; change: string; icon: React.ReactNode; variant?: "default" | "primary" | "warning";
}) {
  const isPrimary = variant === "primary";
  const isWarning = variant === "warning";
  return (
    <div className={`rounded-xl p-4 ${isPrimary ? "arena-gradient text-primary-foreground" : "bg-card border"}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${
        isPrimary ? "bg-primary-foreground/20" : isWarning ? "bg-[hsl(var(--arena-orange-light))] text-[hsl(var(--arena-orange))]" : "bg-accent text-accent-foreground"
      }`}>{icon}</div>
      <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${isPrimary ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</p>
      <p className={`text-2xl font-bold ${isPrimary ? "" : "text-foreground"}`}>{value}</p>
      <p className={`text-xs mt-1 ${isPrimary ? "text-primary-foreground/70" : "text-primary"}`}>{change}</p>
    </div>
  );
}
