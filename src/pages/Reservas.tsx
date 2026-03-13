import { Layout } from "@/components/Layout";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReservas } from "@/hooks/useReservas";
import { format } from "date-fns";

const statusConfig: Record<string, string> = {
  confirmada: "status-paid",
  pendente: "status-pending",
  cancelada: "status-cancelled",
};
const statusLabels: Record<string, string> = { confirmada: "Confirmado", pendente: "Pendente", cancelada: "Cancelado" };

export default function Reservas() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const { data: reservas = [], isLoading } = useReservas();

  const filtered = reservas.filter((r: any) => {
    const matchSearch = (r.clientes?.nome || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reservas</h1>
            <p className="text-sm text-muted-foreground">Gerencie todas as reservas</p>
          </div>
          <Button className="arena-gradient text-primary-foreground gap-1.5 rounded-full" onClick={() => navigate("/reservas/nova")}>
            <Plus className="h-4 w-4" /> Nova Reserva
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por cliente..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-2">
            {(["confirmada", "pendente", "cancelada"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? statusConfig[s] : "bg-card border text-foreground"}`}>
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left font-medium px-5 py-3">Cliente</th>
                  <th className="text-left font-medium px-3 py-3">Quadra</th>
                  <th className="text-left font-medium px-3 py-3">Data</th>
                  <th className="text-left font-medium px-3 py-3">Horário</th>
                  <th className="text-left font-medium px-3 py-3">Status</th>
                  <th className="text-right font-medium px-5 py-3">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma reserva encontrada</td></tr>
                ) : filtered.map((r: any) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/reservas/${r.id}`)}>
                    <td className="px-5 py-3 font-medium text-foreground">{r.clientes?.nome || "—"}</td>
                    <td className="px-3 py-3 text-muted-foreground">{r.quadras?.nome || "—"}</td>
                    <td className="px-3 py-3 text-muted-foreground">{format(new Date(r.data + "T00:00:00"), "dd/MM/yyyy")}</td>
                    <td className="px-3 py-3 text-muted-foreground">{r.hora_inicio?.slice(0, 5)}-{r.hora_fim?.slice(0, 5)}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig[r.status] || ""}`}>{statusLabels[r.status] || r.status}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-foreground">R$ {Number(r.valor).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
