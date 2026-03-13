import { Layout } from "@/components/Layout";
import { Search, Plus, MoreVertical, Loader2 } from "lucide-react";
import { useState } from "react";
import { useClienteStats, useCreateCliente } from "@/hooks/useClientes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Clientes() {
  const [search, setSearch] = useState("");
  const { data: clientes = [], isLoading } = useClienteStats();
  const createCliente = useCreateCliente();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  const filtered = clientes.filter((c: any) => c.nome.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!nome.trim() || !telefone.trim()) {
      toast({ title: "Nome e telefone são obrigatórios", variant: "destructive" });
      return;
    }
    try {
      await createCliente.mutateAsync({ nome: nome.trim(), telefone: telefone.trim(), email: email.trim() || undefined });
      setOpen(false);
      setNome("");
      setTelefone("");
      setEmail("");
    } catch {}
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-sm text-muted-foreground">Diretório de clientes</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <Plus className="h-4 w-4" /> Adicionar
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Nome *</label>
                  <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo"
                    className="w-full px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone *</label>
                  <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="+55 (11) 99999-0000"
                    className="w-full px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com"
                    className="w-full px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <Button onClick={handleCreate} disabled={createCliente.isPending} className="w-full arena-gradient text-primary-foreground rounded-xl">
                  {createCliente.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Criar Cliente
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar clientes por nome..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="arena-gradient rounded-2xl p-4 text-primary-foreground">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Total Clientes</p>
            <p className="text-3xl font-bold mt-1">{clientes.length}</p>
          </div>
          <div className="bg-card border rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Receita Total</p>
            <p className="text-3xl font-bold mt-1 text-foreground">
              R$ {clientes.reduce((s: number, c: any) => s + (c.totalGasto || 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado</p>
            ) : filtered.map((c: any) => (
              <div key={c.id} className="bg-card border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[hsl(var(--arena-orange))] flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {c.nome.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{c.nome}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.totalReservas > 0 ? "status-paid" : "status-free"}`}>
                        {c.totalReservas > 0 ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="text-muted-foreground font-medium uppercase">Reserv.</p>
                    <p className="text-foreground font-bold text-lg">{c.totalReservas}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium uppercase">Gasto</p>
                    <p className="text-foreground font-bold text-lg">R$ {(c.totalGasto || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium uppercase">Última Reserva</p>
                    <p className="text-foreground font-bold text-sm">{c.ultimaReserva ? format(new Date(c.ultimaReserva + "T00:00:00"), "dd/MM/yyyy") : "—"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
