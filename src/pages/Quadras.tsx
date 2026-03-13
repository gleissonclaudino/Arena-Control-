import { Layout } from "@/components/Layout";
import { useState, useRef } from "react";
import { useQuadras, useCreateQuadra, useUpdateQuadra, useDeleteQuadra, useQuadraFotos, useUploadQuadraFoto, useDeleteQuadraFoto, useQuadraRecursos, useCreateQuadraRecurso, useDeleteQuadraRecurso } from "@/hooks/useQuadras";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2, Loader2, MapPin, Camera, X, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Quadras() {
  const { data: quadras = [], isLoading } = useQuadras();
  const createQuadra = useCreateQuadra();
  const updateQuadra = useUpdateQuadra();
  const deleteQuadra = useDeleteQuadra();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("Futebol Society");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");

  const resetForm = () => { setNome(""); setTipo("Futebol Society"); setPreco(""); setDescricao(""); setEditingId(null); };

  const openEdit = (q: any) => {
    setEditingId(q.id); setNome(q.nome); setTipo(q.tipo_esporte); setPreco(String(q.preco_hora)); setDescricao(q.descricao || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    const data = { nome: nome.trim(), tipo_esporte: tipo, preco_hora: parseFloat(preco) || 0, descricao: descricao.trim() || undefined };
    if (editingId) {
      await updateQuadra.mutateAsync({ id: editingId, ...data });
    } else {
      await createQuadra.mutateAsync(data);
    }
    setDialogOpen(false); resetForm();
  };

  // Detail view
  const [detailId, setDetailId] = useState<string | null>(null);

  if (detailId) {
    return <QuadraDetail quadraId={detailId} onBack={() => setDetailId(null)} />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Quadras</h1>
            <p className="text-sm text-muted-foreground">Gerencie suas quadras</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="arena-gradient text-primary-foreground rounded-xl gap-2"><Plus className="h-4 w-4" /> Adicionar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingId ? "Editar Quadra" : "Nova Quadra"}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <Field label="Nome *" value={nome} onChange={setNome} placeholder="ex: Quadra 1" />
                <Field label="Tipo de Esporte" value={tipo} onChange={setTipo} placeholder="Futebol Society" />
                <Field label="Preço por Hora (R$)" value={preco} onChange={setPreco} type="number" />
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição</label>
                  <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição da quadra..."
                    className="w-full px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} />
                </div>
                <Button onClick={handleSave} disabled={createQuadra.isPending || updateQuadra.isPending}
                  className="w-full arena-gradient text-primary-foreground rounded-xl py-5 font-semibold">
                  {(createQuadra.isPending || updateQuadra.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingId ? "Salvar Alterações" : "Criar Quadra"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : quadras.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border">
            <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma quadra cadastrada</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {quadras.map((q: any) => (
              <div key={q.id} className="bg-card rounded-xl border p-4 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setDetailId(q.id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground text-sm">{q.nome}</h3>
                    {!q.ativa && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inativa</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{q.tipo_esporte} • R$ {Number(q.preco_hora).toFixed(0)}/h</p>
                  {q.descricao && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{q.descricao}</p>}
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Switch checked={q.ativa} onCheckedChange={(checked) => updateQuadra.mutate({ id: q.id, ativa: checked })} />
                  <button onClick={() => openEdit(q)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => deleteQuadra.mutate(q.id)} className="p-2 rounded-lg hover:bg-muted transition-colors">
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

function QuadraDetail({ quadraId, onBack }: { quadraId: string; onBack: () => void }) {
  const { data: fotos = [] } = useQuadraFotos(quadraId);
  const uploadFoto = useUploadQuadraFoto();
  const deleteFoto = useDeleteQuadraFoto();
  const { data: recursos = [] } = useQuadraRecursos(quadraId);
  const createRecurso = useCreateQuadraRecurso();
  const deleteRecurso = useDeleteQuadraRecurso();
  const fileRef = useRef<HTMLInputElement>(null);
  const [novoRecurso, setNovoRecurso] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      await uploadFoto.mutateAsync({ quadraId, file });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleAddRecurso = async () => {
    if (!novoRecurso.trim()) return;
    await createRecurso.mutateAsync({ quadraId, nome: novoRecurso.trim() });
    setNovoRecurso("");
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Detalhes da Quadra</h1>
        </div>

        {/* Fotos */}
        <div>
          <h3 className="text-xs font-semibold text-primary tracking-wider mb-3">FOTOS</h3>
          <div className="bg-card rounded-xl border p-4">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {fotos.map((f: any) => (
                <div key={f.id} className="relative group aspect-square rounded-lg overflow-hidden">
                  <img src={f.url} alt="Quadra" className="w-full h-full object-cover" />
                  <button onClick={() => deleteFoto.mutate(f.id)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploadFoto.isPending}
              className="w-full rounded-xl gap-2">
              {uploadFoto.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              Adicionar Fotos
            </Button>
          </div>
        </div>

        {/* Recursos */}
        <div>
          <h3 className="text-xs font-semibold text-primary tracking-wider mb-3">RECURSOS DA QUADRA</h3>
          <div className="bg-card rounded-xl border p-4 space-y-3">
            <div className="flex gap-2">
              <input value={novoRecurso} onChange={(e) => setNovoRecurso(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddRecurso()}
                placeholder="Digite um recurso (ex: Churrasqueira)"
                className="flex-1 px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <Button onClick={handleAddRecurso} disabled={createRecurso.isPending} className="arena-gradient text-primary-foreground rounded-xl">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {recursos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">Nenhum recurso adicionado</p>
            ) : (
              <div className="space-y-1">
                {recursos.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground">{r.nome}</span>
                    </div>
                    <button onClick={() => deleteRecurso.mutate(r.id)} className="p-1 rounded hover:bg-muted">
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}
