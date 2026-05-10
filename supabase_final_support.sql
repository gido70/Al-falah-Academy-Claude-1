
-- دعم نهائي للحفظ المركزي دون حذف أي بيانات
ALTER TABLE public.daily_work_logs ADD COLUMN IF NOT EXISTS week_number int;
ALTER TABLE public.daily_work_logs ADD COLUMN IF NOT EXISTS week_title text;
ALTER TABLE public.daily_work_logs ADD COLUMN IF NOT EXISTS tasks text;
ALTER TABLE public.daily_work_logs ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.daily_work_logs ADD COLUMN IF NOT EXISTS attendance text;
ALTER TABLE public.daily_work_logs ADD COLUMN IF NOT EXISTS departure text;
ALTER TABLE public.daily_work_logs ADD COLUMN IF NOT EXISTS work_type text;
ALTER TABLE public.daily_work_logs ADD COLUMN IF NOT EXISTS full_data jsonb;
ALTER TABLE public.daily_work_logs ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();
ALTER TABLE public.library_evaluations ADD COLUMN IF NOT EXISTS school_code text;
ALTER TABLE public.library_evaluations ADD COLUMN IF NOT EXISTS full_data jsonb;
ALTER TABLE public.library_evaluations ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();
ALTER TABLE public.management_reports ADD COLUMN IF NOT EXISTS full_data jsonb;
ALTER TABLE public.management_reports ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();
ALTER TABLE public.ai_reviews ADD COLUMN IF NOT EXISTS full_data jsonb;
ALTER TABLE public.school_files ADD COLUMN IF NOT EXISTS school_code text;
ALTER TABLE public.school_files ADD COLUMN IF NOT EXISTS notes text;
CREATE INDEX IF NOT EXISTS idx_daily_week_number ON public.daily_work_logs(week_number);
CREATE INDEX IF NOT EXISTS idx_eval_school_id ON public.library_evaluations(school_id);
CREATE INDEX IF NOT EXISTS idx_files_school_id ON public.school_files(school_id);
-- سياسات آمنة للتشغيل على GitHub Pages
ALTER TABLE public.daily_work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_files ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "allow all daily logs" ON public.daily_work_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "allow all evaluations" ON public.library_evaluations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "allow all management reports" ON public.management_reports FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "allow all ai reviews" ON public.ai_reviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "allow all school files" ON public.school_files FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
INSERT INTO storage.buckets (id,name,public) VALUES ('library-images','library-images',true),('library-documents','library-documents',true),('specialist-certificates','specialist-certificates',true) ON CONFLICT (id) DO UPDATE SET public=true;
