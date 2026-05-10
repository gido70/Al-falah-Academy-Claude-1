-- =========================================================
-- Supabase setup الكامل لمنصة مكتبات أكاديمية الفلاح 2026
-- شغّل هذا الملف مرة واحدة داخل SQL Editor في مشروع alfalah-libraries
-- =========================================================

-- 1) الجداول الأساسية
create table if not exists public.schools (
  id bigint generated always as identity primary key,
  name text,
  city text,
  branch text,
  created_at timestamptz default now()
);

alter table public.schools add column if not exists name text;
alter table public.schools add column if not exists city text;
alter table public.schools add column if not exists branch text;

insert into public.schools (id, name, city, branch) values
(1,'فرع الدانة','أبوظبي','الدانة'),
(2,'فرع محمد بن زايد','أبوظبي','محمد بن زايد'),
(3,'فرع بني ياس','أبوظبي','بني ياس'),
(4,'فرع الخبيصي','العين','الخبيصي'),
(5,'فرع الجيمي','العين','الجيمي'),
(6,'مدرسة الفلاح الخاصة','الشارقة','الشارقة')
on conflict (id) do update set name=excluded.name, city=excluded.city, branch=excluded.branch;

create table if not exists public.library_evaluations (
  id bigint generated always as identity primary key,
  school_id bigint references public.schools(id),
  visit_date date,
  librarian_name text,
  total_score numeric,
  final_level text,
  strengths text,
  weaknesses text,
  recommendations text,
  full_data jsonb,
  created_at timestamptz default now()
);

create table if not exists public.daily_work_logs (
  id bigint generated always as identity primary key,
  work_date date,
  day_name text,
  check_in time,
  check_out time,
  task_type text,
  task_details text,
  notes text,
  full_data jsonb,
  created_at timestamptz default now()
);

create table if not exists public.management_reports (
  id bigint generated always as identity primary key,
  report_week text,
  report_date date,
  summary text,
  achievements text,
  challenges text,
  next_steps text,
  full_data jsonb,
  created_at timestamptz default now()
);

create table if not exists public.ai_reviews (
  id bigint generated always as identity primary key,
  school_id bigint references public.schools(id),
  evaluation_id bigint references public.library_evaluations(id),
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

-- 2) Storage buckets
insert into storage.buckets (id, name, public) values
('library-images', 'library-images', true),
('library-documents', 'library-documents', true),
('specialist-certificates', 'specialist-certificates', true)
on conflict (id) do nothing;

-- 3) تفعيل Row Level Security
alter table public.schools enable row level security;
alter table public.library_evaluations enable row level security;
alter table public.daily_work_logs enable row level security;
alter table public.management_reports enable row level security;
alter table public.ai_reviews enable row level security;
alter table public.school_files enable row level security;

-- 4) حذف السياسات القديمة إن وجدت لتجنب أخطاء التكرار
drop policy if exists "public read schools" on public.schools;
drop policy if exists "public insert schools" on public.schools;
drop policy if exists "public update schools" on public.schools;
drop policy if exists "public read evaluations" on public.library_evaluations;
drop policy if exists "public insert evaluations" on public.library_evaluations;
drop policy if exists "public update evaluations" on public.library_evaluations;
drop policy if exists "public read daily logs" on public.daily_work_logs;
drop policy if exists "public insert daily logs" on public.daily_work_logs;
drop policy if exists "public update daily logs" on public.daily_work_logs;
drop policy if exists "public read management reports" on public.management_reports;
drop policy if exists "public insert management reports" on public.management_reports;
drop policy if exists "public update management reports" on public.management_reports;
drop policy if exists "public read ai reviews" on public.ai_reviews;
drop policy if exists "public insert ai reviews" on public.ai_reviews;
drop policy if exists "public update ai reviews" on public.ai_reviews;
drop policy if exists "public read school files" on public.school_files;
drop policy if exists "public insert school files" on public.school_files;
drop policy if exists "public update school files" on public.school_files;

-- 5) سياسات عامة مؤقتة للقراءة والحفظ من GitHub Pages
create policy "public read schools" on public.schools for select to anon, authenticated using (true);
create policy "public insert schools" on public.schools for insert to anon, authenticated with check (true);
create policy "public update schools" on public.schools for update to anon, authenticated using (true) with check (true);

create policy "public read evaluations" on public.library_evaluations for select to anon, authenticated using (true);
create policy "public insert evaluations" on public.library_evaluations for insert to anon, authenticated with check (true);
create policy "public update evaluations" on public.library_evaluations for update to anon, authenticated using (true) with check (true);

create policy "public read daily logs" on public.daily_work_logs for select to anon, authenticated using (true);
create policy "public insert daily logs" on public.daily_work_logs for insert to anon, authenticated with check (true);
create policy "public update daily logs" on public.daily_work_logs for update to anon, authenticated using (true) with check (true);

create policy "public read management reports" on public.management_reports for select to anon, authenticated using (true);
create policy "public insert management reports" on public.management_reports for insert to anon, authenticated with check (true);
create policy "public update management reports" on public.management_reports for update to anon, authenticated using (true) with check (true);

create policy "public read ai reviews" on public.ai_reviews for select to anon, authenticated using (true);
create policy "public insert ai reviews" on public.ai_reviews for insert to anon, authenticated with check (true);
create policy "public update ai reviews" on public.ai_reviews for update to anon, authenticated using (true) with check (true);

create policy "public read school files" on public.school_files for select to anon, authenticated using (true);
create policy "public insert school files" on public.school_files for insert to anon, authenticated with check (true);
create policy "public update school files" on public.school_files for update to anon, authenticated using (true) with check (true);

-- 6) سياسات Storage
-- ملاحظة: هذه سياسات عامة مؤقتة لتسهيل الرفع من GitHub Pages. لاحقاً يمكن تقييدها بتسجيل دخول.
drop policy if exists "public read library images" on storage.objects;
drop policy if exists "public upload library images" on storage.objects;
drop policy if exists "public read library documents" on storage.objects;
drop policy if exists "public upload library documents" on storage.objects;
drop policy if exists "public read specialist certificates" on storage.objects;
drop policy if exists "public upload specialist certificates" on storage.objects;

create policy "public read library images" on storage.objects for select to anon, authenticated using (bucket_id = 'library-images');
create policy "public upload library images" on storage.objects for insert to anon, authenticated with check (bucket_id = 'library-images');

create policy "public read library documents" on storage.objects for select to anon, authenticated using (bucket_id = 'library-documents');
create policy "public upload library documents" on storage.objects for insert to anon, authenticated with check (bucket_id = 'library-documents');

create policy "public read specialist certificates" on storage.objects for select to anon, authenticated using (bucket_id = 'specialist-certificates');
create policy "public upload specialist certificates" on storage.objects for insert to anon, authenticated with check (bucket_id = 'specialist-certificates');
