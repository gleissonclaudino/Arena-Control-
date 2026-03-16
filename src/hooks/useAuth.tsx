import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  user_id: string;
  arena_id: string;
  name: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  arenaId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  arenaId: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, userEmail?: string, userName?: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    
    if (data) {
      setProfile(data);
      return;
    }

    // Profile missing — auto-create arena + profile
    const name = userName || userEmail?.split("@")[0] || "Usuário";
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.random().toString(36).slice(2, 10);

    const { data: arena } = await supabase
      .from("arenas")
      .insert({ nome: `Arena de ${name}`, slug, email: userEmail })
      .select("id")
      .single();

    if (!arena) return;

    await supabase.from("configuracoes_arena").insert({ arena_id: arena.id });

    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({ user_id: userId, arena_id: arena.id, name })
      .select("*")
      .single();

    setProfile(newProfile);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          const meta = session.user.user_metadata;
          setTimeout(() => fetchProfile(session.user.id, session.user.email, meta?.name || meta?.full_name), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const meta = session.user.user_metadata;
        fetchProfile(session.user.id, session.user.email, meta?.name || meta?.full_name);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        arenaId: profile?.arena_id ?? null,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
