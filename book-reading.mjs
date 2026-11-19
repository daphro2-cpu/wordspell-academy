// One sufficiently loud utterance, followed by a short pause, sends one book home.
// This measures volume only; the teacher judges whether the word was read correctly.
export class VoiceTurn{
 constructor(){this.reset();}
 reset(){this.voiced=0;this.quiet=0;this.gap=0;this.ready=false;this.waitForQuiet=true;}
 feed(level,ms){
  if(!Number.isFinite(level)||!Number.isFinite(ms)||ms<=0){this.reset();return false;}
  if(this.waitForQuiet){this.quiet=level<22?this.quiet+ms:0;if(this.quiet>=300){this.waitForQuiet=false;this.quiet=0;}return false;}
  if(level>=60){this.gap=0;this.voiced+=ms;this.quiet=0;if(this.voiced>=200)this.ready=true;}
  else{
   this.gap+=ms;
   if(!this.ready&&this.gap>120)this.voiced=0;
   this.quiet=level<25?this.quiet+ms:0;
   if(this.ready&&this.quiet>=350){this.reset();return true;}
  }
  return false;
 }
}
export function createBookReader({onLevel,onRead,onStatus,canRead=()=>true}){
 let stream,context,analyser,frame,token=0,last=0,enabled=false;
 const turn=new VoiceTurn();
 function stop(){token++;enabled=false;cancelAnimationFrame(frame);stream?.getTracks().forEach(t=>t.stop());context?.close().catch(()=>{});stream=null;context=null;analyser=null;onLevel(0);}
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
   const samples=new Float32Array(analyser.fftSize);enabled=true;turn.reset();last=performance.now();onStatus('Read the highlighted word aloud. Reach the star, then pause.');
   function tick(now){
    if(!enabled||request!==token)return;
    const dt=Math.min(80,now-last);last=now;analyser.getFloatTimeDomainData(samples);
    let sum=0;for(const x of samples)sum+=x*x;
    const level=Math.min(100,Math.sqrt(sum/samples.length)*1800);
    const eligible=!document.hidden&&track.readyState==='live'&&track.enabled&&!track.muted&&canRead();
    onLevel(eligible?level:0);
    if(!eligible)turn.reset();
    else if(turn.feed(level,dt))onRead();
    frame=requestAnimationFrame(tick);
   }
   frame=requestAnimationFrame(tick);
  }catch(error){stop();onStatus(error.name==='NotAllowedError'?'Microphone access was not allowed. Choose Teacher check — no microphone, or allow access and start the microphone.':'No microphone available. Choose Teacher check — no microphone to continue.');}
 }
 return {start,stop,reset:()=>turn.reset(),get listening(){return enabled;}};
}
