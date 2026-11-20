import {VoiceHold,voiceLevel} from './voice-hold.mjs?v=reading15';
// Shared detected-voice duration rule; one pass returns one book.
export class VoiceTurn extends VoiceHold{constructor(){super({rearmAfterPass:true});}}
export function createBookReader({onLevel,onRead,onStatus,onProgress=()=>{},canRead=()=>true}){
 let stream,context,analyser,frame,token=0,last=0,enabled=false;
 const turn=new VoiceTurn();
 function stop(){token++;enabled=false;cancelAnimationFrame(frame);stream?.getTracks().forEach(t=>t.stop());context?.close().catch(()=>{});stream=null;context=null;analyser=null;onLevel(0);onProgress(0);}
 async function start(){
  stop();const request=token;onStatus('Allow the microphone, then read the highlighted book aloud.');
  try{
   const media=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:false}});
   if(request!==token){media.getTracks().forEach(t=>t.stop());return;}
   stream=media;
   const track=stream.getAudioTracks()[0];
   if(!track||track.readyState==='ended')throw new Error('No active microphone');
   track.onended=()=>{if(request===token){stop();onStatus('Microphone disconnected. No books will move. Reconnect it or choose Teacher check — no microphone.');}};
   const AC=window.AudioContext??window.webkitAudioContext;context=new AC();await context.resume();
   analyser=context.createAnalyser();analyser.fftSize=1024;context.createMediaStreamSource(stream).connect(analyser);
   const samples=new Float32Array(analyser.fftSize);enabled=true;turn.reset();last=performance.now();onStatus('Read the highlighted word aloud.');
   function tick(now){
    if(!enabled||request!==token)return;
    const dt=Math.min(80,now-last);last=now;analyser.getFloatTimeDomainData(samples);
    let sum=0;for(const x of samples)sum+=x*x;
    const level=voiceLevel(Math.sqrt(sum/samples.length));
    const eligible=!document.hidden&&track.readyState==='live'&&track.enabled&&!track.muted&&canRead();
    onLevel(eligible?level:0);
    if(!eligible)turn.reset(true);
    else if(turn.feed(level,dt))onRead();
    onProgress(turn.held);
    frame=requestAnimationFrame(tick);
   }
   frame=requestAnimationFrame(tick);
  }catch(error){stop();onStatus(error.name==='NotAllowedError'?'Microphone access was not allowed. Choose Teacher check — no microphone, or allow access and start the microphone.':'No microphone available. Choose Teacher check — no microphone to continue.');}
 }
 return {start,stop,reset:()=>turn.reset(true),get listening(){return enabled;}};
}
