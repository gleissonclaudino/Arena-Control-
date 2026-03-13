import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export function useArena() {
  const { arenaId } = useAuth();

  return useQuery({
    queryKey: ["arena", arenaId],
    queryFn: async () => {
      if (!arenaId) return null;
      const { data, error } = await supabase.from("arenas").select("*").eq("id", arenaId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });
}

export function useUpdateArena() {
  const { arenaId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { nome?: string; telefone?: string; endereco?: string; cidade?: string; estado?: string }) => {
      if (!arenaId) throw new Error("Arena não encontrada");
      const { error } = await supabase.from("arenas").update(updates).eq("id", arenaId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["arena"] });
      toast({ title: "Arena atualizada!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
