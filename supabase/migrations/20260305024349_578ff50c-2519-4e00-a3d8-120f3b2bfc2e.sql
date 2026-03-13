
-- Table: opcionais (extras like churrasqueira, bola, coletes)
CREATE TABLE public.opcionais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  arena_id UUID NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.opcionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own opcionais" ON public.opcionais
  FOR ALL TO authenticated
  USING (arena_id = get_user_arena_id(auth.uid()))
  WITH CHECK (arena_id = get_user_arena_id(auth.uid()));

CREATE POLICY "Public can view active opcionais" ON public.opcionais
  FOR SELECT TO anon, authenticated
  USING (ativo = true);

-- Table: reserva_opcionais (links extras to reservations)
CREATE TABLE public.reserva_opcionais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reserva_id UUID NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  opcional_id UUID NOT NULL REFERENCES public.opcionais(id) ON DELETE CASCADE,
  preco NUMERIC NOT NULL DEFAULT 0
);

ALTER TABLE public.reserva_opcionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert reserva_opcionais" ON public.reserva_opcionais
  FOR INSERT TO anon, authenticated
  WITH CHECK (reserva_id IN (SELECT id FROM public.reservas));

CREATE POLICY "Public can view reserva_opcionais" ON public.reserva_opcionais
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Users can manage own reserva_opcionais" ON public.reserva_opcionais
  FOR ALL TO authenticated
  USING (reserva_id IN (SELECT id FROM public.reservas WHERE arena_id = get_user_arena_id(auth.uid())))
  WITH CHECK (reserva_id IN (SELECT id FROM public.reservas WHERE arena_id = get_user_arena_id(auth.uid())));
