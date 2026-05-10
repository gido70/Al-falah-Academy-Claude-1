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


-- 7) جدول ردود وتعليقات الإدارة على روابط التقارير
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

alter table public.director_feedback enable row level security;

drop policy if exists "public read director feedback" on public.director_feedback;
drop policy if exists "public insert director feedback" on public.director_feedback;
drop policy if exists "public update director feedback" on public.director_feedback;

create policy "public read director feedback" on public.director_feedback for select to anon, authenticated using (true);
create policy "public insert director feedback" on public.director_feedback for insert to anon, authenticated with check (true);
create policy "public update director feedback" on public.director_feedback for update to anon, authenticated using (true) with check (true);

-- 8) أعمدة ودعم نهائي للتشغيل المباشر من GitHub Pages
alter table public.library_evaluations add column if not exists school_code text;
alter table public.library_evaluations add column if not exists school_name text;
alter table public.library_evaluations add column if not exists updated_at timestamptz default now();

alter table public.daily_work_logs add column if not exists week_number int;
alter table public.daily_work_logs add column if not exists week_title text;
alter table public.daily_work_logs add column if not exists tasks text;
alter table public.daily_work_logs add column if not exists attendance text;
alter table public.daily_work_logs add column if not exists departure text;
alter table public.daily_work_logs add column if not exists work_type text;
alter table public.daily_work_logs add column if not exists updated_at timestamptz default now();

alter table public.school_files add column if not exists school_code text;
alter table public.school_files add column if not exists updated_at timestamptz default now();

create index if not exists idx_eval_school_code on public.library_evaluations(school_code);
create index if not exists idx_daily_week_number on public.daily_work_logs(week_number);
create index if not exists idx_school_files_school_code on public.school_files(school_code);

-- سياسات الحذف المطلوبة لأزرار الحذف والتصفير من الواجهة
drop policy if exists "public delete evaluations" on public.library_evaluations;
create policy "public delete evaluations" on public.library_evaluations for delete to anon, authenticated using (true);
drop policy if exists "public delete daily logs" on public.daily_work_logs;
create policy "public delete daily logs" on public.daily_work_logs for delete to anon, authenticated using (true);
drop policy if exists "public delete management reports" on public.management_reports;
create policy "public delete management reports" on public.management_reports for delete to anon, authenticated using (true);
drop policy if exists "public delete ai reviews" on public.ai_reviews;
create policy "public delete ai reviews" on public.ai_reviews for delete to anon, authenticated using (true);
drop policy if exists "public delete school files" on public.school_files;
create policy "public delete school files" on public.school_files for delete to anon, authenticated using (true);
drop policy if exists "public delete director feedback" on public.director_feedback;
create policy "public delete director feedback" on public.director_feedback for delete to anon, authenticated using (true);

-- سياسات Storage للحذف والتحديث من صفحات ملفات المدارس
drop policy if exists "public update library images" on storage.objects;
create policy "public update library images" on storage.objects for update to anon, authenticated using (bucket_id = 'library-images') with check (bucket_id = 'library-images');
drop policy if exists "public delete library images" on storage.objects;
create policy "public delete library images" on storage.objects for delete to anon, authenticated using (bucket_id = 'library-images');
drop policy if exists "public update library documents" on storage.objects;
create policy "public update library documents" on storage.objects for update to anon, authenticated using (bucket_id = 'library-documents') with check (bucket_id = 'library-documents');
drop policy if exists "public delete library documents" on storage.objects;
create policy "public delete library documents" on storage.objects for delete to anon, authenticated using (bucket_id = 'library-documents');
drop policy if exists "public update specialist certificates" on storage.objects;
create policy "public update specialist certificates" on storage.objects for update to anon, authenticated using (bucket_id = 'specialist-certificates') with check (bucket_id = 'specialist-certificates');
drop policy if exists "public delete specialist certificates" on storage.objects;
create policy "public delete specialist certificates" on storage.objects for delete to anon, authenticated using (bucket_id = 'specialist-certificates');
