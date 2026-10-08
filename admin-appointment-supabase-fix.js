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

    // Appointment-only Supabase RPC. This avoids the old UPDATE/RETURNING
    // RLS mismatch while leaving every other app function unchanged.
    const result=await client.rpc('admin_update_appointment_status',{
      p_appointment_id:Number(id),
      p_status:status
    });

    if(result.error) throw result.error;
    if(!result.data) throw new Error('Appointment was not updated. Please try again.');

    if(typeof window.renderAdminAppointmentsList==='function'){
      await window.renderAdminAppointmentsList();
    }

    if(typeof window.renderPatientAppointments==='function' && window.currentSession?.role==='patient'){
      await window.renderPatientAppointments();
    }
  }catch(e){
    console.error('[ERecPass] Admin appointment '+label+' failed:',e);
    alert('Could not '+label+' appointment: '+(e?.message||'Please try again.'));
  }
};
})();