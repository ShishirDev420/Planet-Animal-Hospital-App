export type DeviceVoice = Pick<SpeechSynthesisVoice, 'lang' | 'name' | 'voiceURI' | 'localService' | 'default'>;
/** Stable ordering; never silently send clinical text to a remote voice service. */
export function selectDeviceVoice<T extends DeviceVoice>(voices: T[], language: string): T | undefined {
  const lang = language.toLowerCase(), base = lang.split('-')[0];
  return voices.filter(v => v.localService && v.lang.toLowerCase().split('-')[0] === base)
    .sort((a,b) => Number(b.lang.toLowerCase()===lang)-Number(a.lang.toLowerCase()===lang) || Number(b.default)-Number(a.default) || (a.voiceURI < b.voiceURI ? -1 : a.voiceURI > b.voiceURI ? 1 : 0))[0];
}
export function speechChunks(text: string): string[] {
  const words = text.trim().split(/\s+/), chunks: string[] = []; let part = '';
  for (const word of words) { if (part && part.length + word.length > 220) { chunks.push(part); part = ''; } part += (part ? ' ' : '') + word; }
  if (part) chunks.push(part); return chunks;
}
let activeStop: (() => void) | undefined;
export function claimSpeech(stop: () => void) { activeStop?.(); activeStop = stop; }
export function releaseSpeech(stop: () => void) { if(activeStop === stop) activeStop = undefined; }
