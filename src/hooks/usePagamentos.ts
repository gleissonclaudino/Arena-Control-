import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export function usePagamentos() {
  const { arenaId } = useAuth();
  return useQuery({
    queryKey: ["pagamentos", arenaId],
    queryFn: async () => {
      if (!arenaId) return [];
      const { data, error } = await supabase
        .from("pagamentos")
        .select("*, reservas(id, data, hora_inicio, hora_fim, valor, status, clientes(nome, telefone), quadras(nome))")
        .eq("arena_id", arenaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });
}

export function useCreatePagamento() {
  const { arenaId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { reserva_id: string; valor: number; metodo: string }) => {
      if (!arenaId) throw new Error("Arena não encontrada");

      // Get reservation total and existing payments
      const { data: reserva } = await supabase.from("reservas").select("valor").eq("id", input.reserva_id).single();
      const { data: existingPayments } = await supabase.from("pagamentos").select("valor").eq("reserva_id", input.reserva_id).eq("status", "pago");

      const totalPaid = (existingPayments || []).reduce((sum, p) => sum + Number(p.valor), 0);
      const remaining = Number(reserva?.valor || 0) - totalPaid;

      if (input.valor > remaining) {
        throw new Error(`Valor excede o restante. Máximo: R$ ${remaining.toFixed(2)}`);
      }

      const { error } = await supabase.from("pagamentos").insert({ ...input, arena_id: arenaId, status: "pago" });
      if (error) throw error;

      // Auto-update reservation status if fully paid
      if (totalPaid + input.valor >= Number(reserva?.valor || 0)) {
        await supabase.from("reservas").update({ status: "confirmada" }).eq("id", input.reserva_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pagamentos"] });
      qc.invalidateQueries({ queryKey: ["reservas"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["financeiro"] });
      toast({ title: "Pagamento registrado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
