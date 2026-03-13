
-- Create bloqueios_agenda table
CREATE TABLE public.bloqueios_agenda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  arena_id UUID NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
  quadra_id UUID NOT NULL REFERENCES public.quadras(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  hora_inicio TIME WITHOUT TIME ZONE NOT NULL,
  hora_fim TIME WITHOUT TIME ZONE NOT NULL,
  motivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bloqueios_agenda ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage their own blocks
CREATE POLICY "Users can manage own bloqueios"
  ON public.bloqueios_agenda
  FOR ALL
  TO authenticated
  USING (arena_id = get_user_arena_id(auth.uid()))
  WITH CHECK (arena_id = get_user_arena_id(auth.uid()));

-- Public can view blocks (needed to filter available hours)
CREATE POLICY "Public can view bloqueios"
  ON public.bloqueios_agenda
  FOR SELECT
  TO anon
  USING (true);
