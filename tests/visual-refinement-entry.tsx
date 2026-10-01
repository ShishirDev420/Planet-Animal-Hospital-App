// Isolated synthetic UI state. No patient records, provider calls or writes.
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { CareReviewProvider } from '../src/lib/care/client';
import { emptyState, type Milestone } from '../src/lib/care/domain';
import CareAssistant from '../src/components/CareAssistant';
import RoadmapProgress from '../src/components/RoadmapProgress';
import '../src/index.css';
const mode = new URLSearchParams(location.search).get('mode');
let attempts = 0;
const ids: unknown[] = [];
Object.assign(window, { fixtureRequests: ids });
const requestService = async (body?: Record<string, unknown>) => {
  if (body) { ids.push(body.requestId); await new Promise(resolve => setTimeout(resolve, 300)); if (++attempts === 1) throw Error('Synthetic service unavailable.'); }
  return { configured: true, allowance: { dailyRemaining: mode === 'quota' ? 0 : 4, dailyLimit: 5, monthlyRemaining: 19, monthlyLimit: 20 }, draft: { summary: 'Synthetic response for interface verification only.', discussionTopics: [{ question: 'Synthetic question for the visit.', sourceId: null }], uncertainty: ['No clinical instructions generated.'] } };
};
function Review() {
  const [petId, setPetId] = useState('primary'), [retries, setRetries] = useState(0);
  const state = emptyState('fixture-parent', 'Fixture Pet');
  state.pets.push({id:'second',name:'Second Fixture Pet'});
  if (!['empty','error','loading'].includes(mode || '')) state.milestones = ['completed','approved','exempt'].map((status, index) => ({id:`step-${index}`,petId:'primary',title:`Synthetic recorded step ${index}`,instructions:'Synthetic fixture only.',sourceRef:'fixture',approvedBy:'fixture-vet',approvedAt:1,windowStart:null,dueAt:null,reminderAt:null,ruleId:'fixture',rule:{points:0,creditPaise:0},configVersion:'fixture',status,booking:{status:'none'}} as Milestone));
  return <main style={{maxWidth:1040,margin:'auto',padding:18,color:'white'}}><p>Isolated synthetic UI fixture</p><output aria-label="Retries">{retries}</output><CareReviewProvider value={{state,petId,setPetId,role:'parent',config:null,loading:mode==='loading',error:mode==='error'?'Synthetic error':'',refresh:async()=>{setRetries(n=>n+1);},command:async()=>{throw Error('Writes are disabled');}}}><RoadmapProgress/><div style={{height:24}}/><CareAssistant requestService={requestService}/></CareReviewProvider></main>;
}
createRoot(document.getElementById('root')!).render(<Review/>);

