export const VOICE_GOAL=60;
export const VOICE_HOLD_MS=1500;
export const voiceLevel=rms=>Math.min(100,Math.max(0,rms)*1800);
// A continuous hold at the visible star is the only microphone pass condition.
export class VoiceHold{
 constructor({rearmAfterPass=false}={}){this.rearmAfterPass=rearmAfterPass;this.reset();}
 reset(requireQuiet=false){this.held=0;this.quiet=0;this.waitForQuiet=requireQuiet;}
 feed(level,ms){
  if(!Number.isFinite(level)||!Number.isFinite(ms)||ms<=0){this.reset(this.waitForQuiet);return false;}
  if(this.waitForQuiet){
   this.quiet=level<25?this.quiet+ms:0;
   if(this.quiet>=300)this.reset();
   return false;
  }
  this.held=level>=VOICE_GOAL?this.held+ms:0;
  if(this.held<VOICE_HOLD_MS)return false;
  this.reset(this.rearmAfterPass);return true;
 }
}
