// Each word returns on a staggered cycle; at most two moles are up together.
export function moleIsUp(elapsed,rank,count,level){
 const pace={simple:{up:4000,step:2400},medium:{up:3300,step:2000},difficult:{up:2800,step:1700}}[level];
 const start=400+rank*pace.step;
 return elapsed>=start&&(elapsed-start)%(count*pace.step)<pace.up;
}
