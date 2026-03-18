
CREATE TABLE public.avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
  quadra_id uuid REFERENCES public.quadras(id) ON DELETE SET NULL,
  reserva_id uuid REFERENCES public.reservas(id) ON DELETE SET NULL,
  cliente_nome text NOT NULL,
  nota integer NOT NULL,
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert avaliacoes"
ON public.avaliacoes FOR INSERT TO anon
WITH CHECK (arena_id IN (SELECT id FROM arenas WHERE slug IS NOT NULL));

CREATE POLICY "Public can view avaliacoes"
ON public.avaliacoes FOR SELECT TO anon
USING (true);

CREATE POLICY "Users can manage own avaliacoes"
ON public.avaliacoes FOR ALL TO authenticated
USING (arena_id = get_user_arena_id(auth.uid()))
WITH CHECK (arena_id = get_user_arena_id(auth.uid()));
