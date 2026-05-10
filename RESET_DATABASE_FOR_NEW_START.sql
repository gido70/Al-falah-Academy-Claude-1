-- تصفير بيانات التجربة قبل بدء الإدخال الحقيقي
-- شغّل هذا الملف مرة واحدة فقط في Supabase SQL Editor إذا كنت تريد البدء من الصفر.

truncate table public.director_feedback restart identity cascade;
truncate table public.school_files restart identity cascade;
truncate table public.ai_reviews restart identity cascade;
truncate table public.management_reports restart identity cascade;
truncate table public.daily_work_logs restart identity cascade;
truncate table public.library_evaluations restart identity cascade;

-- لا يتم حذف جدول المدارس لأن النظام يحتاجه للقوائم.
-- إعادة تثبيت المدارس الست الأساسية:
insert into public.schools (id, name, city, branch) values
(1,'فرع الدانة','أبوظبي','الدانة'),
(2,'فرع محمد بن زايد','أبوظبي','محمد بن زايد'),
(3,'فرع بني ياس','أبوظبي','بني ياس'),
(4,'فرع الخبيصي','العين','الخبيصي'),
(5,'فرع الجيمي','العين','الجيمي'),
(6,'مدرسة الفلاح الخاصة','الشارقة','الشارقة')
on conflict (id) do update set name=excluded.name, city=excluded.city, branch=excluded.branch;
