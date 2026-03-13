import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export function useConfiguracoes() {
  const { arenaId } = useAuth();
  return useQuery({
    queryKey: ["configuracoes", arenaId],
    queryFn: async () => {
      if (!arenaId) return null;
      const { data, error } = await supabase.from("configuracoes_arena").select("*").eq("arena_id", arenaId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });
}

export function useUpdateConfiguracoes() {
  const { arenaId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: {
      horario_abertura?: string; horario_fechamento?: string;
      tempo_minimo_reserva?: number; intervalo_reserva?: number;
      permitir_reserva_online?: boolean; link_publico_ativo?: boolean;
      mensagem_confirmacao?: string;
    }) => {
      if (!arenaId) throw new Error("Arena não encontrada");
      const { error } = await supabase.from("configuracoes_arena").update(updates).eq("arena_id", arenaId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["configuracoes"] }); toast({ title: "Configurações salvas!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
