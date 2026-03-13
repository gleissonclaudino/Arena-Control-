import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Mode = "login" | "signup" | "forgot";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Login realizado com sucesso!" });
      } else if (mode === "signup") {
        if (!name.trim()) {
          toast({ title: "Nome é obrigatório", variant: "destructive" });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar." });
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
            {mode === "login" ? "Entrar" : mode === "signup" ? "Criar Conta" : "Recuperar Senha"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Seu Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: João Silva"
                  className="w-full px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
            )}
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
            {mode !== "forgot" && (
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
              {mode === "login" ? "Entrar" : mode === "signup" ? "Criar Conta" : "Enviar Email"}
            </Button>
          </form>

          <div className="space-y-2 text-center text-sm">
            {mode === "login" && (
              <>
                <button onClick={() => setMode("forgot")} className="text-primary hover:underline block w-full">
                  Esqueceu a senha?
                </button>
                <p className="text-muted-foreground">
                  Não tem conta?{" "}
                  <button onClick={() => setMode("signup")} className="text-primary hover:underline font-medium">
                    Criar conta
                  </button>
                </p>
              </>
            )}
            {mode === "signup" && (
              <p className="text-muted-foreground">
                Já tem conta?{" "}
                <button onClick={() => setMode("login")} className="text-primary hover:underline font-medium">
                  Entrar
                </button>
              </p>
            )}
            {mode === "forgot" && (
              <button onClick={() => setMode("login")} className="text-primary hover:underline">
                ← Voltar ao login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
