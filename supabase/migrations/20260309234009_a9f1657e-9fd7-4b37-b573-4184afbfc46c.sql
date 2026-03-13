
-- Add descricao column to quadras
ALTER TABLE public.quadras ADD COLUMN IF NOT EXISTS descricao text;

-- Create quadra_fotos table
CREATE TABLE public.quadra_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quadra_id uuid NOT NULL REFERENCES public.quadras(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quadra_fotos ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can manage photos of their own quadras
CREATE POLICY "Users can manage own quadra_fotos" ON public.quadra_fotos
FOR ALL TO authenticated
USING (quadra_id IN (SELECT id FROM public.quadras WHERE arena_id = get_user_arena_id(auth.uid())))
WITH CHECK (quadra_id IN (SELECT id FROM public.quadras WHERE arena_id = get_user_arena_id(auth.uid())));

-- RLS: public can view quadra photos
CREATE POLICY "Public can view quadra_fotos" ON public.quadra_fotos
FOR SELECT TO anon, authenticated
USING (true);

-- Create quadra_recursos table
CREATE TABLE public.quadra_recursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quadra_id uuid NOT NULL REFERENCES public.quadras(id) ON DELETE CASCADE,
  nome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quadra_recursos ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can manage resources of their own quadras
CREATE POLICY "Users can manage own quadra_recursos" ON public.quadra_recursos
FOR ALL TO authenticated
USING (quadra_id IN (SELECT id FROM public.quadras WHERE arena_id = get_user_arena_id(auth.uid())))
WITH CHECK (quadra_id IN (SELECT id FROM public.quadras WHERE arena_id = get_user_arena_id(auth.uid())));

-- RLS: public can view quadra resources
CREATE POLICY "Public can view quadra_recursos" ON public.quadra_recursos
FOR SELECT TO anon, authenticated
USING (true);

-- Create storage bucket for quadra photos
INSERT INTO storage.buckets (id, name, public) VALUES ('quadra-fotos', 'quadra-fotos', true);

-- Storage RLS: anyone can view
CREATE POLICY "Public can view quadra photos" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'quadra-fotos');

-- Storage RLS: authenticated can upload
CREATE POLICY "Authenticated can upload quadra photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'quadra-fotos');

-- Storage RLS: authenticated can delete
CREATE POLICY "Authenticated can delete quadra photos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'quadra-fotos');
