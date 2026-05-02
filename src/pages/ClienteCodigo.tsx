import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";

export default function ClienteCodigo() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("arenas")
        .select("slug")
        .eq("codigo", codigo.trim().toUpperCase())
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        toast({ title: "❌ Código inválido", description: "Verifique com a arena.", variant: "destructive" });
        return;
      }
      navigate(`/arena/${data.slug}/reservar`);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full arena-gradient flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground text-3xl">⚽</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Código da Arena</h1>
          <p className="text-sm text-muted-foreground mt-1">Digite o código fornecido pela arena</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl border p-6 space-y-4">
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="EX: A1B2C3"
            maxLength={10}
            className="w-full px-4 py-3 rounded-xl border bg-card text-2xl font-bold tracking-widest text-center text-foreground focus:outline-none focus:ring-2 focus:ring-ring uppercase"
            required
            autoFocus
          />
          <Button type="submit" disabled={loading} className="w-full arena-gradient text-primary-foreground rounded-xl py-6 text-base font-semibold">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Continuar
          </Button>
        </form>

        <button
          onClick={async () => { await signOut(); navigate("/"); }}
          className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </div>
  );
}
