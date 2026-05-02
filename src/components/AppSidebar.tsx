import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Users,
  CreditCard,
  DollarSign,
  BarChart3,
  Settings,
  UserCircle,
  Package,
  MapPin,
  Star,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/painel", icon: LayoutDashboard },
  { title: "Agenda", url: "/agenda", icon: CalendarDays },
  { title: "Reservas", url: "/reservas", icon: BookOpen },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Quadras", url: "/quadras", icon: MapPin },
  { title: "Opcionais", url: "/opcionais", icon: Package },
  { title: "Pagamentos", url: "/pagamentos", icon: CreditCard },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Avaliações", url: "/avaliacoes", icon: Star },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Minha Conta", url: "/conta", icon: UserCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="hidden lg:flex border-r">
      <SidebarContent className="pt-4">
        {!collapsed && (
          <div className="px-4 pb-4 mb-2 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full arena-gradient flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground text-lg">⚽</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground leading-tight">Arena Control</h2>
                <p className="text-xs text-muted-foreground">Gestão Inteligente</p>
              </div>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const active = location.pathname === item.url ||
                  (item.url !== "/painel" && location.pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={item.url} end={item.url === "/painel"}
                        className={`hover:bg-accent transition-colors ${active ? "bg-accent text-accent-foreground font-medium" : "text-sidebar-foreground"}`}
                        activeClassName="bg-accent text-accent-foreground font-medium">
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
