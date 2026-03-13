import { Layout } from "@/components/Layout";
import { BarChart3, Download, Loader2, DollarSign, CalendarDays, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { usePagamentos } from "@/hooks/usePagamentos";
import { useReservas } from "@/hooks/useReservas";
import { useQuadras } from "@/hooks/useQuadras";
import { useClienteStats } from "@/hooks/useClientes";
import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Relatorios() {
  const { data: pagamentos = [], isLoading: loadingPag } = usePagamentos();
  const { data: reservas = [], isLoading: loadingRes } = useReservas();
  const { data: quadras = [] } = useQuadras();
  const { data: clientes = [] } = useClienteStats();

  const isLoading = loadingPag || loadingRes;

  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({ start: subMonths(new Date(), 5), end: new Date() });
    return months.map(m => {
      const mStart = format(startOfMonth(m), "yyyy-MM-dd");
      const mEnd = format(endOfMonth(m), "yyyy-MM-dd");
      const monthPag = pagamentos.filter((p: any) => p.status === "pago" && p.created_at >= mStart && p.created_at <= mEnd + "T23:59:59");
      return {
        month: format(m, "MMM", { locale: ptBR }),
        receita: monthPag.reduce((s: number, p: any) => s + Number(p.valor), 0),
      };
    });
  }, [pagamentos]);

  const totalReceita = pagamentos.filter((p: any) => p.status === "pago").reduce((s: number, p: any) => s + Number(p.valor), 0);
  const totalReservas = reservas.length;

  const quadraStats = useMemo(() => {
    return quadras.map(q => {
      const qReservas = reservas.filter((r: any) => r.quadra_id === q.id);
      const qReceita = pagamentos.filter((p: any) => p.status === "pago" && qReservas.some((r: any) => r.id === p.reserva_id)).reduce((s: number, p: any) => s + Number(p.valor), 0);
      return { nome: q.nome, reservas: qReservas.length, receita: qReceita };
    });
  }, [quadras, reservas, pagamentos]);

  const handleExportCSV = () => {
    const lines = ["Quadra,Reservas,Receita", ...quadraStats.map(q => `${q.nome},${q.reservas},${q.receita.toFixed(2)}`)];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "relatorio.csv"; a.click();
  };

  if (isLoading) {
    return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
            <p className="text-sm text-muted-foreground">Análise e desempenho</p>
          </div>
          <button onClick={handleExportCSV} className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="arena-gradient rounded-xl p-4 text-primary-foreground">
            <DollarSign className="h-5 w-5 mb-2 opacity-80" />
            <p className="text-xs opacity-80">Receita Total</p>
            <p className="text-2xl font-bold">R$ {totalReceita.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <CalendarDays className="h-5 w-5 mb-2 text-primary" />
            <p className="text-xs text-muted-foreground">Total Reservas</p>
            <p className="text-2xl font-bold text-foreground">{totalReservas}</p>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <TrendingUp className="h-5 w-5 mb-2 text-primary" />
            <p className="text-xs text-muted-foreground">Clientes</p>
            <p className="text-2xl font-bold text-foreground">{clientes.length}</p>
          </div>
        </div>

        {/* Monthly chart */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold text-foreground mb-4">Receita Mensal</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220 13% 91%)", fontSize: "12px" }}
                formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Receita"]} />
              <Bar dataKey="receita" fill="hsl(145 63% 22%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Per-court breakdown */}
        <div className="bg-card rounded-xl border">
          <div className="p-5 pb-3"><h2 className="font-semibold text-foreground">Por Quadra</h2></div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t text-muted-foreground">
                <th className="text-left font-medium px-5 py-3">Quadra</th>
                <th className="text-center font-medium px-3 py-3">Reservas</th>
                <th className="text-right font-medium px-5 py-3">Receita</th>
              </tr>
            </thead>
            <tbody>
              {quadraStats.map((q) => (
                <tr key={q.nome} className="border-t">
                  <td className="px-5 py-3 font-medium text-foreground">{q.nome}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{q.reservas}</td>
                  <td className="px-5 py-3 text-right font-medium text-foreground">R$ {q.receita.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Per-client breakdown */}
        <div className="bg-card rounded-xl border">
          <div className="p-5 pb-3"><h2 className="font-semibold text-foreground">Top Clientes</h2></div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t text-muted-foreground">
                <th className="text-left font-medium px-5 py-3">Cliente</th>
                <th className="text-center font-medium px-3 py-3">Reservas</th>
                <th className="text-right font-medium px-5 py-3">Gasto Total</th>
              </tr>
            </thead>
            <tbody>
              {clientes.sort((a: any, b: any) => (b.totalGasto || 0) - (a.totalGasto || 0)).slice(0, 10).map((c: any) => (
                <tr key={c.id} className="border-t">
                  <td className="px-5 py-3 font-medium text-foreground">{c.nome}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{c.totalReservas}</td>
                  <td className="px-5 py-3 text-right font-medium text-foreground">R$ {(c.totalGasto || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
