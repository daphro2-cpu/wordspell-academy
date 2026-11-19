// Small picture clues use a scene when one object would suggest the wrong meaning.
const drawn=new Set('cat mat map bed pen pin pig pot cup sun fan van cake kite home moon mop nap man bun bud men pet net pan tin peg pit pug hop hat hut cop dot pop pup run sat fit met cut'.split(' '));
const storybook=['sit','cap','bats','clip','hot','met','pat','bat','sip','zip','gap','ship','shop','fish','chip','chop','chin','thin','phone','graph','ring','sing','fang','ran','rang','lids','seeds','puff','cliff','miss','kiss','hill','ball','wall','doll','duck'];
const supplements=[["cot", "ten", "den", "thick", "this", "that", "long", "sin", "ham", "jam", "ram", "hats", "huff", "gaff", "doff", "tiff", "pass", "chess", "boss", "muss", "bell", "fill", "gull", "tall", "roll", "toll", "back", "black", "neck", "sick", "rock", "sock", "catch", "match", "fetch", "hutch"], ["etch", "witch", "blotch", "badge", "edge", "ridge", "lodge", "fudge", "bridge", "tape", "gate", "these", "theme", "pete", "bike", "time", "rope", "bone", "cube", "cute", "mule", "flute", "rule", "rain", "train", "day", "play", "green", "seed", "team", "beach", "me", "light", "night", "pie", "tie"], ["boat", "coat", "snow", "grow", "few", "crew", "flew", "cue", "clue", "fruit", "suit", "food", "pool", "soon", "book", "look", "cook", "foot", "flag", "flap", "clap", "glad", "glass", "plan", "plant", "block", "slip", "sled", "crab", "crack", "grab", "grin", "frog", "dress", "drum", "trap"], ["trip", "brick", "press", "spin", "spot", "step", "stop", "skip", "skin", "scab", "smell", "snack", "snap", "swim", "splash", "split", "spring", "spray", "scrub", "scrap", "strip", "string", "strap", "stretch", "skate", "plane", "slide", "float", "brave", "trail", "dream", "sleep", "smile", "spoon", "stove", "stripe"], ["street", "scrape", "spruce", "yes", "yell", "yard", "yellow", "my", "fly", "sky", "dry", "shy", "happy", "baby", "bunny", "puppy", "candy"]];
export function reviewPicture(word) {
  const key=word.toLowerCase();
  const index=storybook.indexOf(key);
  if(index!==-1)return {atlas:true,x:(index%6)*20,y:Math.floor(index/6)*20};
  if(drawn.has(key))return {src:'./assets/review/'+key+'.webp'};
  if(key==='cats')return {src:'./assets/review/cat.webp'};
  if(key==='beds')return {src:'./assets/review/bed.webp'};
  if(key==='sang')return {atlas:true,x:60,y:60};
  for(let sheet=0;sheet<supplements.length;sheet++){const i=supplements[sheet].indexOf(key);if(i!==-1)return {atlas:true,sheet:'./assets/word-clues-'+(sheet+1)+'.webp',x:(i%6)*20,y:Math.floor(i/6)*20};}
  return null;
}
