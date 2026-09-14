import type { CareState } from './domain';
import { clinicalContext, type PetDetails } from './clinical';

export type ExportSelection = { profile: boolean; history: boolean; prescriptions: boolean; approvedCare: boolean };
/** Pure local export: no network, account tokens, parent identity, wallet, other pets or AI drafts. */
export function buildPetContextExport(state: CareState, petId: string, details: PetDetails, selection: ExportSelection, now: number): string {
  const c = clinicalContext(state,petId,details,now);
  const lines = ['Planet Animal Hospital — selected pet context', `Pet: ${c.pet.name}`, `Exported: ${new Date(now).toISOString()}`, 'Parent-selected copy for personal use. This export is not new clinical advice. Missing fields are unknown.'];
  if (selection.profile) lines.push('\nPARENT-REPORTED PROFILE', ...Object.entries(details).map(([k,v]) => `${k}: ${v || 'Not provided'}`));
  if (selection.history) lines.push('\nPARENT-REPORTED HISTORY', c.pet.history ? JSON.stringify(c.pet.history,null,2) : 'No history recorded.', ...c.parentUpdates.map(u => `${new Date(u.at).toISOString()}: ${u.text}`));
  if (selection.prescriptions) lines.push('\nUNVERIFIED PRESCRIPTION TRANSCRIPTIONS — confirm with the veterinarian', ...c.prescriptions.map(p => `Revision ${p.revision}\n${typeof p.text === 'string' ? p.text : JSON.stringify(p.text,null,2)}`));
  if (selection.approvedCare) lines.push('\nRECORDED VETERINARIAN-APPROVED CARE', ...c.recordedCare.map(m => `${m.title}\n${m.instructions}\nStatus: ${m.status}; recorded due date: ${m.dueAt ? new Date(m.dueAt).toISOString() : 'Not recorded'}`));
  lines.push('\nIf you use this in ChatGPT or Gemini, treat its answer as a discussion draft. Ask your veterinarian to assess it. It does not update, approve or book care in the hospital app.');
  return lines.join('\n');
}
