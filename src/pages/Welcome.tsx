import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Briefcase } from "lucide-react";

export default function Welcome() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full arena-gradient flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground text-3xl">⚽</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Arena Control</h1>
          <p className="text-sm text-muted-foreground mt-1">Como você quer entrar?</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/cliente/login")}
            className="w-full bg-card border rounded-2xl p-6 text-left hover:border-primary transition-colors flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full arena-gradient flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-foreground">Sou Cliente</p>
              <p className="text-xs text-muted-foreground">Quero reservar uma quadra</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/auth")}
            className="w-full bg-card border rounded-2xl p-6 text-left hover:border-primary transition-colors flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-arena-orange flex items-center justify-center shrink-0">
              <Briefcase className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-foreground">Sou Dono</p>
              <p className="text-xs text-muted-foreground">Acessar painel administrativo</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
