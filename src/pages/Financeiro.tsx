import { Layout } from "@/components/Layout";
import { DollarSign, TrendingUp, TrendingDown, Download, Plus, Loader2, Smartphone, CreditCard, Banknote } from "lucide-react";
import { useState, useMemo } from "react";
import { usePagamentos } from "@/hooks/usePagamentos";
import { useDespesas, useCreateDespesa } from "@/hooks/useDespesas";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, subDays, isAfter } from "date-fns";

const periods = ["Todos", "Este Mês", "Últimos 7 dias"];
const categorias = ["Manutenção", "Conta de luz", "Funcionários", "Limpeza", "Equipamentos", "Outros"];
const metodoLabels: Record<string, string> = { pix: "PIX", cartao: "Cartão", dinheiro: "Dinheiro" };
const metodoIcons: Record<string, React.ReactNode> = {
  pix: <Smartphone className="h-4 w-4" />,
  cartao: <CreditCard className="h-4 w-4" />,
  dinheiro: <Banknote className="h-4 w-4" />,
};

export default function Financeiro() {
  const [period, setPeriod] = useState("Todos");
  const { data: pagamentos = [], isLoading } = usePagamentos();
  const { data: despesas = [], isLoading: loadingDespesas } = useDespesas();
  const createDespesa = useCreateDespesa();
  const [open, setOpen] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Outros");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"));

  const filterByPeriod = (dateStr: string) => {
    const now = new Date();
    const d = new Date(dateStr);
    if (period === "Este Mês") return isAfter(d, startOfMonth(now));
    if (period === "Últimos 7 dias") return isAfter(d, subDays(now, 7));
    return true;
  };

  const filteredPagamentos = useMemo(() =>
    pagamentos.filter((p: any) => p.status === "pago" && filterByPeriod(p.created_at)),
    [pagamentos, period]
  );

  const filteredDespesas = useMemo(() =>
    despesas.filter((d: any) => filterByPeriod(d.data)),
    [despesas, period]
  );

  const totalReceitas = filteredPagamentos.reduce((s: number, p: any) => s + Number(p.valor), 0);
  const totalDespesas = filteredDespesas.reduce((s: number, d: any) => s + Number(d.valor), 0);
  const lucro = totalReceitas - totalDespesas;

  // By method
  const byMethod = (method: string) =>
    filteredPagamentos.filter((p: any) => p.metodo === method).reduce((s: number, p: any) => s + Number(p.valor), 0);
  const pixTotal = byMethod("pix");
  const cartaoTotal = byMethod("cartao");
  const dinheiroTotal = byMethod("dinheiro");
  const maxMethod = Math.max(pixTotal, cartaoTotal, dinheiroTotal, 1);

  const handleCreateDespesa = async () => {
    if (!descricao.trim() || !valor || parseFloat(valor) <= 0) {
      return;
    }
    try {
      await createDespesa.mutateAsync({ descricao: descricao.trim(), categoria, valor: parseFloat(valor), data });
      setOpen(false); setDescricao(""); setValor(""); setCategoria("Outros");
    } catch {}
  };

  const handleExport = () => {
    const lines = ["Tipo,Descrição,Valor,Data,Método"];
    filteredPagamentos.forEach((p: any) => {
      lines.push(`Receita,${p.reservas?.clientes?.nome || "Reserva"},${p.valor},${format(new Date(p.created_at), "dd/MM/yyyy")},${metodoLabels[p.metodo] || p.metodo}`);
    });
    filteredDespesas.forEach((d: any) => {
      lines.push(`Despesa,${d.descricao},${d.valor},${format(new Date(d.data + "T00:00:00"), "dd/MM/yyyy")},—`);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "financeiro.csv"; a.click();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
            <p className="text-sm text-muted-foreground">Controle financeiro da arena</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="arena-gradient text-primary-foreground gap-1.5 rounded-full">
                <Plus className="h-4 w-4" /> Despesa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Adicionar Despesa</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição *</label>
                  <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Conta de luz"
                    className="w-full px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Categoria</label>
                  <select value={categoria} onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
                    {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Valor *</label>
                    <input type="number" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0.00"
                      className="w-full px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Data</label>
                    <input type="date" value={data} onChange={(e) => setData(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
                <Button onClick={handleCreateDespesa} disabled={createDespesa.isPending} className="w-full arena-gradient text-primary-foreground rounded-xl">
                  {createDespesa.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Registrar Despesa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Period filter */}
        <div className="flex gap-2">
          {periods.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${period === p ? "arena-gradient text-primary-foreground" : "bg-card border text-foreground"}`}>
              {p}
            </button>
          ))}
          <button onClick={handleExport} className="ml-auto text-sm text-primary font-medium flex items-center gap-1 hover:underline">
            <Download className="h-4 w-4" /> Exportar
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-[hsl(var(--arena-green))]" />
              <span className="text-xs text-muted-foreground">Receitas</span>
            </div>
            <p className="text-lg font-bold text-[hsl(var(--arena-green))]">R$ {totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Despesas</span>
            </div>
            <p className="text-lg font-bold text-destructive">R$ {totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Lucro</span>
            </div>
            <p className={`text-lg font-bold ${lucro >= 0 ? "text-[hsl(var(--arena-green))]" : "text-destructive"}`}>
              R$ {lucro.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Payment method breakdown - bar chart */}
        <div className="bg-card border rounded-xl p-4">
          <h3 className="text-xs font-semibold text-primary tracking-wider mb-4">RECEITA POR MÉTODO</h3>
          <div className="space-y-3">
            {[
              { key: "pix", total: pixTotal },
              { key: "cartao", total: cartaoTotal },
              { key: "dinheiro", total: dinheiroTotal },
            ].map(({ key, total }) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-foreground">
                    {metodoIcons[key]}
                    <span className="font-medium">{metodoLabels[key]}</span>
                  </div>
                  <span className="font-bold text-foreground">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full arena-gradient rounded-full transition-all duration-500"
                    style={{ width: `${maxMethod > 0 ? (total / maxMethod) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent expenses */}
        {filteredDespesas.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-primary tracking-wider mb-3">DESPESAS RECENTES</h3>
            <div className="space-y-2">
              {filteredDespesas.slice(0, 10).map((d: any) => (
                <div key={d.id} className="bg-card border rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-destructive/10">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{d.descricao}</p>
                    <p className="text-xs text-muted-foreground">{d.categoria} • {format(new Date(d.data + "T00:00:00"), "dd/MM/yyyy")}</p>
                  </div>
                  <p className="text-sm font-bold text-destructive">
                    -R$ {Number(d.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent payments */}
        <div>
          <h3 className="text-xs font-semibold text-primary tracking-wider mb-3">RECEITAS RECENTES</h3>
          {isLoading || loadingDespesas ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filteredPagamentos.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhuma receita encontrada</p>
          ) : (
            <div className="space-y-2">
              {filteredPagamentos.slice(0, 10).map((t: any) => (
                <div key={t.id} className="bg-card border rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[hsl(var(--arena-green-light))]">
                    <DollarSign className="h-5 w-5 text-[hsl(var(--arena-green))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {t.reservas?.clientes?.nome || "Reserva"} - {t.reservas?.quadras?.nome || ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{format(new Date(t.created_at), "dd/MM/yyyy")} • {metodoLabels[t.metodo] || t.metodo}</p>
                  </div>
                  <p className="text-sm font-bold text-[hsl(var(--arena-green))]">
                    R$ {Number(t.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
