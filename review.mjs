// Small picture clues use a scene when one object would suggest the wrong meaning.
const drawn=new Set('cat mat map bed pen pin pig pot cup sun fan van cake kite home moon mop nap man bun bud men pet net pan tin peg pit pug hop hat hut cop dot pop pup run sat fit met cut'.split(' '));
const storybook=['sit','cap','bats','clip','hot','met','pat','bat','sip','zip','gap','ship','shop','fish','chip','chop','chin','thin','phone','graph','ring','sing','fang','ran','rang','lids','seeds','puff','cliff','miss','kiss','hill','ball','wall','doll','duck'];
export function reviewPicture(word) {
  const key=word.toLowerCase();
  const index=storybook.indexOf(key);
  if(index!==-1)return {atlas:true,x:(index%6)*20,y:Math.floor(index/6)*20};
  if(drawn.has(key))return {src:'./assets/review/'+key+'.webp'};
  if(key==='cats')return {src:'./assets/review/cat.webp'};
  if(key==='beds')return {src:'./assets/review/bed.webp'};
  if(key==='sang')return {atlas:true,x:60,y:60};
  return null;
}
