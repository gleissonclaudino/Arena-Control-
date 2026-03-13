import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export function useBloqueios() {
  const { arenaId } = useAuth();
  return useQuery({
    queryKey: ["bloqueios", arenaId],
    queryFn: async () => {
      if (!arenaId) return [];
      const { data, error } = await supabase
        .from("bloqueios_agenda")
        .select("*, quadras(nome)")
        .eq("arena_id", arenaId)
        .order("data", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });
}

export function useCreateBloqueio() {
  const { arenaId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      quadra_id: string;
      data: string;
      hora_inicio: string;
      hora_fim: string;
      motivo?: string;
    }) => {
      if (!arenaId) throw new Error("Arena não encontrada");
      const { error } = await supabase
        .from("bloqueios_agenda")
        .insert({ ...input, arena_id: arenaId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bloqueios"] });
      qc.invalidateQueries({ queryKey: ["agenda"] });
      toast({ title: "Horário bloqueado!" });
    },
    onError: (e: any) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteBloqueio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bloqueios_agenda").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bloqueios"] });
      qc.invalidateQueries({ queryKey: ["agenda"] });
      toast({ title: "Bloqueio removido!" });
    },
    onError: (e: any) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
