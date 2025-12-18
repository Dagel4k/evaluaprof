-- ==============================================================================
-- EVALUAPROF ENTERPRISE SCHEMA
-- ==============================================================================

-- 1. PROFILES (Extensión de auth.users)
-- ------------------------------------------------------------------------------
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role text default 'STUDENT_FREE' check (role in ('STUDENT_FREE', 'STUDENT_PRO', 'ADMIN')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: Profiles
alter table public.profiles enable row level security;

-- Política: Cada quien ve su propio perfil
create policy "Users can view own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

-- Política: Cada quien edita su propio perfil
create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Trigger para crear perfil automáticamente al registrarse
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. SCHEDULES (Horarios Guardados)
-- ------------------------------------------------------------------------------
create table public.schedules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null default 'Mi Horario',
  data jsonb not null, -- El JSON del horario completo
  is_public boolean default false, -- Para compartir en futuro
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: Schedules
alter table public.schedules enable row level security;

create policy "Users can view own schedules" 
  on public.schedules for select 
  using (auth.uid() = user_id);

create policy "Users can insert own schedules" 
  on public.schedules for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own schedules" 
  on public.schedules for update 
  using (auth.uid() = user_id);

create policy "Users can delete own schedules" 
  on public.schedules for delete 
  using (auth.uid() = user_id);


-- 3. ACTIVE SESSIONS (Control de Concurrencia)
-- ------------------------------------------------------------------------------
-- Esta tabla rastrea la última sesión válida.
create table public.active_sessions (
  user_id uuid references auth.users on delete cascade not null primary key,
  session_token_hash text not null, -- Hash del token actual o un ID de sesión
  last_seen_at timestamptz default now(),
  device_info text -- User Agent simplificado
);

alter table public.active_sessions enable row level security;

-- Solo el sistema (Service Role) o el propio usuario debería tocar esto
create policy "Users can view own session info" 
  on public.active_sessions for select 
  using (auth.uid() = user_id);


-- 4. AUDIT LOGS (Seguridad y Compliance)
-- ------------------------------------------------------------------------------
create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  action text not null, -- 'LOGIN', 'GENERATE_SCHEDULE', 'EXPORT_DATA'
  details jsonb,
  ip_address text,
  created_at timestamptz default now()
);

alter table public.audit_logs enable row level security;

-- Nadie puede ver logs excepto admins (que no definimos política pública para ello por seguridad)
-- Solo insertable via funciones seguras
create policy "Users can insert audit logs" 
  on public.audit_logs for insert 
  with check (auth.uid() = user_id);


-- ==============================================================================
-- FUNCIONES DE SEGURIDAD
-- ==============================================================================

-- Función para reforzar Single Active Session
-- Se llamará desde el cliente al hacer login exitoso
create or replace function public.register_session(token_hash text, device text)
returns void as $$
begin
  insert into public.active_sessions (user_id, session_token_hash, last_seen_at, device_info)
  values (auth.uid(), token_hash, now(), device)
  on conflict (user_id) 
  do update set 
    session_token_hash = excluded.session_token_hash,
    last_seen_at = now(),
    device_info = excluded.device_info;
end;
$$ language plpgsql security definer;
