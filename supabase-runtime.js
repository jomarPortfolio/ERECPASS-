
(function(){
  const cache=new Map(),K={P:'erecpass_db_patients',S:'erecpass_db_staff',A:'erecpass_db_admin_accounts',N:'erecpass_db_announcements',B:'erecpass_db_appointments',C:'erecpass_db_chats',L:'erecpass_db_logs',X:'erecpass_db_session',G:'erecpass_db_agreement',E:'erecpass_db_emergencynums'};
  [K.P,K.S,K.A,K.N,K.B,K.C,K.L].forEach(k=>cache.set(k,'[]'));
  let role='anon',user=null,loading=false,channel=null,queue=Promise.resolve();
  const sb=()=>window.erecpassSupabase,parse=(s,d=[])=>{try{return JSON.parse(s||'null')??d}catch{return d}},put=(k,v)=>cache.set(k,typeof v==='string'?v:JSON.stringify(v)),err=(s,e)=>console.error('[ERecPass cloud] '+s,e);
  const patient=p=>({id:p.id,user_id:p.user_id,fullName:p.full_name,email:p.email,sim:p.sim,photo:p.photo,ageCategory:p.age_category,guardianNum:p.guardian_num,status:p.status,labResults:p.lab_results||[],prescriptions:p.prescriptions||[],doctorNotes:p.doctor_notes||'',online:!!p.online,active:p.active!==false});
  const staff=s=>({id:s.id,user_id:s.user_id,name:s.name,email:s.email,role:s.role_title,task:s.task,available:s.available,schedule:s.schedule,active:s.active!==false});
  const appt=a=>({id:a.legacy_id||a.id,patientId:a.patient_id,patientName:a.patient_name,doctor:a.doctor,date:a.appointment_date,reason:a.reason,status:a.status,created_by:a.created_by});
  const ann=a=>({id:a.legacy_id||a.id,text:a.body,photo:a.photo,date:a.published_on});
  const msg=m=>({id:m.legacy_id||m.id,user_id:m.user_id,fullName:m.full_name,email:m.email,message:m.message,reply:m.admin_reply,status:m.status,date:m.created_at});
  async function hydrate(){
    if(!sb())throw Error('Supabase client did not initialize');
    loading=true;
    try{
      const sr=await sb().auth.getSession();if(sr.error)throw sr.error;
      const u=sr.data.session?.user;
      if(!u){role='anon';user=null;[K.P,K.S,K.A,K.N,K.B,K.C,K.L].forEach(k=>put(k,[]));put(K.X,null);return}
      user=u;
      const pr=await sb().from('profiles').select('id,full_name,role,active').eq('id',u.id).maybeSingle();
      if(pr.error)throw pr.error;
      if(!pr.data||pr.data.active===false){await sb().auth.signOut();role='anon';user=null;put(K.X,null);throw Error('Account is inactive or has no profile')}
      role=pr.data.role||'patient';
      const tables=['patients','staff','appointments','announcements','help_center_messages','activity_logs'];
      const rs=await Promise.all(tables.map(t=>sb().from(t).select('*')));
      rs.forEach((r,i)=>{if(r.error)err('read '+tables[i],r.error)});
      const ps=(rs[0].error?[]:rs[0].data||[]).map(patient),ss=(rs[1].error?[]:rs[1].data||[]).map(staff);
      put(K.P,ps);put(K.S,ss);put(K.B,(rs[2].error?[]:rs[2].data||[]).map(appt));put(K.N,(rs[3].error?[]:rs[3].data||[]).map(ann));put(K.C,(rs[4].error?[]:rs[4].data||[]).map(msg));put(K.L,(rs[5].error?[]:rs[5].data||[]).map(x=>({id:x.id,timestamp:x.created_at,text:x.event_text})));put(K.A,[]);
      const data=role==='patient'?(ps.find(p=>p.user_id===u.id)||{id:u.id,user_id:u.id,email:u.email,fullName:pr.data.full_name}):role==='staff'?(ss.find(s=>s.user_id===u.id)||{id:u.id,user_id:u.id,email:u.email,name:pr.data.full_name}):{id:u.id,user_id:u.id,email:u.email,name:pr.data.full_name,fullName:pr.data.full_name};
      if(typeof currentSession!=='undefined'){currentSession={role,data};put(K.X,currentSession)}
      if(channel)await sb().removeChannel(channel);
      channel=sb().channel('erecpass-sync-'+u.id);
      ['patients','staff','appointments','announcements','help_center_messages','activity_logs'].forEach(t=>channel.on('postgres_changes',{event:'*',schema:'public',table:t},()=>{if(!loading)hydrate().catch(e=>err('realtime refresh',e))}));
      channel.subscribe();
    }finally{loading=false}
  }
  async function persist(k,oldRaw,newRaw){
    if(loading||!sb()||!user)return;
    const old=parse(oldRaw),a=parse(newRaw),client=sb();
    try{
      if(k===K.P){
        if(role==='patient'){
          const before=new Map(old.map(p=>[String(p.id),p]));
          for(const p of a){const o=before.get(String(p.id));if(o&&JSON.stringify([o.fullName,o.sim,o.photo,o.ageCategory,o.guardianNum])!==JSON.stringify([p.fullName,p.sim,p.photo,p.ageCategory,p.guardianNum])&&(p.user_id===user.id||p.id===user.id)){
            const r=await client.rpc('update_own_patient_profile',{p_full_name:p.fullName??null,p_sim:p.sim??null,p_photo:p.photo??null,p_age_category:p.ageCategory??null,p_guardian_num:p.guardianNum??null});if(r.error)throw r.error;
          }}
        }else if(role==='admin'||role==='staff'){
          const rows=a.map(p=>({id:String(p.id),user_id:p.user_id||p.auth_user_id||null,full_name:p.fullName||p.full_name||p.name||'',email:p.email||'',sim:p.sim||'',photo:p.photo||'',age_category:p.ageCategory||p.age_category||'',guardian_num:p.guardianNum||p.guardian_num||'',status:p.status||'Green',lab_results:p.labResults||p.lab_results||[],prescriptions:p.prescriptions||[],doctor_notes:p.doctorNotes||p.doctor_notes||'',online:!!p.online,active:p.active!==false}));
          if(rows.length){const r=await client.from('patients').upsert(rows,{onConflict:'id'});if(r.error)throw r.error}
          const keep=new Set(a.map(p=>String(p.id))),del=old.filter(p=>!keep.has(String(p.id))).map(p=>String(p.id));
          if(del.length&&role==='admin'){const r=await client.from('patients').delete().in('id',del);if(r.error)throw r.error}
        }
      }else if(k===K.S&&role==='admin'){
        const rows=a.map(s=>({id:String(s.id),user_id:s.user_id||null,name:s.name||s.fullName||'',email:s.email||'',role_title:s.role||s.role_title||'',task:s.task||'',available:s.available!==false,schedule:s.schedule||'',active:s.active!==false}));
        if(rows.length){const r=await client.from('staff').upsert(rows,{onConflict:'id'});if(r.error)throw r.error}
      }else if(k===K.B){
        const rows=a.map(x=>({legacy_id:String(x.id),patient_id:String(x.patientId||x.patient_id||''),patient_name:x.patientName||x.patient_name||'',doctor:x.doctor||'',appointment_date:x.date||x.appointment_date||null,reason:x.reason||'',status:x.status||'Pending Approval',created_by:user.id}));
        if(rows.length){const r=await client.from('appointments').upsert(rows,{onConflict:'legacy_id'});if(r.error)throw r.error}
      }else if(k===K.N&&role==='admin'){
        const rows=a.map(x=>({legacy_id:String(x.id),body:x.text||x.body||'',photo:x.photo||'',published_on:x.date||x.published_on||null,created_by:user.id}));
        if(rows.length){const r=await client.from('announcements').upsert(rows,{onConflict:'legacy_id'});if(r.error)throw r.error}
      }else if(k===K.C){
        for(const x of a){if(!x.message&&!x.text)continue;const r=await client.from('help_center_messages').upsert({legacy_id:String(x.id||crypto.randomUUID()),user_id:x.user_id||user.id,full_name:x.fullName||x.full_name||currentSession?.data?.fullName||currentSession?.data?.name||'',email:x.email||user.email||'',message:x.message||x.text||'',admin_reply:x.reply||x.admin_reply||'',status:x.status||'New'},{onConflict:'legacy_id'});if(r.error)throw r.error}
      }else if(k===K.L){
        const seen=new Set(old.map(x=>String(x.timestamp)+'|'+String(x.text)));
        for(const x of a.filter(x=>!seen.has(String(x.timestamp)+'|'+String(x.text)))){const r=await client.from('activity_logs').insert({actor_id:user.id,event_text:String(x.text||'Activity')});if(r.error)throw r.error}
      }
    }catch(e){err('write '+k,e);window.dispatchEvent(new CustomEvent('erecpass-cloud-error',{detail:{key:k,message:e.message||String(e)}}))}
  }
  window.epStore={getItem(k){return cache.has(String(k))?cache.get(String(k)):null},setItem(k,v){k=String(k);const old=cache.get(k)??null,n=String(v);cache.set(k,n);if(!loading&&![K.X,K.A,K.G,K.E].includes(k)){queue=queue.then(()=>persist(k,old,n)).catch(e=>err('write queue',e))}},removeItem(k){k=String(k);const old=cache.get(k);cache.delete(k);if(k!==K.X&&old!==undefined&&!loading)queue=queue.then(()=>persist(k,old,'[]')).catch(e=>err('remove',e))},clear(){cache.clear()},key(i){return [...cache.keys()][i]??null},get length(){return cache.size},_put:put};
  window.erecpassCloudHydrate=hydrate;
  const profileFor=async u=>{const r=await sb().from('profiles').select('id,full_name,role,active').eq('id',u.id).single();if(r.error)throw r.error;if(r.data.active===false)throw Error('This account is deactivated');return r.data};
  window.handleRegister=async function(e){
    e?.preventDefault();const fullName=document.getElementById('regFullName')?.value.trim(),email=document.getElementById('regEmail')?.value.trim().toLowerCase(),sim=document.getElementById('regSim')?.value.trim(),code=document.getElementById('regVerifyCode')?.value.trim(),password=document.getElementById('regPassword')?.value||'',confirm=document.getElementById('regConfirmPassword')?.value||'';
    if(!fullName||!email||!password){alert('Complete the required fields.');return}
    if(typeof tempSimCode!=='undefined'&&code!==String(tempSimCode)){alert('Please verify the SMS code first.');return}
    if(password!==confirm){alert('Passwords do not match!');return}if(!/[#!?]/.test(password)){alert('Password must contain at least one symbol: # ! ?');return}
    try{const r=await sb().auth.signUp({email,password,options:{data:{full_name:fullName,sim,role:'patient'}}});if(r.error)throw r.error;if(r.data.session){await hydrate();hideAuthPages();launchPortalByRole('patient');alert('Account created and connected to Supabase.')}else{showLogin();alert('Registration submitted. Confirm your email, then log in.')}}catch(x){alert(x.message||'Registration failed')}
  };
  window.handleLogin=async function(e){e?.preventDefault();const email=document.getElementById('loginEmail')?.value.trim().toLowerCase(),password=document.getElementById('loginPassword')?.value||'';try{const r=await sb().auth.signInWithPassword({email,password});if(r.error)throw r.error;const p=await profileFor(r.data.user);if(p.role!=='patient'){await sb().auth.signOut();throw Error('This account is not a patient account')}await hydrate();if(currentSession?.data?.active===false){await sb().auth.signOut();throw Error('This patient account is deactivated')}hideAuthPages();launchPortalByRole('patient')}catch(x){alert(x.message||'Login failed')}};
  window.handleStaffLogin=async function(e){e?.preventDefault();const email=document.getElementById('staffLoginName')?.value.trim().toLowerCase(),password=document.getElementById('staffLoginPassword')?.value||'';if(!email?.includes('@')){alert('Enter the staff email address in this field.');return}try{const r=await sb().auth.signInWithPassword({email,password});if(r.error)throw r.error;const p=await profileFor(r.data.user);if(p.role!=='staff'){await sb().auth.signOut();throw Error('This account does not have the staff role')}await hydrate();if(currentSession?.data?.active===false){await sb().auth.signOut();throw Error('This staff account is deactivated')}hideAuthPages();launchPortalByRole('staff')}catch(x){alert(x.message||'Staff login failed')}};
  window.handleAdminLogin=async function(e){e?.preventDefault();const email=document.getElementById('adminLoginUser')?.value.trim().toLowerCase(),password=document.getElementById('adminLoginPassword')?.value||'';if(!email?.includes('@')){alert('Enter the admin email address, not the old local username.');return}try{const r=await sb().auth.signInWithPassword({email,password});if(r.error)throw r.error;const p=await profileFor(r.data.user);if(p.role!=='admin'){await sb().auth.signOut();throw Error('Admin role has not been assigned to this account in Supabase')}await hydrate();hideAuthPages();launchPortalByRole('admin')}catch(x){alert(x.message||'Admin login failed')}};
  window.logout=async function(){try{if(sb())await sb().auth.signOut()}catch(e){err('sign out',e)}if(channel&&sb())await sb().removeChannel(channel);channel=null;user=null;role='anon';currentSession=null;put(K.X,null);[K.P,K.S,K.A,K.N,K.B,K.C,K.L].forEach(k=>put(k,[]));['patientApp','staffApp','adminApp'].forEach(id=>document.getElementById(id)?.classList.add('hidden'));showLogin()};
  const oldOnload=window.onload;window.onload=async function(e){try{await hydrate()}catch(x){err('startup',x)}if(typeof oldOnload==='function')return oldOnload.call(this,e)};
  document.addEventListener('DOMContentLoaded',()=>{const i=document.getElementById('staffLoginName');if(i){i.type='email';i.placeholder='Enter staff email'}const l=document.querySelector('#staffLoginForm label');if(l)l.textContent='Staff Email';const a=document.getElementById('adminLoginUser');if(a)a.placeholder='admin@example.com'});
  window.addEventListener('erecpass-cloud-error',e=>console.error('Cloud save failed:',e.detail));
})();
