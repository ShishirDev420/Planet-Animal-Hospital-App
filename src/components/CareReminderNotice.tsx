import { useCare } from '../lib/care/client';
import { useLocation, useNavigate } from 'react-router-dom';
export default function CareReminderNotice() {
 const {state,setPetId}=useCare(),navigate=useNavigate(),location=useLocation();
 const reminder=state?.reminders.find(r=>r.status==='available');
 const step=state?.milestones.find(m=>m.id===reminder?.milestoneId&&m.status==='approved');
 if(!step||location.pathname==='/roadmap')return null;
 return <aside role="status" className="mx-5 mt-4 rounded-xl border border-planet-yellow/25 bg-[#071912] p-3 text-white"><p className="text-sm">Pawlina · A recorded follow-up needs your attention.</p><button className="mt-2 text-sm font-semibold text-planet-yellow underline" onClick={()=>{setPetId(step.petId);navigate('/roadmap'+location.search);}}>Review {state?.pets.find(p=>p.id===step.petId)?.name}’s next step</button></aside>;
}
