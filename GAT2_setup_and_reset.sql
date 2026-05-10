-- ═══════════════════════════════════════════════════════════════════
--  أكاديمية الفلاح — GAT2 إعداد كامل + تصفير البيانات
--  شغّله في: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ═══ 1. إنشاء الجداول (إذا لم تكن موجودة) ═══════════════════════

create table if not exists public.schools (
  id bigint generated always as identity primary key,
  name text, city text, branch text,
  created_at timestamptz default now()
);

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

create table if not exists public.daily_work_logs (
  id bigint generated always as identity primary key,
  week_number integer,
  work_date date,
  check_in time,
  check_out time,
  task_type text,
  task_details text,
  notes text,
  full_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.director_feedback (
  id bigint generated always as identity primary key,
  report_type text,
  school_id text,
  period text,
  decision text,
  priority text,
  comment text,
  page_url text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.management_reports (
  id bigint generated always as identity primary key,
  report_week text,
  report_date date,
  summary text,
  achievements text,
  full_data jsonb,
  created_at timestamptz default now()
);

create table if not exists public.school_files (
  id bigint generated always as identity primary key,
  school_code text,
  file_type text,
  file_name text,
  file_url text,
  created_at timestamptz default now()
);

create table if not exists public.ai_reviews (
  id bigint generated always as identity primary key,
  review_text text,
  score numeric,
  full_data jsonb,
  created_at timestamptz default now()
);

-- ═══ 2. RLS — صلاحيات القراءة والكتابة ═══════════════════════════

alter table public.schools             enable row level security;
alter table public.library_evaluations enable row level security;
alter table public.daily_work_logs     enable row level security;
alter table public.director_feedback   enable row level security;
alter table public.management_reports  enable row level security;
alter table public.school_files        enable row level security;
alter table public.ai_reviews          enable row level security;

-- حذف السياسات القديمة وإعادة إنشائها
drop policy if exists "gat2_all_schools"   on public.schools;
drop policy if exists "gat2_all_evals"     on public.library_evaluations;
drop policy if exists "gat2_all_logs"      on public.daily_work_logs;
drop policy if exists "gat2_all_feedback"  on public.director_feedback;
drop policy if exists "gat2_all_reports"   on public.management_reports;
drop policy if exists "gat2_all_files"     on public.school_files;
drop policy if exists "gat2_all_ai"        on public.ai_reviews;

create policy "gat2_all_schools"   on public.schools             for all using (true) with check (true);
create policy "gat2_all_evals"     on public.library_evaluations for all using (true) with check (true);
create policy "gat2_all_logs"      on public.daily_work_logs     for all using (true) with check (true);
create policy "gat2_all_feedback"  on public.director_feedback   for all using (true) with check (true);
create policy "gat2_all_reports"   on public.management_reports  for all using (true) with check (true);
create policy "gat2_all_files"     on public.school_files        for all using (true) with check (true);
create policy "gat2_all_ai"        on public.ai_reviews          for all using (true) with check (true);

-- ═══ 3. إدخال بيانات المدارس الست ═══════════════════════════════

insert into public.schools (id, name, city, branch) values
(1, 'أكاديمية الفلاح فرع الدانة',            'أبوظبي',  'الدانة'),
(2, 'أكاديمية الفلاح فرع محمد بن زايد',      'أبوظبي',  'محمد بن زايد'),
(3, 'أكاديمية الفلاح فرع بني ياس',           'أبوظبي',  'بني ياس'),
(4, 'أكاديمية الفلاح فرع الخبيصي',           'العين',   'الخبيصي'),
(5, 'أكاديمية الفلاح فرع الجيمي',            'العين',   'الجيمي'),
(6, 'مدرسة الفلاح الخاصة - الدخيلات',        'الشارقة', 'الشارقة')
on conflict (id) do update set
  name=excluded.name, city=excluded.city, branch=excluded.branch;

-- ═══ 4. تصفير بيانات Demo من قاعدة البيانات ══════════════════════

delete from public.library_evaluations;
delete from public.daily_work_logs;
delete from public.director_feedback;
delete from public.management_reports;
delete from public.ai_reviews;

-- ═══ 5. تحقق نهائي ═══════════════════════════════════════════════

select
  (select count(*) from public.schools)             as schools,
  (select count(*) from public.library_evaluations) as evaluations,
  (select count(*) from public.daily_work_logs)     as work_logs,
  (select count(*) from public.director_feedback)   as feedback,
  (select count(*) from public.management_reports)  as reports;

