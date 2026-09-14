import test from 'node:test';
import assert from 'node:assert/strict';
import {selectDeviceVoice,speechChunks,claimSpeech,releaseSpeech} from '../src/lib/deviceSpeech.ts';
test('voice selection is local, language-appropriate and stable across asynchronous ordering',()=>{
 const a={name:'A',voiceURI:'a',lang:'en-US',localService:true,default:true},b={...a,name:'B',voiceURI:'b',lang:'en-IN',default:false},remote={...b,voiceURI:'0',localService:false};
 assert.equal(selectDeviceVoice([a,remote,b],'en-IN'),b); assert.equal(selectDeviceVoice([b,a],'en-IN'),b);
 assert.equal(selectDeviceVoice([remote],'en-IN'),undefined);assert.equal(selectDeviceVoice([a],'hi-IN'),undefined);assert.equal(selectDeviceVoice([],'en'),undefined);
});
test('only one component owns playback; obsolete cleanup cannot release the current owner',()=>{
 let first=0,second=0; const a=()=>first++,b=()=>second++;
 claimSpeech(a);claimSpeech(b);assert.equal(first,1);releaseSpeech(a);claimSpeech(a);assert.equal(second,1);releaseSpeech(a);
});
test('short chunks preserve the complete advice in order without duplicating words',()=>{
 const text='Veterinarian-approved follow-up instructions. '.repeat(30).trim();const chunks=speechChunks(text);
 assert.ok(chunks.length>1);assert.equal(chunks.join(' '),text);assert.ok(chunks.every(x=>x.length<=220));
});
