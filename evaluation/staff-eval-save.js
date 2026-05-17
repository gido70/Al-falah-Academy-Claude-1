// ═══════════════════════════════════════════════════════════════
//   أكاديمية الفلاح — دالة حفظ تقييم الكادر المهني
//   أضف هذا الكود في نهاية s7-patch.js
//   أو استبدل دالة saveS7ToSupabase الموجودة بهذه النسخة
// ═══════════════════════════════════════════════════════════════

const SUPA_URL = 'https://nmbbahzzogspuuvpsxud.supabase.co';
const SUPA_KEY = 'sb_publishable_OHbaA9Rse47v5pw_0Juafg_RbeorWMM';

// ── الدالة الرئيسية للحفظ ────────────────────────────────────────
window.saveStaffEvalToSupabase = async function (schoolId) {

  if (!schoolId) {
    console.warn('[StaffEval] schoolId مفقود');
    return null;
  }

  // 1. اجمع بيانات الواجهة
  const s7      = window.getS7Enhanced ? window.getS7Enhanced() : { scores:{}, has_license:'', action_rec:'', mgmt_note:'' };
  const oldEval = window.getEv ? window.getEv() : {};

  // 2. جهّز payload السجل الرئيسي
  const record = {
    school_id:       schoolId,
    academic_year:   '2025-2026',
    eval_date:       oldEval.date || new Date().toISOString().split('T')[0],
    staff_name:      oldEval.lib  || '',
    staff_edu_level: oldEval.edu  || '',
    staff_speciality:oldEval.spc  || '',
    staff_exp_years: oldEval.exp  || '',
    has_license:     s7.has_license === 'حاصل عليها',
    lib_system_used: oldEval['ils-name'] || oldEval.lsy || '',
    num_courses:     oldEval.crs  || '',
    evaluator_name:  '',
    strengths:       oldEval.sstr || '',
    weaknesses:      oldEval.wk   || '',
    short_term_plan: s7.shortPlan || oldEval['plan-s'] || '',
    long_term_plan:  s7.longPlan  || oldEval['plan-l'] || '',
    training_rec:    s7.trainingRec || oldEval['train-rec'] || '',
    general_notes:   s7.mgmt_note || '',
    action_rec:      s7.action_rec || '',
    overall_rating:  parseInt(oldEval.overall) || null,
  };

  // 3. جمع الدرجات — القديمة + الجديدة
  const LEGACY_MAP = {
    sb:'d1c1', sc:'d1c2', sst:'d2c5', si:'d7c2',
    ste:'d4c1', scol:'d7c3', marc:'d4c2', ils:'d4c1',
  };

  const scores = {};

  // الدرجات القديمة (من القسم 7 الأصلي)
  Object.entries(LEGACY_MAP).forEach(([oldId, newCode]) => {
    const el = document.querySelector(`#rp-${oldId} .rpill.active`);
    if (el) {
      const val = parseInt(el.innerText || el.textContent);
      if (val >= 1 && val <= 6) scores[newCode] = val;
    }
  });

  // الدرجات الجديدة (من القسم 7 المطوّر)
  if (s7.scores) {
    Object.entries(s7.scores).forEach(([code, val]) => {
      if (val >= 1 && val <= 6) scores[code] = val;
    });
  }

  if (!Object.keys(scores).length) {
    console.warn('[StaffEval] لا توجد درجات لحفظها');
    return null;
  }

  // 4. استدعاء دالة upsert_staff_eval في Supabase
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/rpc/upsert_staff_eval`, {
      method: 'POST',
      headers: {
        'apikey':        SUPA_KEY,
        'Authorization': `Bearer ${SUPA_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        p_school_id:     record.school_id,
        p_academic_year: record.academic_year,
        p_eval_date:     record.eval_date,
        p_staff_name:    record.staff_name,
        p_edu_level:     record.staff_edu_level,
        p_speciality:    record.staff_speciality,
        p_exp_years:     record.staff_exp_years,
        p_has_license:   record.has_license,
        p_lib_system:    record.lib_system_used,
        p_evaluator:     record.evaluator_name,
        p_strengths:     record.strengths,
        p_training_rec:  record.training_rec,
        p_short_plan:    record.short_term_plan,
        p_long_plan:     record.long_term_plan,
        p_action_rec:    record.action_rec,
        p_notes:         record.general_notes,
        p_overall:       record.overall_rating,
        p_scores:        scores,   // {"d1c1":5,"d2c3":4,...}
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[StaffEval] فشل الحفظ:', errText);
      // احتياط: حفظ مباشر بدون الدالة
      return await saveDirectFallback(record, scores);
    }

    const evalId = await res.json();
    console.log('[StaffEval] ✅ تم الحفظ. eval_id =', evalId);
    showStaffToast('✅ تم حفظ تقييم الكادر المهني في Supabase');
    return evalId;

  } catch (err) {
    console.error('[StaffEval] خطأ:', err);
    return await saveDirectFallback(record, scores);
  }
};

// ── احتياط: حفظ مباشر بدون الدالة ──────────────────────────────
async function saveDirectFallback(record, scores) {
  console.log('[StaffEval] محاولة الحفظ المباشر...');
  try {
    // أنشئ السجل الرئيسي
    const r1 = await fetch(`${SUPA_URL}/rest/v1/staff_eval_records`, {
      method: 'POST',
      headers: {
        'apikey':        SUPA_KEY,
        'Authorization': `Bearer ${SUPA_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=representation',
      },
      body: JSON.stringify(record),
    });

    if (!r1.ok) {
      const e = await r1.text();
      console.error('[StaffEval] فشل fallback:', e);
      showStaffToast('⚠️ فشل الحفظ — تحقق من RLS في Supabase');
      return null;
    }

    const saved  = await r1.json();
    const evalId = saved[0]?.id;
    if (!evalId) return null;

    // احفظ الدرجات
    const rows = Object.entries(scores).map(([code, score]) => ({
      eval_id:         evalId,
      competency_code: code,
      score:           score,
    }));

    if (rows.length) {
      await fetch(`${SUPA_URL}/rest/v1/staff_eval_criteria_scores`, {
        method: 'POST',
        headers: {
          'apikey':        SUPA_KEY,
          'Authorization': `Bearer ${SUPA_KEY}`,
          'Content-Type':  'application/json',
          'Prefer':        'resolution=merge-duplicates',
        },
        body: JSON.stringify(rows),
      });
    }

    console.log('[StaffEval] ✅ Fallback نجح. eval_id =', evalId);
    showStaffToast('✅ تم حفظ تقييم الكادر المهني');
    return evalId;

  } catch (err) {
    console.error('[StaffEval] خطأ fallback:', err);
    showStaffToast('❌ فشل الحفظ تماماً — تحقق من الاتصال');
    return null;
  }
}

// ── Toast إشعار ──────────────────────────────────────────────────
function showStaffToast(msg) {
  // استخدم toast الموجودة في النظام إن وُجدت
  if (typeof toast === 'function') { toast(msg); return; }
  if (typeof toastFix === 'function') { toastFix(msg, '#1a7f4b'); return; }
  // أنشئ واحدة بسيطة
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#0c447c;color:#fff;padding:10px 22px;border-radius:99px;font-family:Cairo,sans-serif;font-weight:700;font-size:13px;z-index:9999;box-shadow:0 6px 20px rgba(0,0,0,.25)';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── ربط مع زر الحفظ الأصلي ──────────────────────────────────────
// يُستدعى تلقائياً عند حفظ التقييم الرئيسي
(function hookSave() {
  const origSave = window.saveEv || window.sEv;
  if (!origSave) { setTimeout(hookSave, 600); return; }

  const wrapped = function (...args) {
    const result = origSave.apply(this, args);
    // استدعِ حفظ الكادر المهني بعد الحفظ الأصلي
    const sid = document.getElementById('esch')?.value;
    if (sid) {
      setTimeout(() => window.saveStaffEvalToSupabase(sid), 500);
    }
    return result;
  };

  if (window.saveEv) window.saveEv = wrapped;
  if (window.sEv)    window.sEv    = wrapped;
  console.log('[StaffEval] ✅ تم ربط دالة الحفظ بنجاح');
})();
