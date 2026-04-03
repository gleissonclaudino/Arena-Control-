import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle } from "lucide-react";

type Mode = "login" | "forgot";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Login realizado com sucesso!" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada." });
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const whatsappUrl =
    "https://wa.me/5511983671859?text=Ol%C3%A1%2C%20quero%20ativar%20meu%20acesso%20ao%20Arena%20Control.%20Pode%20me%20explicar%20como%20funciona%3F";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full arena-gradient flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground text-3xl">⚽</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Arena Control</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão Inteligente de Quadras</p>
        </div>

        <div className="bg-card rounded-xl border p-6 space-y-6">
          <h2 className="text-lg font-bold text-foreground text-center">
            {mode === "login" ? "Entrar" : "Recuperar Senha"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            {mode === "login" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                  minLength={6}
                />
              </div>
            )}
            <Button
              type="submit"
              className="w-full arena-gradient text-primary-foreground rounded-xl py-6 text-base font-semibold"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === "login" ? "Entrar" : "Enviar Email"}
            </Button>
          </form>

          <div className="text-center text-sm">
            {mode === "login" ? (
              <button onClick={() => setMode("forgot")} className="text-primary hover:underline">
                Esqueceu a senha?
              </button>
            ) : (
              <button onClick={() => setMode("login")} className="text-primary hover:underline">
                ← Voltar ao login
              </button>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Para obter acesso ao sistema, é necessário ter uma assinatura ativa.
          </p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
            <Button className="w-full rounded-xl py-6 text-base font-semibold bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white">
              <MessageCircle className="h-5 w-5 mr-2" />
              Quero acesso
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}