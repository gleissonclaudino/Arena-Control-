import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export function useOpcionais() {
  const { arenaId } = useAuth();
  return useQuery({
    queryKey: ["opcionais", arenaId],
    queryFn: async () => {
      if (!arenaId) return [];
      const { data, error } = await supabase
        .from("opcionais")
        .select("*")
        .eq("arena_id", arenaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });
}

export function useCreateOpcional() {
  const { arenaId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { nome: string; descricao?: string; preco: number }) => {
      if (!arenaId) throw new Error("Arena não encontrada");
      const { data, error } = await supabase
        .from("opcionais")
        .insert({ ...input, arena_id: arenaId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opcionais"] });
      toast({ title: "Opcional criado com sucesso!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateOpcional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; nome?: string; descricao?: string; preco?: number; ativo?: boolean }) => {
      const { error } = await supabase.from("opcionais").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opcionais"] });
      toast({ title: "Opcional atualizado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteOpcional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("opcionais").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opcionais"] });
      toast({ title: "Opcional removido!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
