import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export function useAvaliacoes() {
  const { arenaId } = useAuth();
  return useQuery({
    queryKey: ["avaliacoes", arenaId],
    queryFn: async () => {
      if (!arenaId) return [];
      const { data, error } = await supabase
        .from("avaliacoes")
        .select("*, quadras(nome)")
        .eq("arena_id", arenaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });
}

export function useDeleteAvaliacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("avaliacoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["avaliacoes"] });
      toast({ title: "Avaliação removida!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
