import {bookWords} from './bank.mjs?v=arcade1';

const soundNames={
  ts:'/ts/ as in cats',ds:'/dz/ as in beds','y-head':'/y/ as in yes',
  f:'/f/ as in puff',s:'/s/ as in miss',l:'/l/ as in bell',k:'/k/ as in duck',j:'/j/ as in badge',
  sh:'/sh/ as in ship',ch:'/ch/ as in chin',ng:'/ng/ as in ring',n:'/n/ as in fan',m:'/m/ as in ham',
  a:'short a',e:'short e',i:'short i',o:'short o',u:'short u',
  'long-a':'long a','long-e':'long e','long-i':'long i','long-o':'long o',
  yoo:'long u as in cube','oo-long':'oo as in moon','oo-short':'oo as in book',
  'th-voiced':'th as in this','th-unvoiced':'th as in thin',
  'y-i':'final y as in fly','y-e':'final y as in happy',
};
const longSounds={a_e:'long-a',ai:'long-a',ay:'long-a',e_e:'long-e',ee:'long-e',ea:'long-e',e:'long-e',i_e:'long-i',ie:'long-i',igh:'long-i',o_e:'long-o',oa:'long-o',ow:'long-o',ui:'oo-long'};
const yoo=new Set(['cube','cute','mule','few','cue','due','dew','new','knew','use','fuse','fume','huge']);
function entrySound(entry,book){
  const p=entry.pattern;
  if(book===2){
    if(entry.group==='finals')return {ff:'f',ss:'s',ll:'l',ck:'k',tch:'ch',dge:'j',all:'l','oll-long':'l','oll-short':'l'}[p]??p;
    if(p==='u_e'||p==='ue'||p==='ew')return yoo.has(entry.word.toLowerCase())?'yoo':'oo-long';
    return longSounds[p]??p;
  }
  return book===3&&['sc','sk'].includes(p)?'sk':book===1?({c:'k',ph:'f'}[p]??p):p;
}
const extra={
  1:{
    a:['a','bag rag tag wag cap tap gap lap nap bat fat hat rat sad mad pad dad jam ham ram fan man pan van tan can'],
    e:['e','hen ten men den net pet wet jet get leg peg red fed led beg gem yet set'],
    i:['i','big dig fig wig bin fin tin win hit bit fit kit lip dip rip sip zip lid kid hid'],
    o:['o','dog log fog jog top hop pop mop cop nod rod dot lot got sob job fox box'],
    u:['u','bug dug hug jug mug rug run fun bun nut hut bus tub rub mud bud gum hum sum pup'],
    sh:['sh','shop shut shed shell shin shock shack shrimp fresh brush flush'],
    ch:['ch','chin chop chat chest champ chick check chum lunch bunch rich much such'],
    'th-unvoiced':['th','thick thin thank theft tenth moth cloth bath math path'],
    'th-voiced':['th','this that them then than there these those'],
    ng:['ng','ring sing king wing bang hang rang sang long song strong sting swing bring spring'],
    n:['n','ran hen ten pin tin pan can man sun fun run bun rain train green'],
    m:['m','ham jam ram rim dim gum sum hum drum trim swim slam'],
    ts:['ts','cats bats hats mats pets nets jets pits sits pots dots huts cuts nuts'],
    ds:['ds','beds lids kids rods pads buds seeds beads weeds needs adds nods'],
  },
  2:{
    a_e:['a_e','name game same came made fade shade trade blade grade brave save wave cave lake bake take make rake shake brake snake grape shape flame frame plate skate space place'],
    ai:['ai','tail mail nail sail pail pain gain main chain brain grain drain plain stain snail trail wait bait paid paint faint saint waist'],
    ay:['ay','say may bay hay ray way pay lay stay tray clay gray spray stray sway away'],
    e_e:['e_e','these theme Pete eve'],
    e:['e','me he she we be'],
    ee:['ee','bee see fee tree free three feet meet need feed weed deep keep sleep sheep sweet street speed cheek wheel sweep'],
    ea:['ea','sea tea pea eat leaf read seat beat heat meat neat team dream cream steam stream clean mean lean bean reach teach peach'],
    i_e:['i_e','like line mine fine nine pine ride side wide hide bite site dive five hive life wife drive prize shine smile while white slide stripe'],
    ie:['ie','pie tie lie die cried dried fried tried tied spied'],
    igh:['igh','high sigh thigh right might sight tight fight bright flight fright slight tonight'],
    o_e:['o_e','nose rose chose close note vote hole pole sole whole stone phone cone zone joke woke broke smoke drove stove globe slope hope'],
    oa:['oa','road toad load goal coal foam roam soap oak soak loaf toast float throat coach groan cloak'],
    ow:['ow','low slow show blow flow glow row sow tow bow throw below pillow window yellow shadow'],
    u_e:['u_e','cube cute mule use fuse fume huge flute rule tune prune rude crude'],
    ew:['ew','few dew new knew crew flew grew drew brew screw threw chew'],
    ue:['ue','cue due blue clue glue true Sue'],
    ui:['ui','fruit suit juice cruise bruise'],
    'oo-long':['oo','moon food pool soon room broom spoon noon zoo cool school tool stool roof boot tooth smooth goose loose shoot bloom gloom'],
    'oo-short':['oo','book look cook foot good hood wood stood wool shook took hook crook brook soot'],
    ff:['ff','puff huff cliff stiff sniff stuff fluff gruff off cuff scoff doff tiff gaff'],
    ss:['ss','miss kiss pass chess boss mess less dress press cross grass glass class toss fuss hiss loss'],
    ll:['ll','hill bell fill gull fell well tell sell shell yell spell smell still spill drill skill doll roll toll ball wall tall small'],
    ck:['ck','back black neck sick rock duck sock pack sack rack tack deck peck lock dock block clock kick lick pick quick stick trick thick truck stuck luck'],
    tch:['tch','catch match fetch hutch etch witch blotch patch hatch latch batch ditch pitch stitch switch sketch scratch stretch clutch'],
    dge:['dge','badge edge ridge lodge fudge bridge smudge grudge dodge judge budge ledge wedge hedge pledge fridge'],
  },
  3:{
    sl:['sl','slip sled slam slap slim slot slug slum slid slide sleep slope slow'],
    fl:['fl','flag flap flat flip flop fled flash flush flame flute float flow flight'],
    st:['st','step stop stem stick still stiff stamp stump stack stand stone stove stay steam street'],
    gr:['gr','grin grab grip grit grub grass grand grill gruff grape grade grain green grow'],
    cl:['cl','clip clap clam clan club clump clock cliff class clash clean clear clay close'],
    pl:['pl','plan plum plug plot plus plant plank plate plane plain play please'],
    bl:['bl','black block blot blend blink blank blast blade blame blue blow bloom'],
    br:['br','brag brim brick brush brass brand brave bride bridge brain bread bright brown'],
    tr:['tr','trap trim trip trot truck track trick trunk tray train trail tree treat true'],
    dr:['dr','drip drop drum drag dress drill drank drift drive dream drain drew'],
    sp:['sp','spin spit spot span spill spell spend spark spoke spine spoon sport'],
    sk:['sk','skin skip skid skim skill skate sky sketch skull skirt'],
    sm:['sm','smog smug smell small smart smile smoke smooth'],
    sn:['sn','snap snip snug snag sniff snuff snack snake snail snow'],
    spl:['spl','splash split splat splint splinter splendid'],
    spr:['spr','spring spray sprig sprint sprang spread sprout'],
    str:['str','strap strip strut string strong street straw stream stripe stretch'],
    scr:['scr','scrap scrub scram script screen scrape scratch screw'],
    'y-i':['y','fly sky dry shy try cry fry my spy sly why by apply reply'],
    'y-e':['y','happy bunny puppy baby candy sunny funny silly muddy fluffy lucky rocky rainy windy sleepy hungry sticky'],
  },
};

function normalizedSpelling(pattern){
  if(pattern.startsWith('oo-'))return 'oo';
  if(pattern.startsWith('th-'))return 'th';
  if(pattern.startsWith('y-'))return 'y';
  if(pattern.startsWith('oll-'))return 'oll';
  return pattern;
}
const all=[];
for(const [book,entries] of Object.entries(bookWords)){
  for(const entry of entries)all.push({...entry,word:entry.word.toLowerCase(),book:Number(book),sound:entrySound(entry,Number(book)),pattern:normalizedSpelling(entry.pattern),core:true});
}
for(const [book,patterns] of Object.entries(extra)){
  for(const [key,[pattern,words]] of Object.entries(patterns)){
    for(const word of words.split(' ')){
      const entry={word,pattern,book:Number(book),group:Number(book)===1?('aeiou'.includes(key)?'vowels':['ts','ds','ng','n','m'].includes(key)?'endings':'digraphs'):Number(book)===2?(['ff','ss','ll','ck','tch','dge'].includes(key)?'finals':['oo-long','oo-short'].includes(key)?'oo':pattern.endsWith('_e')?'magic':'teams'):(key.startsWith('y-')?'y':key.length===3?'three':'two')};
      entry.sound=key.startsWith('oo-')||key.startsWith('th-')?key:entrySound(entry,Number(book));
      if(Number(book)===1||key.startsWith('y-'))entry.sound=key;
      entry.pattern=normalizedSpelling(entry.pattern);
      if(!all.some(e=>e.book===entry.book&&e.word===word&&e.pattern===pattern))all.push(entry);
    }
  }
}
export const arcadeBank=all;
export const labelSound=key=>soundNames[key]??(key==='all'?'ending in ball':key==='short-o'?'vowel in doll':key);
export const labelPattern=key=>key.replace('_',' · ');
export function availableTopics(book,kind){
  const field=kind==='spelling'?'pattern':'sound';
  const entries=arcadeBank.filter(e=>e.book===Number(book));
  return [...new Set(entries.map(e=>e[field]))]
    .filter(key=>new Set(entries.filter(e=>e[field]===key).map(e=>e.word)).size>=3)
    .map(key=>({key,label:kind==='spelling'?labelPattern(key):labelSound(key)}));
}
export function practicePool(book,level){
  const entries=arcadeBank.filter(e=>e.book===Number(book));
  if(level==='difficult')return entries;
  const groups=Object.groupBy?Object.groupBy(entries,e=>e.pattern+'|'+e.sound):entries.reduce((a,e)=>{(a[e.pattern+'|'+e.sound]??=[]).push(e);return a;},{});
  return Object.values(groups).flatMap(group=>{
    const sorted=[...group].sort((a,b)=>Number(Boolean(b.core))-Number(Boolean(a.core))||a.word.length-b.word.length);
    return sorted.slice(0,level==='simple'?5:14);
  });
}
export function buildArcadeQuestion({book,level,kind,topic,game},choose){
  const ambiguous=new Set(['bow','sow','row','read','tune','new','knew','due','dew']);
  const pool=practicePool(book,level).filter(e=>kind==='spelling'||!ambiguous.has(e.word));
  const field=kind==='spelling'?'pattern':'sound';
  const targets=pool.filter(e=>e[field]===topic);
  const exemplar=targets[0];
  const sameDomain=entry=>{
    if(!exemplar)return false;
    if(kind==='spelling'&&Number(book)===3)return true;
    if(Number(book)===1)return entry.group===exemplar.group;
    if(Number(book)===2)return (entry.group==='finals')===(exemplar.group==='finals');
    return (entry.group==='y')===(exemplar.group==='y');
  };
  let other=pool.filter(sameDomain).filter(e=>e[field]!==topic&&!targets.some(t=>t.word===e.word));
  if(kind==='spelling'&&Number(book)===2){
    const sameSound=other.filter(e=>e.sound===exemplar?.sound);
    if(sameSound.length)other=sameSound;
  }
  if(!targets.length||!other.length)throw new Error('Choose another topic for this round.');
  const targetCount=game==='mole'?({simple:2,medium:3,difficult:4}[level]):({simple:3,medium:4,difficult:5}[level]);
  const matching=choose(targets,targetCount);
  const distractors=choose(other,game==='mole'?1:targetCount);
  const options=[...matching,...distractors].sort(()=>Math.random()-.5);
  return {options,position:Number(book)===1?(exemplar.group==='vowels'?'middle':exemplar.group==='endings'?'end':exemplar.group==='digraphs'?'anywhere':'start'):Number(book)===2?(exemplar.group==='finals'?'end':'vowel'):(exemplar.group==='y'?'final y':'start'),correct:new Set((game==='mole'?distractors:matching).map(e=>e.word)),field,topic};
}
