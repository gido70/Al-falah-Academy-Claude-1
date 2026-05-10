-- Alfalah Libraries: central database + storage sync final setup
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor

create table if not exists public.schools (
  id bigint generated always as identity primary key,
  code text unique,
  name text,
  city text,
  branch text,
  created_at timestamptz default now()
);
alter table public.schools add column if not exists code text;
alter table public.schools add column if not exists name text;
alter table public.schools add column if not exists city text;
alter table public.schools add column if not exists branch text;
insert into public.schools (id, code, name, city, branch) values
(1,'dan','فرع الدانة','أبوظبي','الدانة'),
(2,'mzd','فرع محمد بن زايد','أبوظبي','محمد بن زايد'),
(3,'bny','فرع بني ياس','أبوظبي','بني ياس'),
(4,'khb','فرع الخبيصي','العين','الخبيصي'),
(5,'jmi','فرع الجيمي','العين','الجيمي'),
(6,'shj','مدرسة الفلاح الخاصة','الشارقة','الشارقة')
on conflict (id) do update set code=excluded.code,name=excluded.name,city=excluded.city,branch=excluded.branch;

create table if not exists public.library_evaluations (
  id bigint generated always as identity primary key,
  school_id bigint references public.schools(id),
  school_code text,
  visit_date date,
  librarian_name text,
  total_score numeric,
  final_level text,
  strengths text,
  weaknesses text,
  recommendations text,
  full_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.library_evaluations add column if not exists school_code text;
alter table public.library_evaluations add column if not exists updated_at timestamptz default now();
create unique index if not exists library_evaluations_school_current_idx on public.library_evaluations (school_id);

create table if not exists public.daily_work_logs (
  id bigint generated always as identity primary key,
  week_number int,
  week_title text,
  work_date date,
  day_name text,
  check_in time,
  check_out time,
  task_type text,
  task_details text,
  tasks text,
  notes text,
  full_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.daily_work_logs add column if not exists week_number int;
alter table public.daily_work_logs add column if not exists week_title text;
alter table public.daily_work_logs add column if not exists day_name text;
alter table public.daily_work_logs add column if not exists task_type text;
alter table public.daily_work_logs add column if not exists task_details text;
alter table public.daily_work_logs add column if not exists tasks text;
alter table public.daily_work_logs add column if not exists full_data jsonb;
alter table public.daily_work_logs add column if not exists updated_at timestamptz default now();
create unique index if not exists daily_work_logs_week_number_idx on public.daily_work_logs (week_number);

create table if not exists public.management_reports (
  id bigint generated always as identity primary key,
  report_week text,
  report_date date,
  summary text,
  achievements text,
  challenges text,
  next_steps text,
  full_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.management_reports add column if not exists updated_at timestamptz default now();

create table if not exists public.ai_reviews (
  id bigint generated always as identity primary key,
  school_id bigint references public.schools(id),
  evaluation_id bigint references public.library_evaluations(id),
  review_text text,
  score numeric,
  ai_score numeric,
  ai_summary text,
  ai_strengths text,
  ai_weaknesses text,
  ai_recommendations text,
  full_data jsonb,
  created_at timestamptz default now()
);

create table if not exists public.school_files (
  id bigint generated always as identity primary key,
  school_id bigint references public.schools(id),
  school_code text,
  evaluation_id bigint references public.library_evaluations(id),
  file_category text not null,
  file_name text not null,
  file_path text not null,
  file_url text,
  file_type text,
  file_size bigint,
  notes text,
  created_at timestamptz default now()
);
alter table public.school_files add column if not exists school_code text;

insert into storage.buckets (id, name, public) values
('library-images', 'library-images', true),
('library-documents', 'library-documents', true),
('specialist-certificates', 'specialist-certificates', true)
on conflict (id) do update set public=true;

alter table public.schools enable row level security;
alter table public.library_evaluations enable row level security;
alter table public.daily_work_logs enable row level security;
alter table public.management_reports enable row level security;
alter table public.ai_reviews enable row level security;
alter table public.school_files enable row level security;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname='public' AND tablename IN ('schools','library_evaluations','daily_work_logs','management_reports','ai_reviews','school_files') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

create policy "allow all schools" on public.schools for all to anon, authenticated using (true) with check (true);
create policy "allow all evaluations" on public.library_evaluations for all to anon, authenticated using (true) with check (true);
create policy "allow all daily logs" on public.daily_work_logs for all to anon, authenticated using (true) with check (true);
create policy "allow all management reports" on public.management_reports for all to anon, authenticated using (true) with check (true);
create policy "allow all ai reviews" on public.ai_reviews for all to anon, authenticated using (true) with check (true);
create policy "allow all school files" on public.school_files for all to anon, authenticated using (true) with check (true);

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects' LOOP
    IF r.policyname LIKE 'alfalah %' THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
    END IF;
  END LOOP;
END $$;

create policy "alfalah read storage" on storage.objects for select to anon, authenticated
using (bucket_id in ('library-images','library-documents','specialist-certificates'));
create policy "alfalah upload storage" on storage.objects for insert to anon, authenticated
with check (bucket_id in ('library-images','library-documents','specialist-certificates'));
create policy "alfalah update storage" on storage.objects for update to anon, authenticated
using (bucket_id in ('library-images','library-documents','specialist-certificates'))
with check (bucket_id in ('library-images','library-documents','specialist-certificates'));
create policy "alfalah delete storage" on storage.objects for delete to anon, authenticated
using (bucket_id in ('library-images','library-documents','specialist-certificates'));
