import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export function useReservas() {
  const { arenaId } = useAuth();
  return useQuery({
    queryKey: ["reservas", arenaId],
    queryFn: async () => {
      if (!arenaId) return [];
      const { data, error } = await supabase
        .from("reservas")
        .select("*, clientes(nome, telefone), quadras(nome)")
        .eq("arena_id", arenaId)
        .order("data", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });
}

export function useCreateReserva() {
  const { arenaId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      quadra_id: string; cliente_id: string; data: string;
      hora_inicio: string; hora_fim: string; valor: number;
      status?: string; observacoes?: string; metodo_pagamento?: string;
    }) => {
      if (!arenaId) throw new Error("Arena não encontrada");

      // Check time conflict
      const { data: conflicts } = await supabase
        .from("reservas")
        .select("id")
        .eq("quadra_id", input.quadra_id)
        .eq("data", input.data)
        .neq("status", "cancelada")
        .lt("hora_inicio", input.hora_fim)
        .gt("hora_fim", input.hora_inicio);

      if (conflicts && conflicts.length > 0) {
        throw new Error("Conflito de horário! Já existe uma reserva neste período.");
      }

      // Check blocks
      const { data: blocks } = await supabase
        .from("bloqueios_agenda")
        .select("id")
        .eq("quadra_id", input.quadra_id)
        .eq("data", input.data)
        .lt("hora_inicio", input.hora_fim)
        .gt("hora_fim", input.hora_inicio);

      if (blocks && blocks.length > 0) {
        throw new Error("Este horário está bloqueado na agenda.");
      }

      const { data, error } = await supabase
        .from("reservas")
        .insert({ ...input, arena_id: arenaId, origem: "dashboard" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservas"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["agenda"] });
      toast({ title: "Reserva criada com sucesso!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateReserva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; valor?: number; observacoes?: string }) => {
      const { error } = await supabase.from("reservas").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservas"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["agenda"] });
      toast({ title: "Reserva atualizada!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
