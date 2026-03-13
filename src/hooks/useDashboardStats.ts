import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

export function useDashboardStats() {
  const { arenaId } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["dashboard", arenaId],
    queryFn: async () => {
      if (!arenaId) return null;

      const [reservasMonth, pagamentosMonth, reservasToday, reservasWeek, upcoming] = await Promise.all([
        supabase.from("reservas").select("id, valor, status").eq("arena_id", arenaId).gte("data", monthStart).lte("data", monthEnd),
        supabase.from("pagamentos").select("valor, status").eq("arena_id", arenaId).eq("status", "pago").gte("created_at", monthStart),
        supabase.from("reservas").select("id, valor, status").eq("arena_id", arenaId).eq("data", today),
        supabase.from("reservas").select("id").eq("arena_id", arenaId).gte("data", weekStart).lte("data", weekEnd),
        supabase.from("reservas").select("*, clientes(nome), quadras(nome)").eq("arena_id", arenaId).gte("data", today).neq("status", "cancelada").order("data").order("hora_inicio").limit(10),
      ]);

      const receitaMensal = (pagamentosMonth.data || []).reduce((s, p) => s + Number(p.valor), 0);
      const totalReservasMes = (reservasMonth.data || []).length;
      const pendentes = (reservasMonth.data || []).filter(r => r.status === "pendente");
      const pendentesValor = pendentes.reduce((s, r) => s + Number(r.valor), 0);

      return {
        receitaMensal,
        totalReservasMes,
        reservasHoje: (reservasToday.data || []).length,
        reservasSemana: (reservasWeek.data || []).length,
        pendentesCount: pendentes.length,
        pendentesValor,
        upcoming: upcoming.data || [],
      };
    },
    enabled: !!arenaId,
  });
}
