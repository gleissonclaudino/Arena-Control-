import { Layout } from "@/components/Layout";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, LogOut, User, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export default function MinhaConta() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [name, setName] = useState(profile?.name || "");
  const [savingName, setSavingName] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveName = async () => {
    if (!name.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    setSavingName(true);
    try {
      const { error } = await supabase.from("profiles").update({ name: name.trim() }).eq("user_id", user?.id || "");
      if (error) throw error;
      toast({ title: "Nome atualizado!" });
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast({ title: "Senha deve ter pelo menos 6 caracteres", variant: "destructive" }); return; }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Senha atualizada com sucesso!" });
      setCurrentPassword("");
      setNewPassword("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Minha Conta</h1>
          <p className="text-sm text-muted-foreground">Gerencie seu perfil</p>
        </div>

        {/* Profile */}
        <Section title="PERFIL">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--arena-orange))] flex items-center justify-center text-primary-foreground text-xl font-bold">
              {profile?.name ? profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "AC"}
            </div>
            <div>
              <p className="font-semibold text-foreground">{profile?.name || "Usuário"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Nome</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="email" value={user?.email || ""} readOnly
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-muted text-sm text-muted-foreground focus:outline-none" />
            </div>
          </div>

          <Button onClick={handleSaveName} disabled={savingName} className="w-full arena-gradient text-primary-foreground rounded-xl">
            {savingName ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Salvar Nome
          </Button>
        </Section>

        {/* Change Password */}
        <Section title="ALTERAR SENHA">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Nova Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <Button onClick={handleChangePassword} disabled={savingPassword} variant="outline" className="w-full rounded-xl">
            {savingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Atualizar Senha
          </Button>
        </Section>

        {/* Logout */}
        <Button onClick={handleLogout} variant="destructive" className="w-full rounded-xl py-5 gap-2">
          <LogOut className="h-4 w-4" /> Sair da Conta
        </Button>
      </div>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-primary tracking-wider mb-3">{title}</h3>
      <div className="bg-card rounded-xl border p-4 space-y-4">{children}</div>
    </div>
  );
}
