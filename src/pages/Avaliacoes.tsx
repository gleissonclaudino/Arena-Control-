import { Layout } from "@/components/Layout";
import { Star, Loader2, Trash2, MessageSquare } from "lucide-react";
import { useAvaliacoes, useDeleteAvaliacao } from "@/hooks/useAvaliacoes";
import { useQuadras } from "@/hooks/useQuadras";
import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function Stars({ nota, size = 16 }: { nota: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={i <= nota ? "fill-[hsl(var(--arena-yellow))] text-[hsl(var(--arena-yellow))]" : "text-muted-foreground/30"}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
}

export default function Avaliacoes() {
  const { data: avaliacoes = [], isLoading } = useAvaliacoes();
  const { data: quadras = [] } = useQuadras();
  const deleteAvaliacao = useDeleteAvaliacao();

  const mediaGeral = useMemo(() => {
    if (avaliacoes.length === 0) return 0;
    return avaliacoes.reduce((s: number, a: any) => s + a.nota, 0) / avaliacoes.length;
  }, [avaliacoes]);

  const mediaPorQuadra = useMemo(() => {
    return quadras.map((q) => {
      const qAvals = avaliacoes.filter((a: any) => a.quadra_id === q.id);
      const media = qAvals.length > 0 ? qAvals.reduce((s: number, a: any) => s + a.nota, 0) / qAvals.length : 0;
      return { nome: q.nome, media, total: qAvals.length };
    }).filter((q) => q.total > 0);
  }, [quadras, avaliacoes]);

  if (isLoading) {
    return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Avaliações</h1>
          <p className="text-sm text-muted-foreground">Feedback dos clientes</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="arena-gradient rounded-xl p-4 text-primary-foreground">
            <Star className="h-5 w-5 mb-2 opacity-80" />
            <p className="text-xs opacity-80">Nota Média</p>
            <p className="text-3xl font-bold">{mediaGeral.toFixed(1)}</p>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <MessageSquare className="h-5 w-5 mb-2 text-primary" />
            <p className="text-xs text-muted-foreground">Total Avaliações</p>
            <p className="text-3xl font-bold text-foreground">{avaliacoes.length}</p>
          </div>
        </div>

        {/* Media por quadra */}
        {mediaPorQuadra.length > 0 && (
          <div className="bg-card rounded-xl border">
            <div className="p-5 pb-3"><h2 className="font-semibold text-foreground">Média por Quadra</h2></div>
            <div className="divide-y">
              {mediaPorQuadra.map((q) => (
                <div key={q.nome} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">{q.nome}</p>
                    <p className="text-xs text-muted-foreground">{q.total} avaliações</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stars nota={Math.round(q.media)} size={14} />
                    <span className="text-sm font-bold text-foreground">{q.media.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="bg-card rounded-xl border">
          <div className="p-5 pb-3"><h2 className="font-semibold text-foreground">Avaliações Recentes</h2></div>
          {avaliacoes.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">Nenhuma avaliação ainda.</p>
          ) : (
            <div className="divide-y">
              {avaliacoes.map((a: any) => (
                <div key={a.id} className="px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground text-sm">{a.cliente_nome}</p>
                        <Stars nota={a.nota} size={12} />
                      </div>
                      {a.quadras?.nome && <p className="text-xs text-muted-foreground">{a.quadras.nome}</p>}
                      {a.comentario && <p className="text-sm text-muted-foreground mt-1">{a.comentario}</p>}
                      <p className="text-[10px] text-muted-foreground">{format(new Date(a.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                    </div>
                    <button onClick={() => deleteAvaliacao.mutate(a.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
