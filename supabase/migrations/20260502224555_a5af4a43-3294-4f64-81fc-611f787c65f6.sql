
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'arenas_codigo_key') THEN
    ALTER TABLE public.arenas ADD CONSTRAINT arenas_codigo_key UNIQUE (codigo);
  END IF;
END $$;

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('client','owner');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'client';
ALTER TABLE public.profiles ALTER COLUMN arena_id DROP NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, name)
  VALUES (NEW.id, 'client', NEW.raw_user_meta_data->>'name')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "Public can read arenas" ON public.arenas;
CREATE POLICY "Public can read arenas" ON public.arenas FOR SELECT USING (true);
