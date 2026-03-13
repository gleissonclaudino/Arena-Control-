import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export function useDespesas() {
  const { arenaId } = useAuth();
  return useQuery({
    queryKey: ["despesas", arenaId],
    queryFn: async () => {
      if (!arenaId) return [];
      const { data, error } = await supabase
        .from("despesas")
        .select("*")
        .eq("arena_id", arenaId)
        .order("data", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });
}

export function useCreateDespesa() {
  const { arenaId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { descricao: string; categoria: string; valor: number; data: string }) => {
      if (!arenaId) throw new Error("Arena não encontrada");
      const { error } = await supabase.from("despesas").insert({ ...input, arena_id: arenaId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["despesas"] });
      qc.invalidateQueries({ queryKey: ["financeiro"] });
      toast({ title: "Despesa registrada!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
