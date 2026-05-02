import { LayoutDashboard, CalendarDays, Plus, DollarSign, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/painel" },
  { label: "Agenda", icon: CalendarDays, path: "/agenda" },
  { label: "", icon: Plus, path: "/reservas/nova", isCenter: true },
  { label: "Financeiro", icon: DollarSign, path: "/financeiro" },
  { label: "Config", icon: Settings, path: "/configuracoes" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t flex items-center justify-around h-16 px-2">
      {tabs.map((tab) => {
        const isActive = tab.path === "/painel" 
          ? location.pathname === "/painel" 
          : location.pathname.startsWith(tab.path);

        if (tab.isCenter) {
          return (
            <button
              key="center"
              onClick={() => navigate(tab.path)}
              className="w-14 h-14 -mt-6 rounded-full arena-gradient flex items-center justify-center shadow-lg"
            >
              <Plus className="h-6 w-6 text-primary-foreground" />
            </button>
          );
        }

        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
