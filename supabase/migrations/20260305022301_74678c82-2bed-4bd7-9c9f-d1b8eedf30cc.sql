
-- Create arenas table
CREATE TABLE public.arenas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  arena_id UUID REFERENCES public.arenas(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quadras table
CREATE TABLE public.quadras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  arena_id UUID REFERENCES public.arenas(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  tipo_esporte TEXT NOT NULL DEFAULT 'Futebol Society',
  preco_hora NUMERIC(10,2) NOT NULL DEFAULT 0,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clientes table
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  arena_id UUID REFERENCES public.arenas(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(arena_id, telefone)
);

-- Create reservas table
CREATE TABLE public.reservas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  arena_id UUID REFERENCES public.arenas(id) ON DELETE CASCADE NOT NULL,
  quadra_id UUID REFERENCES public.quadras(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmada', 'cancelada')),
  origem TEXT NOT NULL DEFAULT 'dashboard' CHECK (origem IN ('dashboard', 'link_publico')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quadra_id, data, hora_inicio)
);

-- Create pagamentos table
CREATE TABLE public.pagamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  arena_id UUID REFERENCES public.arenas(id) ON DELETE CASCADE NOT NULL,
  reserva_id UUID REFERENCES public.reservas(id) ON DELETE CASCADE NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  metodo TEXT NOT NULL CHECK (metodo IN ('pix', 'cartao', 'dinheiro', 'transferencia')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create configuracoes_arena table
CREATE TABLE public.configuracoes_arena (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  arena_id UUID REFERENCES public.arenas(id) ON DELETE CASCADE NOT NULL UNIQUE,
  horario_abertura TIME NOT NULL DEFAULT '08:00',
  horario_fechamento TIME NOT NULL DEFAULT '23:00',
  tempo_minimo_reserva INTEGER NOT NULL DEFAULT 60,
  intervalo_reserva INTEGER NOT NULL DEFAULT 0,
  permitir_reserva_online BOOLEAN NOT NULL DEFAULT true,
  link_publico_ativo BOOLEAN NOT NULL DEFAULT true,
  mensagem_confirmacao TEXT DEFAULT 'Reserva confirmada com sucesso!'
);

-- Security definer function to get arena_id for a user (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_arena_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT arena_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- Enable RLS on all tables
ALTER TABLE public.arenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quadras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_arena ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- RLS policies for arenas (users can only see their own arena)
CREATE POLICY "Users can view own arena" ON public.arenas FOR SELECT TO authenticated USING (id = public.get_user_arena_id(auth.uid()));
CREATE POLICY "Users can update own arena" ON public.arenas FOR UPDATE TO authenticated USING (id = public.get_user_arena_id(auth.uid()));
-- Allow anonymous users to view arenas by slug (for public booking)
CREATE POLICY "Public can view arenas by slug" ON public.arenas FOR SELECT TO anon USING (true);

-- RLS policies for quadras
CREATE POLICY "Users can manage own quadras" ON public.quadras FOR ALL TO authenticated USING (arena_id = public.get_user_arena_id(auth.uid())) WITH CHECK (arena_id = public.get_user_arena_id(auth.uid()));
CREATE POLICY "Public can view active quadras" ON public.quadras FOR SELECT TO anon USING (ativa = true);

-- RLS policies for clientes
CREATE POLICY "Users can manage own clientes" ON public.clientes FOR ALL TO authenticated USING (arena_id = public.get_user_arena_id(auth.uid())) WITH CHECK (arena_id = public.get_user_arena_id(auth.uid()));
-- Allow anon to insert clients (for public booking)
CREATE POLICY "Public can insert clientes" ON public.clientes FOR INSERT TO anon WITH CHECK (true);

-- RLS policies for reservas
CREATE POLICY "Users can manage own reservas" ON public.reservas FOR ALL TO authenticated USING (arena_id = public.get_user_arena_id(auth.uid())) WITH CHECK (arena_id = public.get_user_arena_id(auth.uid()));
-- Allow anon to insert reservas (for public booking)
CREATE POLICY "Public can insert reservas" ON public.reservas FOR INSERT TO anon WITH CHECK (true);
-- Allow anon to view reservas for availability check
CREATE POLICY "Public can view reservas" ON public.reservas FOR SELECT TO anon USING (true);

-- RLS policies for pagamentos
CREATE POLICY "Users can manage own pagamentos" ON public.pagamentos FOR ALL TO authenticated USING (arena_id = public.get_user_arena_id(auth.uid())) WITH CHECK (arena_id = public.get_user_arena_id(auth.uid()));

-- RLS policies for configuracoes_arena
CREATE POLICY "Users can manage own config" ON public.configuracoes_arena FOR ALL TO authenticated USING (arena_id = public.get_user_arena_id(auth.uid())) WITH CHECK (arena_id = public.get_user_arena_id(auth.uid()));
CREATE POLICY "Public can view config" ON public.configuracoes_arena FOR SELECT TO anon USING (true);

-- Function + trigger to auto-create arena + profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_arena_id UUID;
  user_name TEXT;
  arena_slug TEXT;
BEGIN
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  arena_slug := lower(replace(replace(user_name, ' ', '-'), '.', '-')) || '-' || substr(gen_random_uuid()::text, 1, 8);
  
  INSERT INTO public.arenas (nome, slug, email)
  VALUES ('Arena de ' || user_name, arena_slug, NEW.email)
  RETURNING id INTO new_arena_id;
  
  INSERT INTO public.profiles (user_id, arena_id, name)
  VALUES (NEW.id, new_arena_id, user_name);
  
  INSERT INTO public.configuracoes_arena (arena_id)
  VALUES (new_arena_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
