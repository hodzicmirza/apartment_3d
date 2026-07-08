
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can view their roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- First-admin claim: any signed-in user can become admin if no admin exists yet.
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role='admin') THEN
    RETURN public.has_role(uid,'admin');
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (uid,'admin') ON CONFLICT DO NOTHING;
  RETURN TRUE;
END; $$;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

-- Apartments
CREATE TYPE public.apt_status AS ENUM ('available','reserved','sold');
CREATE TYPE public.apt_side AS ENUM ('front','back');

CREATE TABLE public.apartments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  floor INT NOT NULL,
  unit_on_floor INT NOT NULL,
  side public.apt_side NOT NULL,
  rooms INT NOT NULL DEFAULT 2,
  bathrooms INT NOT NULL DEFAULT 1,
  area NUMERIC NOT NULL DEFAULT 60,
  price NUMERIC NOT NULL DEFAULT 100000,
  status public.apt_status NOT NULL DEFAULT 'available',
  orientation TEXT,
  features TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (floor, unit_on_floor, side)
);

GRANT SELECT ON public.apartments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.apartments TO authenticated;
GRANT ALL ON public.apartments TO service_role;

ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can view apartments" ON public.apartments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins can insert" ON public.apartments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins can update" ON public.apartments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins can delete" ON public.apartments FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER apartments_touch BEFORE UPDATE ON public.apartments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed 48 apartments (6 floors × 4 front + 4 back)
DO $$
DECLARE
  f INT; u INT; s TEXT; n INT := 1; rooms INT; rnd INT; status public.apt_status; orient TEXT;
BEGIN
  FOR f IN 0..5 LOOP
    FOREACH s IN ARRAY ARRAY['front','back'] LOOP
      FOR u IN 0..3 LOOP
        rnd := (f*17 + u*11 + CASE WHEN s='front' THEN 0 ELSE 5 END) % 10;
        status := CASE WHEN rnd < 6 THEN 'available'::public.apt_status
                       WHEN rnd < 8 THEN 'reserved'::public.apt_status
                       ELSE 'sold'::public.apt_status END;
        rooms := 1 + ((f + u + CASE WHEN s='back' THEN 1 ELSE 0 END) % 4);
        orient := CASE WHEN s='front' THEN (ARRAY['Jug','Jugoistok','Jugozapad','Jug'])[u+1]
                       ELSE (ARRAY['Sjever','Sjeveroistok','Sjeverozapad','Sjever'])[u+1] END;
        INSERT INTO public.apartments (number, title, description, floor, unit_on_floor, side, rooms, bathrooms, area, price, status, orientation, features)
        VALUES (
          lpad(n::text,3,'0'),
          'Stan ' || lpad(n::text,3,'0'),
          'Prostrani ' || rooms || '-sobni stan sa balkonom i pogledom na ' || orient || '.',
          f+1, u+1, s::public.apt_side, rooms,
          CASE WHEN rooms > 2 THEN 2 ELSE 1 END,
          38 + rooms*17 + ((u*4)%10),
          85000 + rooms*38000 + f*5200,
          status, orient,
          ARRAY['Balkon','Parking','Klima','Podno grijanje']
        );
        n := n + 1;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
