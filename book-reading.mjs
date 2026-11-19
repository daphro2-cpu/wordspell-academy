// One sufficiently loud utterance, followed by a short pause, sends one book home.
// This measures volume only; the teacher judges whether the word was read correctly.
export class VoiceTurn{
 constructor(){this.reset();}
 reset(){this.voiced=0;this.quiet=0;this.ready=false;this.waitForQuiet=true;}
 feed(level,ms){
  if(this.waitForQuiet){this.quiet=level<22?this.quiet+ms:0;if(this.quiet>=300){this.waitForQuiet=false;this.quiet=0;}return false;}
  if(level>=60){this.voiced+=ms;this.quiet=0;if(this.voiced>=200)this.ready=true;}
  else if(level<25){this.quiet+=ms;if(this.ready&&this.quiet>=280){this.reset();return true;}if(this.quiet>450)this.voiced=0;}
  return false;
 }
}
export function createBookReader({onLevel,onRead,onStatus}){
 let stream,context,analyser,frame,token=0,last=0,enabled=false;
 const turn=new VoiceTurn();
 function stop(){token++;enabled=false;cancelAnimationFrame(frame);stream?.getTracks().forEach(t=>t.stop());context?.close().catch(()=>{});stream=null;context=null;analyser=null;onLevel(0);}
 async function start(){
  stop();const request=token;onStatus('Allow the microphone, then read the highlighted book aloud.');
  try{
   const media=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:false}});
   if(request!==token){media.getTracks().forEach(t=>t.stop());return;}
   stream=media;const AC=window.AudioContext??window.webkitAudioContext;context=new AC();await context.resume();
   analyser=context.createAnalyser();analyser.fftSize=1024;context.createMediaStreamSource(stream).connect(analyser);
   const samples=new Float32Array(analyser.fftSize);enabled=true;turn.reset();last=performance.now();onStatus('Read the highlighted word aloud. Reach the star, then pause.');
   function tick(now){
    if(!enabled||request!==token)return;
    const dt=Math.min(80,now-last);last=now;analyser.getFloatTimeDomainData(samples);
    let sum=0;for(const x of samples)sum+=x*x;
    const level=Math.min(100,Math.sqrt(sum/samples.length)*1800);onLevel(level);
    if(!document.hidden&&turn.feed(level,dt))onRead();
    frame=requestAnimationFrame(tick);
   }
   frame=requestAnimationFrame(tick);
  }catch(error){stop();onStatus(error.name==='NotAllowedError'?'Microphone access was not allowed. Choose Teacher check — no microphone, or allow access and start the microphone.':'No microphone available. Choose Teacher check — no microphone to continue.');}
 }
 return {start,stop,reset:()=>turn.reset(),get listening(){return enabled;}};
}
