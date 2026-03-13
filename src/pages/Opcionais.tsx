import { Layout } from "@/components/Layout";
import { useState } from "react";
import { useOpcionais, useCreateOpcional, useUpdateOpcional, useDeleteOpcional } from "@/hooks/useOpcionais";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Loader2, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

export default function Opcionais() {
  const { data: opcionais = [], isLoading } = useOpcionais();
  const createOpcional = useCreateOpcional();
  const updateOpcional = useUpdateOpcional();
  const deleteOpcional = useDeleteOpcional();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");

  const resetForm = () => {
    setNome("");
    setDescricao("");
    setPreco("");
    setEditingId(null);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setNome(item.nome);
    setDescricao(item.descricao || "");
    setPreco(String(item.preco));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim()) return;
    const data = { nome: nome.trim(), descricao: descricao.trim() || undefined, preco: parseFloat(preco) || 0 };
    if (editingId) {
      await updateOpcional.mutateAsync({ id: editingId, ...data });
    } else {
      await createOpcional.mutateAsync(data);
    }
    setDialogOpen(false);
    resetForm();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Opcionais</h1>
            <p className="text-sm text-muted-foreground">Extras disponíveis para reservas</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="arena-gradient text-primary-foreground rounded-xl gap-2">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Opcional" : "Novo Opcional"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Nome *</label>
                  <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex: Churrasqueira"
                    className="w-full px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição</label>
                  <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição do opcional..."
                    className="w-full px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Preço (R$)</label>
                  <input type="number" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="0"
                    className="w-full px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <Button onClick={handleSave} disabled={createOpcional.isPending || updateOpcional.isPending}
                  className="w-full arena-gradient text-primary-foreground rounded-xl py-5 font-semibold">
                  {(createOpcional.isPending || updateOpcional.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingId ? "Salvar Alterações" : "Criar Opcional"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : opcionais.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum opcional cadastrado</p>
            <p className="text-xs text-muted-foreground mt-1">Adicione extras como churrasqueira, bola, coletes...</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {opcionais.map((item: any) => (
              <div key={item.id} className="bg-card rounded-xl border p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground text-sm">{item.nome}</h3>
                    {!item.ativo && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inativo</span>}
                  </div>
                  {item.descricao && <p className="text-xs text-muted-foreground mt-0.5">{item.descricao}</p>}
                  <p className="text-sm font-bold text-primary mt-1">R$ {Number(item.preco).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={item.ativo} onCheckedChange={(checked) => updateOpcional.mutate({ id: item.id, ativo: checked })} />
                  <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => deleteOpcional.mutate(item.id)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
