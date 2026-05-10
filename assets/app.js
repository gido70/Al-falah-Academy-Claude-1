const SCHOOLS=[
 {id:1,code:'dan',name:'فرع الدانة',city:'أبوظبي',branch:'الدانة'},
 {id:2,code:'mzd',name:'فرع محمد بن زايد',city:'أبوظبي',branch:'محمد بن زايد'},
 {id:3,code:'bny',name:'فرع بني ياس',city:'أبوظبي',branch:'بني ياس'},
 {id:4,code:'khb',name:'فرع الخبيصي',city:'العين',branch:'الخبيصي'},
 {id:5,code:'jmi',name:'فرع الجيمي',city:'العين',branch:'الجيمي'},
 {id:6,code:'shj',name:'مدرسة الفلاح الخاصة',city:'الشارقة',branch:'الشارقة'}
];
function q(id){return document.getElementById(id)}
function showMsg(id,text,type='ok'){const el=q(id); if(!el)return; el.className='msg '+type; el.textContent=text;}
function getClient(){
 if(!window.supabase){return null}
 return window.supabase.createClient(window.ALFALAH_SUPABASE_URL, window.ALFALAH_SUPABASE_KEY);
}
const SB = () => getClient();
function fillSchools(selId){const sel=q(selId); if(!sel)return; sel.innerHTML='<option value="">اختر المدرسة</option>'+SCHOOLS.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}
function schoolById(id){return SCHOOLS.find(s=>String(s.id)===String(id))}
function schoolByCode(code){return SCHOOLS.find(s=>s.code===code)}
async function getCounts(){const sb=SB(); if(!sb)return {ev:0,weeks:0,files:0};
 const [ev,weeks,files]=await Promise.all([
  sb.from('library_evaluations').select('id',{count:'exact',head:true}),
  sb.from('daily_work_logs').select('id',{count:'exact',head:true}),
  sb.from('school_files').select('id',{count:'exact',head:true})
 ]);
 return {ev:ev.count||0,weeks:weeks.count||0,files:files.count||0};
}
function jsonDownload(name,obj){const b=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();URL.revokeObjectURL(a.href)}
function csvDownload(name,rows){const txt='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n');const b=new Blob([txt],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();URL.revokeObjectURL(a.href)}
