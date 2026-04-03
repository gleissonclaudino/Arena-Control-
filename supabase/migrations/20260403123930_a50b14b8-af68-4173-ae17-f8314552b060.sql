
-- Create usuarios (subscription) table
CREATE TABLE public.usuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT,
  plano TEXT NOT NULL DEFAULT 'mensal',
  status TEXT NOT NULL DEFAULT 'ativo',
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_expiracao TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint on user_id
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_user_id_key UNIQUE (user_id);

-- Enable RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
ON public.usuarios FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can update their own subscription
CREATE POLICY "Users can update own subscription"
ON public.usuarios FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Allow inserts for authenticated users (own record)
CREATE POLICY "Users can insert own subscription"
ON public.usuarios FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Update handle_new_user to also create subscription record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  INSERT INTO public.usuarios (user_id, email, plano, status, data_inicio, data_expiracao)
  VALUES (NEW.id, NEW.email, 'mensal', 'ativo', now(), now() + interval '30 days');
  
  RETURN NEW;
END;
$function$;
