
-- Fix RLS: Change restrictive anon policies to permissive

-- Drop existing restrictive policies for anon on clientes
DROP POLICY IF EXISTS "Public can insert clientes" ON public.clientes;

-- Create permissive policy for anon insert on clientes
CREATE POLICY "Public can insert clientes"
ON public.clientes
FOR INSERT
TO anon
WITH CHECK (arena_id IN (SELECT id FROM arenas WHERE slug IS NOT NULL));

-- Add permissive SELECT for anon on clientes (needed to check existing client by phone)
CREATE POLICY "Public can select clientes"
ON public.clientes
FOR SELECT
TO anon
USING (true);

-- Drop existing restrictive policies for anon on reservas
DROP POLICY IF EXISTS "Public can insert reservas" ON public.reservas;
DROP POLICY IF EXISTS "Public can view reservas" ON public.reservas;

-- Create permissive policies for anon on reservas
CREATE POLICY "Public can insert reservas"
ON public.reservas
FOR INSERT
TO anon
WITH CHECK (arena_id IN (SELECT id FROM arenas WHERE slug IS NOT NULL));

CREATE POLICY "Public can view reservas"
ON public.reservas
FOR SELECT
TO anon
USING (true);

-- Fix reserva_opcionais anon policies
DROP POLICY IF EXISTS "Public can insert reserva_opcionais" ON public.reserva_opcionais;
DROP POLICY IF EXISTS "Public can view reserva_opcionais" ON public.reserva_opcionais;

CREATE POLICY "Public can insert reserva_opcionais"
ON public.reserva_opcionais
FOR INSERT
TO anon
WITH CHECK (reserva_id IN (SELECT id FROM reservas));

CREATE POLICY "Public can view reserva_opcionais"
ON public.reserva_opcionais
FOR SELECT
TO anon
USING (true);

-- Create arena_funcionamento table
CREATE TABLE public.arena_funcionamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
  dia_semana TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(arena_id, dia_semana)
);

ALTER TABLE public.arena_funcionamento ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage their own
CREATE POLICY "Users can manage own funcionamento"
ON public.arena_funcionamento
FOR ALL
TO authenticated
USING (arena_id = get_user_arena_id(auth.uid()))
WITH CHECK (arena_id = get_user_arena_id(auth.uid()));

-- Public can view
CREATE POLICY "Public can view funcionamento"
ON public.arena_funcionamento
FOR SELECT
TO anon
USING (true);

-- Seed default days for existing arenas
INSERT INTO public.arena_funcionamento (arena_id, dia_semana, ativo)
SELECT a.id, d.dia, true
FROM public.arenas a
CROSS JOIN (VALUES ('segunda'),('terca'),('quarta'),('quinta'),('sexta'),('sabado'),('domingo')) AS d(dia)
ON CONFLICT (arena_id, dia_semana) DO NOTHING;

-- Create trigger to auto-seed days for new arenas
CREATE OR REPLACE FUNCTION public.seed_arena_funcionamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.arena_funcionamento (arena_id, dia_semana, ativo)
  VALUES
    (NEW.id, 'segunda', true),
    (NEW.id, 'terca', true),
    (NEW.id, 'quarta', true),
    (NEW.id, 'quinta', true),
    (NEW.id, 'sexta', true),
    (NEW.id, 'sabado', true),
    (NEW.id, 'domingo', true);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_arena_created_seed_funcionamento
AFTER INSERT ON public.arenas
FOR EACH ROW
EXECUTE FUNCTION public.seed_arena_funcionamento();
