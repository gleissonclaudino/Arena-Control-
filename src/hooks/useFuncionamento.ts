import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export const DIAS_SEMANA = [
  { value: "segunda", label: "Segunda-feira" },
  { value: "terca", label: "Terça-feira" },
  { value: "quarta", label: "Quarta-feira" },
  { value: "quinta", label: "Quinta-feira" },
  { value: "sexta", label: "Sexta-feira" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
] as const;

// Map JS getDay() (0=Sun) to dia_semana values
const DAY_INDEX_MAP: Record<number, string> = {
  0: "domingo", 1: "segunda", 2: "terca", 3: "quarta",
  4: "quinta", 5: "sexta", 6: "sabado",
};

export function getDiaSemana(date: Date): string {
  return DAY_INDEX_MAP[date.getDay()];
}

export function useFuncionamento() {
  const { arenaId } = useAuth();
  return useQuery({
    queryKey: ["funcionamento", arenaId],
    queryFn: async () => {
      if (!arenaId) return [];
      const { data, error } = await supabase
        .from("arena_funcionamento")
        .select("*")
        .eq("arena_id", arenaId);
      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });
}

export function useUpdateFuncionamento() {
  const { arenaId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ diaSemana, ativo }: { diaSemana: string; ativo: boolean }) => {
      if (!arenaId) throw new Error("Arena não encontrada");
      const { error } = await supabase
        .from("arena_funcionamento")
        .update({ ativo })
        .eq("arena_id", arenaId)
        .eq("dia_semana", diaSemana);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funcionamento"] });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
