import { Layout } from "@/components/Layout";
import { useState } from "react";
import { DollarSign, Search, Plus, Loader2, CreditCard, Banknote, Smartphone } from "lucide-react";
import { usePagamentos, useCreatePagamento } from "@/hooks/usePagamentos";
import { useReservas } from "@/hooks/useReservas";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const metodos = ["pix", "cartao", "dinheiro"];
const metodoLabels: Record<string, string> = { pix: "PIX", cartao: "Cartão", dinheiro: "Dinheiro" };
const metodoIcons: Record<string, React.ReactNode> = {
  pix: <Smartphone className="h-4 w-4" />,
  cartao: <CreditCard className="h-4 w-4" />,
  dinheiro: <Banknote className="h-4 w-4" />,
};

export default function Pagamentos() {
  const { data: pagamentos = [], isLoading } = usePagamentos();
  const { data: reservas = [] } = useReservas();
  const createPagamento = useCreatePagamento();
  const [open, setOpen] = useState(false);
  const [reservaId, setReservaId] = useState("");
  const [valor, setValor] = useState("");
  const [metodo, setMetodo] = useState("pix");
  const [search, setSearch] = useState("");

  const pagosPagamentos = pagamentos.filter((p: any) => p.status === "pago");
  const totalPago = pagosPagamentos.reduce((s: number, p: any) => s + Number(p.valor), 0);
  const pendingReservas = reservas.filter((r: any) => r.status === "pendente" || r.status === "confirmada");

  const filtered = pagosPagamentos.filter((p: any) =>
    (p.reservas?.clientes?.nome || "").toLowerCase().includes(search.toLowerCase())
  );

  const byMethod = (method: string) => filtered.filter((p: any) => p.metodo === method);

  const handleCreate = async () => {
    if (!reservaId || !valor || parseFloat(valor) <= 0) {
      toast({ title: "Selecione uma reserva e informe o valor", variant: "destructive" });
      return;
    }
    try {
      await createPagamento.mutateAsync({ reserva_id: reservaId, valor: parseFloat(valor), metodo });
      setOpen(false); setReservaId(""); setValor("");
    } catch {}
  };

  const renderPaymentCard = (p: any) => (
    <div key={p.id} className="bg-card border rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[hsl(var(--arena-green-light))]">
        <DollarSign className="h-5 w-5 text-[hsl(var(--arena-green))]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{p.reservas?.clientes?.nome || "—"}</p>
        <p className="text-xs text-muted-foreground">{p.reservas?.quadras?.nome || "—"} • {format(new Date(p.created_at), "dd/MM/yyyy")}</p>
      </div>
      <p className="text-sm font-bold text-[hsl(var(--arena-green))]">
        R$ {Number(p.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );

  const renderMethodSection = (method: string) => {
    const items = byMethod(method);
    const total = items.reduce((s: number, p: any) => s + Number(p.valor), 0);
    return (
      <div key={method}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{metodoIcons[method]}</span>
            <h3 className="text-sm font-bold text-foreground">{metodoLabels[method]}</h3>
          </div>
          <span className="text-sm font-bold text-foreground">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground mb-4">Nenhum pagamento</p>
        ) : (
          <div className="space-y-2 mb-4">{items.map(renderPaymentCard)}</div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pagamentos</h1>
            <p className="text-sm text-muted-foreground">Controle de pagamentos</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="arena-gradient text-primary-foreground gap-1.5 rounded-full">
                <Plus className="h-4 w-4" /> Novo Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Pagamento</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Reserva *</label>
                  <select value={reservaId} onChange={(e) => setReservaId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Selecione uma reserva</option>
                    {pendingReservas.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.clientes?.nome || "—"} - {r.quadras?.nome || "—"} - {format(new Date(r.data + "T00:00:00"), "dd/MM")} - R$ {Number(r.valor).toFixed(0)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Valor *</label>
                  <input type="number" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Método</label>
                  <div className="flex flex-wrap gap-2">
                    {metodos.map((m) => (
                      <button key={m} onClick={() => setMetodo(m)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${metodo === m ? "arena-gradient text-primary-foreground" : "bg-card border text-foreground"}`}>
                        {metodoLabels[m]}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={createPagamento.isPending} className="w-full arena-gradient text-primary-foreground rounded-xl">
                  {createPagamento.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Registrar Pagamento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="arena-gradient rounded-2xl p-6 text-primary-foreground">
          <p className="text-sm opacity-80">Total Recebido</p>
          <p className="text-4xl font-bold mt-1">R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          <p className="text-xs mt-2 opacity-70">{pagosPagamentos.length} pagamentos registrados</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por cliente..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2">
            {metodos.map(renderMethodSection)}
          </div>
        )}
      </div>
    </Layout>
  );
}
