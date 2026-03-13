
-- Tighten anon insert policies to require valid arena_id
DROP POLICY "Public can insert clientes" ON public.clientes;
CREATE POLICY "Public can insert clientes" ON public.clientes FOR INSERT TO anon 
WITH CHECK (arena_id IN (SELECT id FROM public.arenas WHERE slug IS NOT NULL));

DROP POLICY "Public can insert reservas" ON public.reservas;
CREATE POLICY "Public can insert reservas" ON public.reservas FOR INSERT TO anon 
WITH CHECK (arena_id IN (SELECT id FROM public.arenas WHERE slug IS NOT NULL));
