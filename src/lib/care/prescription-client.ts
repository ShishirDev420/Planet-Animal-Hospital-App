import { auth } from '../firebase';
export async function prescriptionRequest(body?: Record<string,unknown>, query='', progress?: (n:number)=>void): Promise<any> {
  const user=auth.currentUser;if(!user)throw new Error('Sign in to use private prescriptions.');
  const token=await user.getIdToken();
  return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();xhr.open(body?'POST':'GET',`/api/prescriptions${query}`);xhr.timeout=60000;
    xhr.setRequestHeader('Authorization',`Bearer ${token}`);
    if(body)xhr.setRequestHeader('Content-Type','application/json');
    xhr.upload.onprogress=e=>{if(e.lengthComputable)progress?.(Math.round(e.loaded/e.total*100));};
    xhr.onerror=()=>reject(new Error('Upload connection failed. Retry with the same image.'));
    xhr.ontimeout=()=>reject(new Error('The service timed out. Retry with the same image to recover its saved status.'));
    xhr.onload=()=>{
      if(auth.currentUser?.uid!==user.uid)return reject(new Error('Account changed. Reopen prescriptions.'));
      try{const data=JSON.parse(xhr.responseText);if(xhr.status>=400)reject(new Error(data.error||'Prescription service unavailable.'));else resolve(data);}catch{reject(new Error('Prescription service unavailable.'));}
    };
    xhr.send(body?JSON.stringify(body):null);
  });
}
export async function prescriptionSource(id:string,ownerUid:string) {
  const user=auth.currentUser;if(!user)throw new Error('Sign in to view this source.');
  const response=await fetch(`/api/prescriptions?id=${encodeURIComponent(id)}&ownerUid=${encodeURIComponent(ownerUid)}`,{headers:{Authorization:`Bearer ${await user.getIdToken()}`}});
  if(!response.ok)throw new Error('Source unavailable or expired.');
  const blob=await response.blob();
  if(auth.currentUser?.uid!==user.uid)throw new Error('Account changed.');
  return blob;
}
