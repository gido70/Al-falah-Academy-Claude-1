// إعدادات Supabase النهائية — لا تحتاج تعديل يدوي
window.ALFALAH_SUPABASE_URL = "https://nmbbahzzogspuuvpsxud.supabase.co";
window.ALFALAH_SUPABASE_KEY = "sb_publishable_OHbaA9Rse47v5pw_0Juafg_RbeorWMM";
(function(){
  try{
    if (window.alfalahSupabase && typeof window.alfalahSupabase.from === 'function') {
      window.supabaseClient = window.alfalahSupabase;
      console.log('Alfalah Supabase connected');
      return;
    }
    if (window.supabase && window.ALFALAH_SUPABASE_KEY && String(window.ALFALAH_SUPABASE_KEY).startsWith('sb_publishable_')) {
      window.alfalahSupabase = window.supabase.createClient(window.ALFALAH_SUPABASE_URL, window.ALFALAH_SUPABASE_KEY);
      window.supabaseClient = window.alfalahSupabase;
      console.log('Alfalah Supabase connected');
    } else {
      window.alfalahSupabase = null;
      window.supabaseClient = null;
      console.warn('Supabase client is not ready. تأكد من تحميل supabase-js قبل هذا الملف.');
    }
  } catch(e) {
    window.alfalahSupabase = null;
    window.supabaseClient = null;
    console.error('Supabase init error', e);
  }
})();
