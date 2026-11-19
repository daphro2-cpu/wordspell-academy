let context,spinTimer;
const voices=new Set();
function engine(){
  const AudioContext=globalThis.AudioContext??globalThis.webkitAudioContext;
  if(!AudioContext)return null;
  context??=new AudioContext();
  context.resume().catch(()=>{});
  return context;
}
function note(frequency,duration=.1,type='sine',volume=.055){
  const ctx=engine();if(!ctx)return;
  const oscillator=ctx.createOscillator(),gain=ctx.createGain();
  oscillator.type=type;oscillator.frequency.value=frequency;
  gain.gain.setValueAtTime(volume,ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);
  oscillator.connect(gain);gain.connect(ctx.destination);
  voices.add(oscillator);
  oscillator.onended=()=>voices.delete(oscillator);
  oscillator.start();oscillator.stop(ctx.currentTime+duration);
}
export function stopSpinSound(){
  clearInterval(spinTimer);
  for(const voice of voices){try{voice.stop();}catch{}}
  voices.clear();
}
export function playSpinSound(){
  stopSpinSound();let tick=0;note(180,.15,'triangle');
  spinTimer=setInterval(()=>note(170+(tick++%5)*30,.045,'square',.018),65);
}
export function playReelStop(index){note(220+index*110,.15,'triangle',.07);}
export function playVoiceSuccess(){note(523,.2);setTimeout(()=>note(659,.2),100);setTimeout(()=>note(784,.3),200);}
