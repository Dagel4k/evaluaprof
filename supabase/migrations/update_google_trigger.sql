-- Update the handle_new_user function to properly map Google Metadata
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Estudiante'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    'STUDENT_FREE'
  )
  on conflict (id) do nothing; -- Prevent errors if profile exists
  return new;
end;
$$ language plpgsql security definer;
