-- Add evaluations tracking to profiles
alter table public.profiles 
add column evaluations_count int default 0;

-- Function to increment evaluation count safely
create or replace function public.increment_evaluations()
returns trigger as $$
begin
  update public.profiles
  set evaluations_count = evaluations_count + 1
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on review creation
create trigger on_review_created
  after insert on public.reviews
  for each row execute procedure public.increment_evaluations();
