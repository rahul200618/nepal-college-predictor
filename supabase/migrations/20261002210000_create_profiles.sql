
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Allow public inserts (since Firebase handles auth, anyone with a valid Firebase token could theoretically insert. We will just use RLS anon inserts for simplicity, or service role)
-- For simplicity, since the app is using client-side fetching without RLS for colleges, we'll allow anon to insert and read.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.profiles FOR UPDATE USING (true);
