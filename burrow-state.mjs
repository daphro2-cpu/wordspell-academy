export const MOLE_MOVE_MS=450;
export const MOLE_RUMBLE_MS=600;
export const moleReadingMs={simple:3000,medium:2500,difficult:2000};

// Rotate only words still in play. Removing one word never restarts the others.
export class MoleCycle{
 constructor(order,level){
  this.order=[...order];this.readMs=moleReadingMs[level];this.cursor=0;
  this.slots=[];this.cooldowns=new Map();this.nextSpawn=0;
 }
 advance(now,removed=new Set()){
  const remaining=this.order.filter(index=>!removed.has(index));
  this.slots=this.slots.filter(slot=>{
   if(removed.has(slot.index))return false;
   if(now>=slot.until){this.cooldowns.set(slot.index,now+MOLE_MOVE_MS+250);return false;}
   return true;
  });
  if(!this.slots.length)this.nextSpawn=Math.min(this.nextSpawn,now);
  if(this.slots.length<Math.min(2,remaining.length)&&now>=this.nextSpawn){
   for(let attempt=0;attempt<this.order.length;attempt++){
    const index=this.order[this.cursor++%this.order.length];
    if(removed.has(index)||this.slots.some(slot=>slot.index===index)||(this.cooldowns.get(index)??0)>now)continue;
    this.slots.push({index,since:now+MOLE_RUMBLE_MS,until:now+MOLE_RUMBLE_MS+MOLE_MOVE_MS+this.readMs});
    this.nextSpawn=now+(MOLE_RUMBLE_MS+MOLE_MOVE_MS+this.readMs)/2;
    break;
   }
  }
  return new Set(this.slots.filter(slot=>now>=slot.since).map(slot=>slot.index));
 }
}
