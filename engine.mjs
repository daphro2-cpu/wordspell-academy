import {bookWords, labels} from './bank.mjs';

export const modes = [
  {id:'listen', title:'Echo Tower', skill:'Hear & identify', description:'Listen closely and choose the sound you hear.', icon:'◖))', color:'mint'},
  {id:'blend', title:'Blend Bridge', skill:'Blend & read', description:'Spin a word. Say its sounds and read it aloud.', icon:'a+b', color:'peach'},
  {id:'segment', title:'Sound Potions', skill:'Segment sounds', description:'Listen and place one sound tile in each potion slot.', icon:'⋮', color:'lilac'},
  {id:'spell', title:'Spelling Forge', skill:'Build & spell', description:'Tap letters to spell the word.', icon:'a_e', color:'gold'},
  {id:'sort', title:'The Sorting Hall', skill:'Read & sort patterns', description:'Send each word to its matching spelling or sound group.', icon:'↔', color:'rose'},
  {id:'context', title:'Sentence Quest', skill:'Read in context', description:'Find words with the right sound or spelling to bring a story back.', icon:'···', color:'blue'},
];

export const levels={
  simple:{title:'Simple', count:6, options:2, rank:0, hint:'2 choices · extra cues'},
  medium:{title:'Medium',count:8,options:3,rank:1,hint:'3 choices · less support'},
  difficult:{title:'Difficult',count:10,options:4,rank:2,hint:'Closer choices · full alphabet in spelling'},
};

const vowelSound={
  a_e:'long a',ai:'long a',ay:'long a',
  e_e:'long e',e:'long e',ee:'long e',ea:'long e',
  i_e:'long i',ie:'long i',igh:'long i',
  o_e:'long o',oa:'long o',ow:'long o',
  ui:'long oo',
};
const yooWords = new Set(['cube','cute','mule','few','cue']);
const vowelPatterns = new Set(['a_e','e_e','i_e','o_e','u_e','ai','ay','ee','ea','igh','ie','oa','ow','ew','ue','ui','e']);

const spellings = {...labels,
  a_e:'a space e', e_e:'e space e', i_e:'i space e',o_e:'o space e',u_e:'u space e'
};

export function choiceLabel(key) {
  return spellings[key] ?? key;
}

const contrasts={
  1:{
    'a-e':['vowels','Short a vs. short e','a','e'],
    'e-i':['vowels','Short e vs. short i','e','i'],
    'o-u':['vowels','Short o vs. short u','o','u'],
    'n-ng':['endings','n, ng and m','n','ng','m'],
    'ts-ds':['endings','ts vs. ds','ts','ds'],
    'f-v':['pairs','f vs. v','f','v'],
    'p-b':['pairs','p vs. b','p','b'],
    't-d':['pairs','t vs. d','t','d'],
    'c-g':['pairs','c vs. g','c','g'],
    's-z':['pairs','s vs. z','s','z'],
    'sh-ch':['digraphs','sh vs. ch','sh','ch'],
    'two-th':['digraphs','The two th sounds','th-voiced','th-unvoiced'],
  },
  2:{
    floss:['finals','FLOSS endings','ff','ll','ss'],
    'final-k-ch-j':['finals','ck, tch and dge','ck','tch','dge'],
    'all-oll':['finals','all vs. oll','all','oll-long','oll-short'],
  },
  3:{'final-y':['y','Final y','y-i','y-e']},
};

export function practiceContrasts(book) {
  return Object.fromEntries(Object.entries(contrasts[book]).map(([key,detail])=>[key,detail[1]]));
}

export function matchFocus(book,group,entry) {
  if(group==='all') return true;
  const contrast=contrasts[book][group];
  return contrast ? entry.group===contrast[0]&&contrast.slice(2).includes(entry.pattern) : entry.group===group;
}

function soundKey(book,e) {
  if (book===1) {
    if (e.group==='vowels') return 'short '+e.pattern;
    if (e.group==='endings') return e.pattern;
    if (e.pattern==='ph') return 'f';
    if (e.pattern==='ng') return 'ng';
    return e.pattern;
  }
  if (book===2) {
    if (e.group==='finals') return {ff:'f as in puff',ss:'s as in miss',ll:'l as in hill',all:'l as in hill','oll-long':'l as in hill','oll-short':'l as in hill',ck:'k as in back',tch:'ch as in catch',dge:'j as in badge'}[e.pattern];
    if (e.group==='oo') return e.pattern;
    return vowelSound[e.pattern] ?? (yooWords.has(e.word) ? 'yoo as in cube':'long oo as in moon');
  }
  if (e.group==='y') return e.pattern;
  if (['sc','sk'].includes(e.pattern)) return 'sc / sk';
  return e.pattern;
}

function groupPrompt(book,e) {
  if (book===1) return {
    vowels:'What sound is in the middle?',
    pairs:'What sound comes first?',
    digraphs:'Which sound do you hear?',
    endings:'What do you hear at the end?',
  }[e.group];
  if (book===2) return e.group==='finals' ? 'What do you hear at the end?' : 'Which sound do you hear?';
  return e.group==='y' ? 'What sound does y make?' : 'What do you hear at the start?';
}

function patternKey(book,e) {
  if (book===1 && e.group==='vowels') return 'short '+e.pattern;
  return e.pattern;
}

function ruleExplanation(book,e) {
  const p=e.pattern;
  if (book===1 && p==='ds') return 'The ending in '+e.word+' has /d/ followed by /z/.';
  if (book===1 && p==='ts') return 'The ending in '+e.word+' has /t/ followed by /s/.';
  if (p==='ng') return 'The letters ng work together to spell one sound.';
  if (p==='th-voiced') return 'Feel the voice buzz on the th sound, as in this.';
  if (p==='th-unvoiced') return 'Let air flow on the th sound, as in thin.';
  if (p==='all') return 'Read '+e.word+' in the -all family, like ball.';
  if (p==='oll-long') return 'This -oll word has long o, as in roll.';
  if (p==='oll-short') return 'Doll uses -oll with the short-o sound in American English.';
  if (['ff','ss','ll'].includes(p)) return 'The two final letters '+p+' spell one sound after the short vowel.';
  if (['ck','tch','dge'].includes(p)) return p+' spells the last sound after the short vowel in '+e.word+'.';
  if (p.endsWith('_e')) return 'Say '+p[0].toUpperCase()+' space E. The vowel and final e work together in '+e.word+'.';
  if (p==='oo-long') return 'This oo spells the vowel in moon.';
  if (p==='oo-short') return 'This oo spells the vowel in book.';
  if (p==='y-head') return 'Y on the head: the first sound in yes.';
  if (p==='y-i') return 'Final y has the long i sound in '+e.word+'.';
  if (p==='y-e') return 'Final y has the long e sound in '+e.word+'.';
  if (book===3) return 'Say each consonant in '+p+' in order, then blend the whole word.';
  if (['ai','ui'].includes(p)) return p+' is in the middle of '+e.word+'.';
  if (['ay','ue','ew'].includes(p)) return p+' is at the end of '+e.word+'.';
  return 'Look for '+choiceLabel(patternKey(book,e))+' in '+e.word+'.';
}

export function shuffle(a,rng=Math.random) {
  const out=[...a];
  for(let i=out.length-1;i>0;i--) {
    const j=Math.floor(rng()*(i+1));
    [out[i],out[j]]=[out[j],out[i]];
  }
  return out;
}

function uniqueWords(words) {
  return [...new Map(words.map(e=>[e.word.toLowerCase(),e])).values()];
}
function comparable(book,e,all) {
  if (book===1 && e.group==='vowels') return all.filter(x=>x.group==='vowels');
  return all.filter(x=>x.group===e.group);
}

function keyedOptions(answer, entries, getKey, count, rng) {
  const others=[...new Set(entries.map(getKey))].filter(k=>k!==answer);
  return shuffle([answer,...shuffle(others,rng).slice(0,count-1)],rng);
}

function spellingMask(entry) {
  const {word,pattern}=entry;
  if (pattern.endsWith('_e')) {
    const at=word.toLowerCase().indexOf(pattern[0]);
    return {mask:word.slice(0,at)+'_'+word.slice(at+1,-1)+'_',answer:pattern};
  }
  const key={'y-head':'y','y-i':'y','y-e':'y','oo-long':'oo','oo-short':'oo','oll-long':'oll','oll-short':'oll','th-voiced':'th','th-unvoiced':'th'}[pattern]??pattern;
  const ending=entry.group==='endings'||entry.group==='finals'||pattern==='y-i'||pattern==='y-e';
  const at=ending ? word.toLowerCase().lastIndexOf(key):word.toLowerCase().indexOf(key);
  return {mask:word.slice(0,at)+'_'.repeat(key.length)+word.slice(at+key.length),answer:key};
}

export function sortingBoard({book,group,level},rng=Math.random) {
  const entries=bookWords[book].filter(entry=>matchFocus(book,group,entry));
  const family=shuffle([...new Set(entries.map(entry=>entry.group))],rng)[0];
  const pool=entries.filter(entry=>entry.group===family);
  const keys=shuffle([...new Set(pool.map(entry=>patternKey(book,entry)))],rng);
  const categories=keys.filter(key=>key!=='ll'||!keys.some(other=>other==='all'||other.startsWith('oll-'))).slice(0,levels[level].options);
  const groups=categories.map(key=>shuffle(pool.filter(entry=>patternKey(book,entry)===key),rng));
  const cards=[];
  for(let pass=0;cards.length<levels[level].count&&groups.some(entries=>entries[pass]);pass++){
    for(let index=0;index<groups.length&&cards.length<levels[level].count;index++){
      const entry=groups[index][pass];
      if(entry)cards.push({entry,correct:categories[index]});
    }
  }
  return {categories,cards:shuffle(cards,rng)};
}
function question(mode,book,e,all,level,rng,group) {
  const base={mode, entry:e, explanation:ruleExplanation(book,e)};
  const family=comparable(book,e,all);
  const nasal=['n','ng','m'];
  const own=e.group==='endings'&&['listen','flight'].includes(mode)
    ? family.filter(entry=>nasal.includes(entry.pattern)===nasal.includes(e.pattern))
    : family;
  if (mode==='listen') {
    const getKey=group==='all-oll' ? entry=>entry.pattern : entry=>soundKey(book,entry);
    const key=getKey(e);
    const choices=new Map(own.map(entry=>[getKey(entry),entry.word]));
    const count=e.group==='endings'&&nasal.includes(key)?nasal.length:level.options;
    const options=keyedOptions(key,own,getKey,count,rng);
    const samples=options.map(option=>own.find(entry=>getKey(entry)===option&&entry.word!==e.word)?.word??choices.get(option));
    return {...base,prompt:group==='all-oll'?'What sound is in the middle?':e.group==='endings'&&!nasal.includes(key)?'What do you hear at the end: ds or ts?':groupPrompt(book,e),correct:key,options,samples,audio:true};
  }
  if (mode==='blend') return {...base,prompt:'Spin. Say the sounds. Read the word.',correct:e.word};
  if (mode==='segment') {
    return {...base,prompt:'Say it slowly. Add one drop for each sound.',correct:e.tiles.length,audio:true};
  }
  if (mode==='spell') {
    const missing=level.rank===0?spellingMask(e):{mask:null,answer:e.word};
    const correct=missing.answer.replace('_','').toLowerCase();
    const alphabet=[...'abcdefghijklmnopqrstuvwxyz'];
    const decoys=shuffle(alphabet.filter(letter=>!correct.includes(letter)),rng).slice(0,level.rank===0?2:4);
    const letters=level.rank===2?alphabet:shuffle([...new Set(correct),...decoys],rng);
    return {...base,prompt:missing.mask?'Listen. Fill in the missing letters.':'Listen. Tap the letters to spell it.',mask:missing.mask,correct,letters,audio:true};
  }
  if (mode==='flight') {
    const close=own.filter(x=>x.word!==e.word&&x.pattern!==e.pattern);
    const options=[e.word,...shuffle([...new Set(close.map(x=>x.word))],rng).slice(0,level.options-1)];
    return {...base,prompt:'Hear the word. Tap it to bring it down!',correct:e.word,options:shuffle(options,rng),audio:true};
  }
  throw new Error('Unknown practice mode: '+mode);
}

export function createRound({book, mode, level, group='all', review},rng=Math.random) {
  book=Number(book);
  const entries=bookWords[book].filter(e=>matchFocus(book,group,e));
  const all=group==='all'?entries:uniqueWords(entries);
  const settings=levels[level];
  const source=review??all;
  const eligible=source.filter(e=>mode!=='segment'||!yooWords.has(e.word));
  let pool=shuffle(eligible,rng);
  if (settings.rank===0 && !review) {
    pool=pool.sort((a,b)=>Math.max(0,a.tiles.length-4)-Math.max(0,b.tiles.length-4));
  }
  const selected=[];
  if(group==='all'&&!review) {
    for(const key of shuffle([...new Set(pool.map(e=>e.group))],rng)) {
      const first=pool.find(e=>e.group===key);
      if(first) selected.push(first);
    }
  }
  for(const entry of pool) if(!selected.some(e=>e.word===entry.word)) selected.push(entry);
  return selected.slice(0,review?selected.length:settings.count)
    .map(e=>question(mode,book,e,all,settings,rng,group));
}

export const uiPattern = key => key.includes('_') ? key.replace('_',' · ') : choiceLabel(key);
export const needsLongOO = key => ['oo-long','long oo as in moon'].includes(key);
export const isVoicedTH = key => key==='th-voiced' || key==='th as in this';
export const isVowelTile = t=>vowelPatterns.has(t)||/^(a|e|i|o|u|y|ar|oo)$/.test(t);
