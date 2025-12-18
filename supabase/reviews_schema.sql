-- ==============================================================================
-- CROWDSOURCING MODULE
-- ==============================================================================

create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  
  -- Link flexible: Puede ser un ID del scraper o un nuevo ID si creamos profes
  professor_name text not null, 
  university text not null,
  
  -- Metadata académica
  subject text not null,
  semester text, -- "2024-1", "2023-2"
  
  -- Métricas cuantitativas
  quality_rating int check (quality_rating between 1 and 10),
  difficulty_rating int check (difficulty_rating between 1 and 10),
  take_again boolean,
  attendance_mandatory boolean,
  
  -- Métricas cualitativas (Anti-Spam: requerir texto real)
  comment text check (char_length(comment) >= 30), 
  tags text[], -- ["Inspirador", "Barco", "Estricto"]
  
  -- Moderación
  is_verified boolean default false, -- Para reviews de cuentas institucionales verificadas
  status text default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  
  created_at timestamptz default now()
);

-- RLS
alter table public.reviews enable row level security;

-- Todos pueden leer reviews aprobadas
create policy "Public can read approved reviews" 
  on public.reviews for select 
  using (status = 'APPROVED' or auth.uid() = user_id);

-- Usuarios autenticados pueden insertar
create policy "Authenticated users can insert reviews" 
  on public.reviews for insert 
  with check (auth.uid() = user_id);
