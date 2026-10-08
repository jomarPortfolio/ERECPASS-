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
  if(pr.data?.role!=='admin'||pr.data?.active!==true){
    throw new Error('This account is not an active Admin account.');
  }

  return client;
}

window.erecpassAdminAppointmentAction=async function(id,status){
  if(window.__erecpassAdminAppointmentBusy) return;
  if(!['Approved','Cancelled'].includes(status)) return;

  const raw=String(id ?? '').trim();
  const appointmentId=Number(raw);

  if(!Number.isSafeInteger(appointmentId)||appointmentId<1){
    alert('Invalid appointment ID. Please refresh the appointment list.');
    return;
  }

  if(status==='Cancelled'&&!window.confirm('Cancel this appointment?\nYou can’t undo this action.')) return;

  window.__erecpassAdminAppointmentBusy=true;

  try{
    const client=await getAdminClient();

    let updated=null;
    let updateError=null;

    // Primary path: normal RLS-protected UPDATE.
    const direct=await client.from('appointments')
      .update({
        status:status,
        updated_at:new Date().toISOString()
      })
      .eq('id',appointmentId)
      .select('id,status,updated_at')
      .maybeSingle();

    updated=direct.data;
    updateError=direct.error;

    // Compatibility fallback for older cached sessions/RLS state.
    if(updateError||!updated){
      const rpc=await client.rpc('admin_update_appointment_status',{
        p_appointment_id:appointmentId,
        p_status:status
      });
      if(rpc.error) throw updateError||rpc.error;
      updated=rpc.data;
    }

    if(!updated) throw new Error('Appointment was not updated. Please refresh the appointment list.');

    if(typeof window.renderAdminAppointmentsList==='function'){
      await window.renderAdminAppointmentsList();
    }
  }catch(e){
    console.error('[ERecPass] Admin appointment action failed:',e);
    alert('Could not '+(status==='Approved'?'approve':'cancel')+' appointment: '+(e?.message||'Please try again.'));
  }finally{
    window.__erecpassAdminAppointmentBusy=false;
  }
};
})();