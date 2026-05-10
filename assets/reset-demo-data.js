/* Alfalah one-time local demo reset.
   يمسح بيانات الاختبار المحلية مرة واحدة فقط حتى لا تختلط مع بيانات Supabase الحقيقية.
   لا يؤثر على قاعدة البيانات. لتكرار التصفير المحلي أضف ?localReset=1 للرابط. */
(function(){
  try{
    var FLAG='alfalah_local_reset_20260510_ready_v1';
    var force=new URLSearchParams(location.search).get('localReset')==='1';
    if(localStorage.getItem(FLAG)==='done' && !force) return;
    var prefixes=['falah_week_','supabase_week_'];
    var keys=['falah_lib_v6','falah_wp_final','director_feedback_local','falah_week_db_last','wkm_deleted_db_ids'];
    for(var i=localStorage.length-1;i>=0;i--){
      var k=localStorage.key(i)||'';
      if(keys.indexOf(k)>=0 || prefixes.some(function(p){return k.indexOf(p)===0;})) localStorage.removeItem(k);
    }
    localStorage.setItem(FLAG,'done');
    console.log('Alfalah local demo data cleared once.');
  }catch(e){console.warn('Local reset skipped',e)}
})();
