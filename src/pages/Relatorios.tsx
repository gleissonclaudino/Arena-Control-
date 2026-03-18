import { Layout } from "@/components/Layout";
import { BarChart3, Download, Loader2, DollarSign, CalendarDays, TrendingUp, Clock, Target, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { usePagamentos } from "@/hooks/usePagamentos";
import { useReservas } from "@/hooks/useReservas";
import { useQuadras } from "@/hooks/useQuadras";
import { useConfiguracoes } from "@/hooks/useConfiguracoes";
import { useClienteStats } from "@/hooks/useClientes";
import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useUpdateQuadra } from "@/hooks/useQuadras";
import { toast } from "@/hooks/use-toast";

const COLORS = [
  "hsl(145, 63%, 22%)", "hsl(217, 91%, 60%)", "hsl(45, 93%, 47%)",
  "hsl(25, 95%, 53%)", "hsl(280, 65%, 55%)", "hsl(0, 72%, 51%)",
];

const FAIXAS = [
  { label: "Manhã (08-12h)", start: 8, end: 12 },
  { label: "Tarde (12-18h)", start: 12, end: 18 },
  { label: "Noite (18-23h)", start: 18, end: 23 },
];

type Tab = "visao-geral" | "ocupacao" | "precificacao";

export default function Relatorios() {
  const { data: pagamentos = [], isLoading: loadingPag } = usePagamentos();
  const { data: reservas = [], isLoading: loadingRes } = useReservas();
  const { data: quadras = [] } = useQuadras();
  const { data: clientes = [] } = useClienteStats();
  const { data: config } = useConfiguracoes();
  const updateQuadra = useUpdateQuadra();
  const [tab, setTab] = useState<Tab>("visao-geral");

  const isLoading = loadingPag || loadingRes;

  // Monthly revenue data
  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({ start: subMonths(new Date(), 5), end: new Date() });
    return months.map((m) => {
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

  // Revenue per court
  const quadraStats = useMemo(() => {
    return quadras.map((q) => {
      const qReservas = reservas.filter((r: any) => r.quadra_id === q.id);
      const qReceita = pagamentos
        .filter((p: any) => p.status === "pago" && qReservas.some((r: any) => r.id === p.reserva_id))
        .reduce((s: number, p: any) => s + Number(p.valor), 0);
      return { id: q.id, nome: q.nome, reservas: qReservas.length, receita: qReceita, preco_hora: Number(q.preco_hora) };
    });
  }, [quadras, reservas, pagamentos]);

  // Revenue by time slot
  const horarioStats = useMemo(() => {
    return FAIXAS.map((faixa) => {
      const faixaReservas = reservas.filter((r: any) => {
        const h = parseInt(r.hora_inicio?.slice(0, 2) || "0");
        return h >= faixa.start && h < faixa.end;
      });
      const faixaReceita = pagamentos
        .filter((p: any) => p.status === "pago" && faixaReservas.some((r: any) => r.id === p.reserva_id))
        .reduce((s: number, p: any) => s + Number(p.valor), 0);
      return { label: faixa.label, reservas: faixaReservas.length, receita: faixaReceita, start: faixa.start, end: faixa.end };
    }).sort((a, b) => b.receita - a.receita);
  }, [reservas, pagamentos]);

  // Occupancy rate
  const ocupacaoStats = useMemo(() => {
    if (!config) return { geral: 0, porQuadra: [] };
    const abertura = parseInt(config.horario_abertura?.slice(0, 2) || "8");
    const fechamento = parseInt(config.horario_fechamento?.slice(0, 2) || "23");
    const horasPorDia = fechamento - abertura;
    const last30 = 30;
    const totalSlots = horasPorDia * last30;

    const porQuadra = quadras.map((q) => {
      const qReservas = reservas.filter((r: any) => {
        const d = new Date(r.data + "T12:00");
        const diffDays = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
        return r.quadra_id === q.id && diffDays <= 30 && diffDays >= 0 && r.status !== "cancelada";
      });
      const horasOcupadas = qReservas.reduce((s: number, r: any) => {
        const hi = parseInt(r.hora_inicio?.slice(0, 2) || "0");
        const hf = parseInt(r.hora_fim?.slice(0, 2) || "0");
        return s + Math.max(0, hf - hi);
      }, 0);
      const taxa = totalSlots > 0 ? (horasOcupadas / totalSlots) * 100 : 0;
      return { id: q.id, nome: q.nome, taxa: Math.min(taxa, 100), horasOcupadas, preco_hora: Number(q.preco_hora) };
    });

    const totalOcupado = porQuadra.reduce((s, q) => s + q.horasOcupadas, 0);
    const totalPossivel = totalSlots * quadras.length;
    const geral = totalPossivel > 0 ? (totalOcupado / totalPossivel) * 100 : 0;

    return { geral: Math.min(geral, 100), porQuadra };
  }, [quadras, reservas, config]);

  // Smart pricing per time slot per court
  const precificacao = useMemo(() => {
    if (!config) return [];
    const abertura = parseInt(config.horario_abertura?.slice(0, 2) || "8");
    const fechamento = parseInt(config.horario_fechamento?.slice(0, 2) || "23");
    const last30 = 30;

    return FAIXAS.map((faixa) => {
      const slotHoras = Math.min(faixa.end, fechamento) - Math.max(faixa.start, abertura);
      if (slotHoras <= 0) return null;
      const totalSlots = slotHoras * last30 * quadras.length;

      const faixaReservas = reservas.filter((r: any) => {
        const h = parseInt(r.hora_inicio?.slice(0, 2) || "0");
        const d = new Date(r.data + "T12:00");
        const diffDays = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
        return h >= faixa.start && h < faixa.end && diffDays <= 30 && diffDays >= 0 && r.status !== "cancelada";
      });

      const horasOcupadas = faixaReservas.reduce((s: number, r: any) => {
        const hi = parseInt(r.hora_inicio?.slice(0, 2) || "0");
        const hf = parseInt(r.hora_fim?.slice(0, 2) || "0");
        return s + Math.max(0, hf - hi);
      }, 0);

      const taxa = totalSlots > 0 ? (horasOcupadas / totalSlots) * 100 : 0;

      let sugestao: "aumentar" | "reduzir" | "manter" = "manter";
      let percentual = 0;
      if (taxa > 80) { sugestao = "aumentar"; percentual = 15; }
      else if (taxa < 40) { sugestao = "reduzir"; percentual = 10; }

      const receitaAtual = pagamentos
        .filter((p: any) => p.status === "pago" && faixaReservas.some((r: any) => r.id === p.reserva_id))
        .reduce((s: number, p: any) => s + Number(p.valor), 0);

      const potencialGanho = sugestao === "aumentar" ? receitaAtual * (percentual / 100) : sugestao === "reduzir" ? receitaAtual * 0.2 : 0;

      return {
        label: faixa.label,
        taxa: Math.min(taxa, 100),
        sugestao,
        percentual,
        receitaAtual,
        potencialGanho,
        reservas: faixaReservas.length,
      };
    }).filter(Boolean) as any[];
  }, [reservas, pagamentos, config, quadras]);

  const potencialTotal = precificacao.reduce((s: number, p: any) => s + (p.potencialGanho || 0), 0);

  const handleExportCSV = () => {
    const lines = [
      "Quadra,Reservas,Receita,Ocupação",
      ...quadraStats.map((q) => {
        const oq = ocupacaoStats.porQuadra.find((o) => o.id === q.id);
        return `${q.nome},${q.reservas},${q.receita.toFixed(2)},${(oq?.taxa || 0).toFixed(1)}%`;
      }),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-arena.csv";
    a.click();
  };

  const applyPrice = async (quadraId: string, percentual: number, tipo: "aumentar" | "reduzir") => {
    const q = quadras.find((q) => q.id === quadraId);
    if (!q) return;
    const fator = tipo === "aumentar" ? 1 + percentual / 100 : 1 - percentual / 100;
    const novoPreco = Math.round(Number(q.preco_hora) * fator);
    await updateQuadra.mutateAsync({ id: quadraId, preco_hora: novoPreco });
    toast({ title: `Preço atualizado para R$ ${novoPreco}/h` });
  };

  if (isLoading) {
    return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios Inteligentes</h1>
            <p className="text-sm text-muted-foreground">Análise estratégica da sua arena</p>
          </div>
          <button onClick={handleExportCSV} className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
            <Download className="h-4 w-4" /> Exportar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {([
            { key: "visao-geral", label: "Visão Geral", icon: BarChart3 },
            { key: "ocupacao", label: "Ocupação", icon: Target },
            { key: "precificacao", label: "Inteligência de Preço", icon: Zap },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                tab === t.key ? "arena-gradient text-primary-foreground" : "bg-card border text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* TAB: Visão Geral */}
        {tab === "visao-geral" && (
          <>
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
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220 13% 91%)", fontSize: "12px" }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Receita"]}
                  />
                  <Bar dataKey="receita" fill="hsl(145, 63%, 22%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Horários mais lucrativos */}
            <div className="bg-card rounded-xl border">
              <div className="p-5 pb-3"><h2 className="font-semibold text-foreground flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Horários Mais Lucrativos</h2></div>
              <div className="divide-y">
                {horarioStats.map((h, i) => (
                  <div key={h.label} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? "bg-[hsl(var(--arena-yellow-light))] text-[hsl(var(--arena-yellow))]" : "bg-muted text-muted-foreground"
                      }`}>{i + 1}º</span>
                      <div>
                        <p className="font-medium text-foreground text-sm">{h.label}</p>
                        <p className="text-xs text-muted-foreground">{h.reservas} reservas</p>
                      </div>
                    </div>
                    <span className="font-bold text-foreground text-sm">R$ {h.receita.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-court revenue */}
            <div className="bg-card rounded-xl border">
              <div className="p-5 pb-3"><h2 className="font-semibold text-foreground">Faturamento por Quadra</h2></div>
              {quadraStats.length > 0 && (
                <div className="px-5 pb-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={quadraStats} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Receita"]}
                        contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220 13% 91%)", fontSize: "12px" }} />
                      <Bar dataKey="receita" radius={[0, 6, 6, 0]}>
                        {quadraStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
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

            {/* Top clientes */}
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
          </>
        )}

        {/* TAB: Ocupação */}
        {tab === "ocupacao" && (
          <>
            <div className="arena-gradient rounded-xl p-5 text-primary-foreground">
              <Target className="h-6 w-6 mb-2 opacity-80" />
              <p className="text-sm opacity-80">Taxa de Ocupação Geral (30 dias)</p>
              <p className="text-4xl font-bold">{ocupacaoStats.geral.toFixed(1)}%</p>
            </div>

            <div className="bg-card rounded-xl border">
              <div className="p-5 pb-3"><h2 className="font-semibold text-foreground">Ocupação por Quadra</h2></div>
              <div className="divide-y">
                {ocupacaoStats.porQuadra.map((q) => (
                  <div key={q.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-foreground text-sm">{q.nome}</p>
                      <span className={`text-sm font-bold ${
                        q.taxa > 70 ? "text-[hsl(var(--arena-green))]" : q.taxa > 40 ? "text-[hsl(var(--arena-yellow))]" : "text-[hsl(var(--arena-red))]"
                      }`}>{q.taxa.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all"
                        style={{
                          width: `${q.taxa}%`,
                          backgroundColor: q.taxa > 70 ? "hsl(145, 63%, 22%)" : q.taxa > 40 ? "hsl(45, 93%, 47%)" : "hsl(0, 72%, 51%)",
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{q.horasOcupadas}h reservadas nos últimos 30 dias</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* TAB: Precificação Inteligente */}
        {tab === "precificacao" && (
          <>
            {potencialTotal > 0 && (
              <div className="bg-[hsl(var(--arena-yellow-light))] border border-[hsl(var(--arena-yellow))]/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-5 w-5 text-[hsl(var(--arena-yellow))]" />
                  <p className="font-semibold text-foreground">Potencial de Ganho</p>
                </div>
                <p className="text-3xl font-bold text-foreground">+R$ {potencialTotal.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}/mês</p>
                <p className="text-xs text-muted-foreground mt-1">Estimativa baseada nos ajustes sugeridos</p>
              </div>
            )}

            <div className="space-y-4">
              {precificacao.map((p: any) => (
                <div key={p.label} className="bg-card rounded-xl border p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.reservas} reservas • R$ {p.receitaAtual.toLocaleString("pt-BR")}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      p.sugestao === "aumentar" ? "bg-[hsl(var(--arena-green-light))] text-[hsl(var(--arena-green))]" :
                      p.sugestao === "reduzir" ? "bg-[hsl(var(--arena-red-light))] text-[hsl(var(--arena-red))]" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      Ocupação: {p.taxa.toFixed(0)}%
                    </span>
                  </div>

                  <div className="w-full bg-muted rounded-full h-2 mb-3">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${p.taxa}%`,
                        backgroundColor: p.taxa > 80 ? "hsl(145, 63%, 22%)" : p.taxa > 40 ? "hsl(45, 93%, 47%)" : "hsl(0, 72%, 51%)",
                      }}
                    />
                  </div>

                  {p.sugestao !== "manter" && (
                    <div className={`rounded-lg p-3 ${
                      p.sugestao === "aumentar" ? "bg-[hsl(var(--arena-green-light))]" : "bg-[hsl(var(--arena-red-light))]"
                    }`}>
                      <p className="text-sm font-medium text-foreground">
                        💡 Sugestão: {p.sugestao === "aumentar" ? `Aumentar preço em ${p.percentual}%` : `Reduzir preço em ${p.percentual}% para atrair demanda`}
                      </p>
                      {p.potencialGanho > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Potencial: +R$ {p.potencialGanho.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}/mês
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {quadras.map((q) => (
                          <Button
                            key={q.id}
                            size="sm"
                            variant="outline"
                            className="text-xs rounded-lg"
                            onClick={() => applyPrice(q.id, p.percentual, p.sugestao)}
                          >
                            Aplicar em {q.nome}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.sugestao === "manter" && (
                    <p className="text-sm text-muted-foreground">✅ Preço equilibrado para este horário</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
