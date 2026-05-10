
/* Alfalah DB Sync v20260502b
   حفظ فعلي في Supabase مع إبقاء JSON/Word/PDF/Gmail دون حذف.
*/
(function(){
'use strict';
const URL=window.ALFALAH_SUPABASE_URL||'https://nmbbahzzogspuuvpsxud.supabase.co';
const KEY=window.ALFALAH_SUPABASE_KEY||'sb_publishable_OHbaA9Rse47v5pw_0Juafg_RbeorWMM';
let sb=null;
function client(){ if(sb) return sb; if(window.alfalahSupabase){sb=window.alfalahSupabase; return sb;} if(window.supabase){sb=window.supabase.createClient(URL,KEY); window.alfalahSupabase=sb; return sb;} return null; }
function notify(msg,ok=true){
  if(typeof window.toast==='function'){try{window.toast(msg);return}catch(e){}}
  const d=document.createElement('div'); d.textContent=msg; d.style.cssText='position:fixed;z-index:999999;bottom:24px;left:50%;transform:translateX(-50%);background:'+(ok?'#0f7b55':'#b83232')+';color:#fff;padding:13px 24px;border-radius:999px;font-family:Cairo,Tahoma,Arial,sans-serif;font-weight:900;box-shadow:0 10px 28px rgba(0,0,0,.25)'; document.body.appendChild(d); setTimeout(()=>d.remove(),3500);
}
function pageType(){const p=location.pathname; if(p.includes('/schedule/'))return'schedule'; if(p.includes('/evaluation/'))return'evaluation'; if(p.includes('/management/'))return'management'; if(p.includes('/ai-evaluation/'))return'ai'; if(p.includes('/schools/'))return'schools'; return'home';}
function val(el){ if(el.type==='checkbox') return el.checked; if(el.type==='radio') return el.checked?el.value:null; return el.value; }
function collectForm(){
  const obj={};
  document.querySelectorAll('input,select,textarea').forEach((el,i)=>{
    if(el.type==='file')return; let key=el.id||el.name||('field_'+i); let v=val(el); if(v!==null)obj[key]=v;
  });
  obj._page=pageType(); obj._saved_at=new Date().toISOString(); obj._url=location.pathname;
  return obj;
}
function first(...xs){return xs.find(x=>x!==undefined&&x!==null&&String(x).trim()!=='')||'';}
function today(){return new Date().toISOString().slice(0,10)}
async function insertWithFallback(table, variants){
 const c=client(); if(!c) throw new Error('Supabase غير متصل'); let last=null;
 for(const row of variants){ const r=await c.from(table).insert(row).select(); if(!r.error)return r.data; last=r.error; console.warn('insert failed',table,r.error,row); }
 throw last||new Error('فشل الحفظ');
}
async function saveSchedule(){
  const d=(typeof window.getFormData==='function')?window.getFormData():collectForm();
  const wn=Number(first(d.wnum,d.week_number,d.weekNumber,d['رقم الأسبوع']))||null;
  const row={week_number:wn,week_title:first(d.week_title,d.wtitle,d.wmission, wn?('الأسبوع '+wn):''),work_date:first(d.wstart,d.from_date,d.work_date,today()),day_name:'أسبوعي',tasks:JSON.stringify(d),notes:first(d.week_requests,d.other_work,d.notes,''),attendance:first(d.attendance,''),departure:first(d.departure,''),work_type:first(d.wstatus,d.work_type,''),full_data:d,updated_at:new Date().toISOString()};
  await insertWithFallback('daily_work_logs',[row,{work_date:row.work_date,day_name:row.day_name,notes:row.notes,full_data:d},{work_date:row.work_date,day_name:row.day_name,notes:JSON.stringify(d)}]);
  try{localStorage.setItem('falah_week_db_last',JSON.stringify(d));}catch(e){}
  notify('✅ تم الحفظ في قاعدة البيانات');
}
function evalScoreFromDOM(){let vals=[...document.querySelectorAll('.rpill.sel,[class*=ra]')].length; return vals||null;}
async function saveEvaluation(){
  let d={}; try{ if(typeof window.getEv==='function'){const sid=document.getElementById('esch')?.value; d=window.getEv(); d.school_id=sid; }}catch(e){}
  d={...collectForm(),...d};
  const sid=Number(first(d.school_id,d.esch,d.school,d.schoolId))||null;
  const schoolCode=first(d.school_code,d.code,'');
  const row={school_id:sid,school_code:schoolCode,visit_date:first(d.date,d['f-date'],d.visit_date,today()),librarian_name:first(d.lib,d['f-lib'],d.librarian_name,''),total_score:Number(first(d.total_score,d.score,evalScoreFromDOM(),0))||0,final_level:first(d.overall,d['f-ovr'],d.final_level,''),strengths:first(d.str,d['f-str'],''),weaknesses:first(d.chal,d['f-chal'],''),recommendations:first(d.rec,d['f-rec'],''),full_data:d,updated_at:new Date().toISOString()};
  await insertWithFallback('library_evaluations',[row,{school_id:sid,visit_date:row.visit_date,librarian_name:row.librarian_name,total_score:row.total_score,final_level:row.final_level,full_data:d},{visit_date:row.visit_date,full_data:d}]);
  notify('✅ تم حفظ التقييم في قاعدة البيانات');
}
async function saveManagement(){ const d=collectForm(); const row={report_week:first(d.week_number,d.wnum,''),report_date:today(),summary:first(d.summary,d.reportText,d.emailTextBox,''),achievements:first(d.achievements,d.mgrAch,''),challenges:first(d.challenges,d.mgrChal,''),next_steps:first(d.next_week,d.mgrNext,''),full_data:d,updated_at:new Date().toISOString()}; await insertWithFallback('management_reports',[row,{report_date:row.report_date,summary:JSON.stringify(d),full_data:d},{report_date:row.report_date,summary:JSON.stringify(d)}]); notify('✅ تم حفظ تقرير الإدارة في القاعدة'); }
async function saveAI(){ const d=collectForm(); const sid=Number(first(d.school,d.school_id,d.esch))||null; const row={school_id:sid,review_text:first(d.review_text,d.reportText,d['ai-text'],d.text,''),ai_score:Number(first(d.ai_score,d.score,0))||0,ai_summary:first(d.ai_summary,d.result,''),full_data:d}; await insertWithFallback('ai_reviews',[row,{review_text:row.review_text,ai_score:row.ai_score,full_data:d},{review_text:JSON.stringify(d)}]); notify('✅ تم حفظ تحليل AI في القاعدة'); }
async function saveCurrent(){ const t=pageType(); if(t==='schedule')return saveSchedule(); if(t==='evaluation')return saveEvaluation(); if(t==='management')return saveManagement(); if(t==='ai')return saveAI(); notify('هذه الصفحة لا تحتوي نموذج حفظ مركزي.'); }
function isDbSaveButton(el){ const tx=(el.innerText||el.value||'').trim(); const id=el.id||''; return /حفظ في القاعدة|حفظ التقييم|حفظ AI|حفظ التقرير/.test(tx) || id==='btn-save'; }
function patchButtons(){
 document.querySelectorAll('button,input[type=button],a').forEach(el=>{
   if(!isDbSaveButton(el))return;
   if(el.dataset.dbSyncPatched)return; el.dataset.dbSyncPatched='1';
   const old=el.getAttribute('onclick');
   el.setAttribute('onclick','return false;');
   el.addEventListener('click',async ev=>{ev.preventDefault(); ev.stopImmediatePropagation(); try{ await saveCurrent(); }catch(e){ console.error(e); notify('❌ فشل الحفظ في القاعدة: '+(e.message||e),false);} },true);
   if(old && !/saveCurrent/.test(old)) el.dataset.oldClick=old;
 });
 // rename only tooltips/text that still imply temporary as main action
 document.querySelectorAll('button').forEach(b=>{ if((b.innerText||'').includes('حفظ مؤقت')) b.innerHTML=b.innerHTML.replace('حفظ مؤقت','حفظ على الجهاز'); });
}
window.AlfalahDBSync={saveCurrent,saveSchedule,saveEvaluation,saveManagement,saveAI,collectForm,client};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(patchButtons,600)); else setTimeout(patchButtons,600);
setTimeout(patchButtons,2000);
})();
