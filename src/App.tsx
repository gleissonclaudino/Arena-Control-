import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Agenda from "./pages/Agenda";
import Reservas from "./pages/Reservas";
import NovaReserva from "./pages/NovaReserva";
import ReservaDetalhes from "./pages/ReservaDetalhes";
import BloqueioAgenda from "./pages/BloqueioAgenda";
import Financeiro from "./pages/Financeiro";
import Clientes from "./pages/Clientes";
import Pagamentos from "./pages/Pagamentos";
import Relatorios from "./pages/Relatorios";
import Avaliacoes from "./pages/Avaliacoes";
import Configuracoes from "./pages/Configuracoes";
import Opcionais from "./pages/Opcionais";
import Quadras from "./pages/Quadras";
import MinhaConta from "./pages/MinhaConta";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import PublicBooking from "./pages/PublicBooking";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/arena/:slug/reservar" element={<PublicBooking />} />
            <Route path="/reservar/:slug" element={<PublicBooking />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
            <Route path="/reservas" element={<ProtectedRoute><Reservas /></ProtectedRoute>} />
            <Route path="/reservas/nova" element={<ProtectedRoute><NovaReserva /></ProtectedRoute>} />
            <Route path="/reservas/:id" element={<ProtectedRoute><ReservaDetalhes /></ProtectedRoute>} />
            <Route path="/agenda/bloquear" element={<ProtectedRoute><BloqueioAgenda /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
            <Route path="/quadras" element={<ProtectedRoute><Quadras /></ProtectedRoute>} />
            <Route path="/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
            <Route path="/pagamentos" element={<ProtectedRoute><Pagamentos /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
            <Route path="/avaliacoes" element={<ProtectedRoute><Avaliacoes /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
            <Route path="/opcionais" element={<ProtectedRoute><Opcionais /></ProtectedRoute>} />
            <Route path="/conta" element={<ProtectedRoute><MinhaConta /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
