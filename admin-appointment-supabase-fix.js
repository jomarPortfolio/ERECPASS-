(function(){
'use strict';
async function getAdminClient(){
  const client=window.erecpassSupabase;
  if(!client?.auth) throw new Error('Supabase is not ready. Please refresh the app.');
  const au=await client.auth.getUser();
  if(au.error) throw au.error;
  const user=au.data?.user;
  if(!user?.id) throw new Error('Admin login session has expired. Please log in again.');
  const pr=await client.from('profiles').select('id,role,active').eq('id',user.id).maybeSingle();
  if(pr.error) throw pr.error;
  if(pr.data?.role!=='admin' || pr.data?.active!==true || String(user.email||'').toLowerCase()!=='admin2@gmail.com'){
    throw new Error('Please use the active admin2@gmail.com account.');
  }
  return client;
}
window.updateApptStatus=async function(id,status){
  if(!id) return;
  if(status!=='Approved' && status!=='Cancelled') return;
  const label=status==='Approved'?'approve':'cancel';
  if(status==='Cancelled' && !window.confirm('Cancel this appointment?\\nYou can’t undo this action.')) return;
  try{
    const client=await getAdminClient();
    const result=await client.from('appointments').update({status:status,updated_at:new Date().toISOString()}).eq('id',String(id));
    if(result.error) throw result.error;
    const verify=await client.from('appointments').select('id,status').eq('id',String(id)).maybeSingle();
    if(verify.error) throw verify.error;
    if(!verify.data || verify.data.status!==status) throw new Error('Appointment was not updated. Please refresh the list and try again.');
    if(typeof window.renderAdminAppointmentsList==='function') await window.renderAdminAppointmentsList();
    if(typeof window.renderPatientAppointments==='function' && window.currentSession?.role==='patient') await window.renderPatientAppointments();
  }catch(e){
    console.error('[ERecPass] Admin appointment '+label+' failed:',e);
    alert('Could not '+label+' appointment: '+(e?.message||'Please try again.'));
  }
};
})();
