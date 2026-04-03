import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Subscription {
  id: string;
  user_id: string;
  email: string | null;
  plano: string;
  status: string;
  data_inicio: string;
  data_expiracao: string;
  created_at: string;
}

export function useSubscription() {
  const { user } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as Subscription | null;
    },
    enabled: !!user?.id,
  });

  const isActive = (() => {
    if (!subscription) return false;
    if (subscription.status !== "ativo") return false;
    return new Date(subscription.data_expiracao) > new Date();
  })();

  return { subscription, isLoading, isActive };
}
