import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export function useQuadras() {
  const { arenaId } = useAuth();
  return useQuery({
    queryKey: ["quadras", arenaId],
    queryFn: async () => {
      if (!arenaId) return [];
      const { data, error } = await supabase.from("quadras").select("*").eq("arena_id", arenaId).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });
}

export function useCreateQuadra() {
  const { arenaId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { nome: string; tipo_esporte: string; preco_hora: number; descricao?: string }) => {
      if (!arenaId) throw new Error("Arena não encontrada");
      const { data, error } = await supabase.from("quadras").insert({ ...input, arena_id: arenaId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quadras"] }); toast({ title: "Quadra criada!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateQuadra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; nome?: string; tipo_esporte?: string; preco_hora?: number; descricao?: string; ativa?: boolean }) => {
      const { error } = await supabase.from("quadras").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quadras"] }); toast({ title: "Quadra atualizada!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteQuadra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quadras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quadras"] }); toast({ title: "Quadra removida!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

// --- Quadra Fotos ---
export function useQuadraFotos(quadraId: string | undefined) {
  return useQuery({
    queryKey: ["quadra-fotos", quadraId],
    queryFn: async () => {
      if (!quadraId) return [];
      const { data, error } = await supabase.from("quadra_fotos").select("*").eq("quadra_id", quadraId).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!quadraId,
  });
}

export function useUploadQuadraFoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ quadraId, file }: { quadraId: string; file: File }) => {
      const ext = file.name.split(".").pop();
      const path = `${quadraId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("quadra-fotos").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("quadra-fotos").getPublicUrl(path);
      const { error } = await supabase.from("quadra_fotos").insert({ quadra_id: quadraId, url: urlData.publicUrl });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quadra-fotos"] }); toast({ title: "Foto adicionada!" }); },
    onError: (e: any) => toast({ title: "Erro ao enviar foto", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteQuadraFoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quadra_fotos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quadra-fotos"] }); toast({ title: "Foto removida!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

// --- Quadra Recursos ---
export function useQuadraRecursos(quadraId: string | undefined) {
  return useQuery({
    queryKey: ["quadra-recursos", quadraId],
    queryFn: async () => {
      if (!quadraId) return [];
      const { data, error } = await supabase.from("quadra_recursos").select("*").eq("quadra_id", quadraId).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!quadraId,
  });
}

export function useCreateQuadraRecurso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ quadraId, nome }: { quadraId: string; nome: string }) => {
      const { error } = await supabase.from("quadra_recursos").insert({ quadra_id: quadraId, nome });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quadra-recursos"] }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteQuadraRecurso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quadra_recursos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quadra-recursos"] }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
