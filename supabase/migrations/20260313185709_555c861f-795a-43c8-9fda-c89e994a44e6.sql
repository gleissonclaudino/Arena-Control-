
-- Add metodo_pagamento to reservas
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS metodo_pagamento text DEFAULT NULL;

-- Create despesas table
CREATE TABLE IF NOT EXISTS public.despesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id uuid NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  categoria text NOT NULL DEFAULT 'Outros',
  valor numeric NOT NULL DEFAULT 0,
  data date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own despesas" ON public.despesas
  FOR ALL TO authenticated
  USING (arena_id = get_user_arena_id(auth.uid()))
  WITH CHECK (arena_id = get_user_arena_id(auth.uid()));
