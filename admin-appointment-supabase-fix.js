(function(){
'use strict';

async function getAdminClient(){
  const client=window.erecpassSupabase;
  if(!client?.auth) throw new Error('Supabase is not ready. Please refresh the app.');

  const au=await client.auth.getUser();
  if(au.error) throw au.error;
  const user=au.data?.user;
  if(!user?.id) throw new Error('Admin login session has expired. Please log in again.');

  const pr=await client.from('profiles')
    .select('id,role,active')
    .eq('id',user.id)
    .maybeSingle();
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
    const appointmentId=String(id).trim();
    if(!/^\\d+$/.test(appointmentId)) throw new Error('Invalid appointment ID. Please refresh the appointment list.');

    // Use the existing appointments RLS UPDATE policy directly.
    // Count confirms the exact row was changed without relying on UPDATE ... RETURNING,
    // which caused the previous false "not updated/not found" behavior.
    const result=await client.from('appointments')
      .update({status:status,updated_at:new Date().toISOString()},{count:'exact'})
      .eq('id',appointmentId);

    if(result.error) throw result.error;
    if(result.count!==1) throw new Error('Appointment '+appointmentId+' was not found or could not be updated. Please refresh the appointment list.');

    if(typeof window.renderAdminAppointmentsList==='function') await window.renderAdminAppointmentsList();
  }catch(e){
    console.error('[ERecPass] Admin appointment '+label+' failed:',e);
    alert('Could not '+label+' appointment: '+(e?.message||'Please try again.'));
  }
};
})();
