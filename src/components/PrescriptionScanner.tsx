import { useEffect, useRef } from 'react';
import PrescriptionWorkspace from './PrescriptionWorkspace';
import { useCare } from '../lib/care/client';
import { careButton } from './CareWorkflow';
export default function PrescriptionScanner({onClose}: {petName?:string;onClose:()=>void}) {
  const {state,petId}=useCare();
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{dialog.current?.showModal();},[]);
  return <dialog aria-label="Private prescription scanner" ref={dialog} onCancel={onClose} className="hide-scrollbar m-auto max-h-[95dvh] w-[calc(100%-1rem)] max-w-lg overflow-y-auto rounded-3xl border border-white/15 bg-[#071912] p-3 text-white backdrop:bg-black/70"><button className={careButton} onClick={onClose} aria-label="Close prescription scanner">Close</button><PrescriptionWorkspace key={String(state?.ownerUid)+':'+petId}/></dialog>;
}
