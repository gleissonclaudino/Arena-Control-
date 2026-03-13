import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export function useClientes() {
  const { arenaId } = useAuth();
  return useQuery({
    queryKey: ["clientes", arenaId],
    queryFn: async () => {
      if (!arenaId) return [];
      const { data, error } = await supabase.from("clientes").select("*").eq("arena_id", arenaId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });
}

export function useCreateCliente() {
  const { arenaId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { nome: string; telefone: string; email?: string; observacoes?: string }) => {
      if (!arenaId) throw new Error("Arena não encontrada");
      const { data, error } = await supabase.from("clientes").insert({ ...input, arena_id: arenaId }).select().single();
      if (error) {
        if (error.code === "23505") throw new Error("Já existe um cliente com este telefone");
        throw error;
      }
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clientes"] }); toast({ title: "Cliente criado!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useClienteStats() {
  const { arenaId } = useAuth();
  return useQuery({
    queryKey: ["cliente-stats", arenaId],
    queryFn: async () => {
      if (!arenaId) return [];
      const { data, error } = await supabase
        .from("clientes")
        .select("*, reservas(id, valor, data)")
        .eq("arena_id", arenaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((c: any) => ({
        ...c,
        totalReservas: c.reservas?.length || 0,
        totalGasto: c.reservas?.reduce((sum: number, r: any) => sum + Number(r.valor || 0), 0) || 0,
        ultimaReserva: c.reservas?.sort((a: any, b: any) => b.data.localeCompare(a.data))[0]?.data || null,
      }));
    },
    enabled: !!arenaId,
  });
}
