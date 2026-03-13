import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { Bell, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AC";

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-16 flex items-center justify-between border-b bg-card px-4 lg:px-6 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="lg:hidden" />
              <div className="hidden lg:flex items-center gap-3">
                <div className="w-10 h-10 rounded-full arena-gradient flex items-center justify-center">
                  <span className="text-primary-foreground text-lg">⚽</span>
                </div>
                <div>
                  <h1 className="text-sm font-bold text-foreground leading-tight">Arena Control</h1>
                  <p className="text-xs text-muted-foreground">Gestão de Quadras</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                size="sm"
                className="arena-gradient text-primary-foreground gap-1.5 rounded-full px-4"
                onClick={() => navigate("/reservas/nova")}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova Reserva</span>
              </Button>

              <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-arena-red rounded-full border-2 border-card" />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-9 h-9 rounded-full bg-arena-orange flex items-center justify-center text-primary-foreground text-sm font-semibold">
                    {initials}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/conta")}>Minha Conta</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/configuracoes")}>Configurações</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
    </SidebarProvider>
  );
}
