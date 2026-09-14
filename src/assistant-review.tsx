import GeneralCareGuide from './components/GeneralCareGuide';
// Explicit synthetic UI fixture; never imported by the app or sent to a provider.
import {createRoot} from 'react-dom/client';
import {useEffect,useState} from 'react';
import {MotionConfig} from 'framer-motion';
import {CareReviewProvider} from './lib/care/client';
import CareAssistant from './components/CareAssistant';
import {emptyState} from './lib/care/domain';
import './index.css';
let attempts=0;const ids:string[]=[];
const requestService=async(body?:Record<string,unknown>)=>{if(body){ids.push(String(body.requestId));if(++attempts===1)throw Error('Synthetic provider unavailable. Retry this question.');}return{allowance:{dailyRemaining:4,dailyLimit:5,monthlyRemaining:19,monthlyLimit:20},draft:{summary:'Synthetic record: the follow-up date is missing. Contact the hospital to clarify the record.',discussionTopics:[{question:'Could the hospital confirm the written follow-up date?',sourceId:null}],uncertainty:['No treatment or date has been generated.']}};};
function Review(){const [metrics,setMetrics]=useState(''),[petId,setPet]=useState('primary');const state=emptyState('synthetic-parent','Synthetic Pet');state.pets.push({id:'second',name:'Second Synthetic Pet'});useEffect(()=>{const t=setInterval(()=>setMetrics(`Viewport ${document.documentElement.clientWidth}; content ${document.documentElement.scrollWidth}; requests ${ids.length}; unique request IDs ${new Set(ids).size}`),500);return()=>clearInterval(t);},[]);return <div className="p-4 text-white bg-[#071912] min-h-screen"><p className="text-xs mb-3">Synthetic review only. No patient data, provider calls or wallet writes. Reduced motion forced.</p><p className="text-xs mb-3" role="status">{metrics}</p><button className="p-3 border rounded-xl mb-3" onClick={()=>setPet(p=>p==='primary'?'second':'primary')}>Switch synthetic pet</button><CareReviewProvider value={{state,petId,setPetId:setPet,role:'parent',config:null,loading:false,error:'',refresh:async()=>{},command:async()=>{}}}><MotionConfig reducedMotion="always"><GeneralCareGuide key={petId}/><CareAssistant requestService={requestService}/></MotionConfig></CareReviewProvider></div>;}
const width=new URLSearchParams(location.search).get('reviewWidth');createRoot(document.getElementById('root')!).render(width?<iframe title="Contained review" src="/assistant-review.html" style={{width:Number(width),height:900,border:0}}/>:<Review/>);
