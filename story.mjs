import {bookWords} from './bank.mjs?v=experience12';
import {choiceLabel, matchFocus, shuffle} from './engine.mjs?v=experience12';

const mixedStory=[
  {sentence:'A {cat} sat on a {mat}.', art:'cat-mat', imageAlt:'An orange cat sits on a mat.', anchor:'map', middle:true, clue:'Find 2 short a words.', targets:['cat','mat'], decoys:['bed','pin','cup'], extra:'pot', tricky:'sat'},
  {sentence:'{Ben} got a {red} {pen} to draw the cat.', art:'ben-pen', imageAlt:'Ben picks up a red pen beside the cat.', anchor:'bed', middle:true, clue:'Find 3 short e words.', targets:['ben','red','pen'], decoys:['map','pig','sun'], extra:'hat', tricky:'met'},
  {sentence:'Ben saw a {cake} by the {gate}.', art:'cake-gate', imageAlt:'Ben sees a cake beside a gate.', anchor:'tape', middle:true, clue:'Find 2 long a words.', targets:['cake','gate'], decoys:['cap','cot','cut'], extra:'kit', tricky:'made'},
];
const shortStory=[
  ...mixedStory.slice(0,2),
  {sentence:'A {pig} came to {sit} with the cat.', art:'pig-sit', imageAlt:'A pig sits with the cat.', anchor:'pin', middle:true, clue:'Find 2 short i words.', targets:['pig','sit'], decoys:['map','pot','sun'], extra:'pen', tricky:'big'},
];
const magicStory=[
  {sentence:'Gigi got a {cake} and some {tape} for a party.', art:'cake-tape', imageAlt:'Gigi has a birthday cake and a roll of tape.', anchor:'gate', middle:true, matchSpelling:true, clue:'Find 2 a space e words.', targets:['cake','tape'], decoys:['bell','home','cube'], extra:'bike', tricky:'made'},
  {sentence:'She put a {kite} by the {slide}.', art:'kite-slide', imageAlt:'Gigi puts a kite next to a slide.', anchor:'bike', middle:true, matchSpelling:true, clue:'Find 2 i space e words.', targets:['kite','slide'], decoys:['cake','rope','bell'], extra:'bone', tricky:'time'},
  {sentence:'She took a {note} {home}.', art:'note-home', imageAlt:'Gigi takes a folded note to her house.', anchor:'rope', middle:true, matchSpelling:true, clue:'Find 2 o space e words.', targets:['note','home'], decoys:['kite','cup','tape'], extra:'bell', tricky:'rode'},
];

const sledStory=[
  {sentence:'Gigi pulled her {sled} up the hill. “Don’t {slip}!” called Juniper.', pattern:'sl', tricky:'slid', anchor:'sleep', targets:['sled','slip'], imageAlt:'Gigi pulls a sled up a snowy hill with Juniper.'},
  {sentence:'The wind made a little {flag} {flap}. Then the flag came loose!', pattern:'fl', tricky:'flew', anchor:'float', targets:['flag','flap'], imageAlt:'A golden flag flaps in the wind beside Gigi.'},
  {sentence:'Gigi took one more {step}. Then she had to {stop} to pick up the flag.', pattern:'st', tricky:'stuck', targets:['step','stop'], imageAlt:'Gigi stops to pick up the fallen flag.'},
  {sentence:'With a {grin}, Juniper said, “{Grab} the rope. I’ll help you!”', pattern:'gr', tricky:'grew', anchor:'green', targets:['grin','grab'], imageAlt:'Juniper grins and hands Gigi the sled rope.'},
  {sentence:'Gigi used a {clip} to put the flag back. Juniper began to {clap}.', pattern:'cl', tricky:'clung', targets:['clip','clap'], imageAlt:'Gigi clips the flag onto its pole while Juniper claps.'},
];

function illustratedStory(pages,level){
  return pages.map(({extra,tricky,...page})=>({
    ...page,
    ordered:level==='difficult',
    decoys:level==='difficult'?[...page.decoys,extra,tricky]:page.decoys.slice(0,level==='medium'?3:2),
  }));
}

export function makeStory({book,group,level}) {
  if (book===1 && group==='all') return illustratedStory(mixedStory,level);
  if (book===1 && group==='vowels') return illustratedStory(shortStory,level);
  if (book===2 && group==='magic') return illustratedStory(magicStory,level);
  const pageCount=level==='simple'?3:level==='medium'?4:5;
  if(book===3&&group==='two'){
    return sledStory.slice(0,pageCount).map(({tricky,...page},index)=>({
      ...page,
      sledPanel:index,
      ordered:level==='difficult',
      matchSpelling:true,
      clue:`Find 2 words that start with ${page.pattern}.`,
      decoys:[...shuffle(bookWords[3].filter(entry=>entry.group==='two'&&!entry.word.startsWith(page.pattern)))
        .slice(0,pageCount-1).map(entry=>entry.word),...(level==='difficult'?[tricky]:[])],
    }));
  }
  const pool=bookWords[book].filter(e=>matchFocus(book,group,e));
  const patterns=[...new Set(pool.map(e=>e.pattern))];
  const pageFrames=[
    'Gigi found {A} written on a scroll.',
    'The Word Monster wrote {A} on the wall.',
    'The scroll lit up when Gigi read {A}.',
    'Gigi found a new clue. It said {A}.',
    'The door opened when Gigi read {A}.',
  ];
  const orderedPatterns=shuffle(patterns.filter(pattern=>pool.filter(e=>e.pattern===pattern).length>=2));
  if (!orderedPatterns.length) orderedPatterns.push(...shuffle(patterns));
  return pageFrames.slice(0,pageCount).map((frame,index)=>{
    const pattern=orderedPatterns[index%orderedPatterns.length];
    const matching=[...new Map(pool.filter(e=>e.pattern===pattern).map(entry=>[entry.word.toLowerCase(),entry])).values()];
    const targets=shuffle(matching).slice(0,level==='difficult'?3:2).map(e=>e.word.toLowerCase());
    const anchor=matching.find(e=>!targets.includes(e.word.toLowerCase()))?.word;
    const nearby=pool.filter(e=>e.pattern!==pattern&&e.group===matching[0].group);
    const outside=bookWords[book].filter(e=>e.pattern!==pattern);
    const decoys=[...new Set([...shuffle(nearby),...shuffle(outside)].map(e=>e.word.toLowerCase()))]
      .filter(word=>word!==anchor?.toLowerCase()&&!targets.includes(word)&&!matching.some(e=>e.word.toLowerCase()===word));
    const label=matching[0].group==='vowels'?'short '+pattern:choiceLabel(pattern);
    const spelling=matching[0].group!=='vowels';
    const soundLabel=pattern==='oo-long'?'long oo':pattern==='oo-short'?'short oo':pattern==='oll-long'?'long o (oll)':pattern==='oll-short'?'short o (oll)':label;
    return {
      libraryPanel:index%5,
      imageAlt:['Gigi discovers a parchment scroll in the library.','The friendly Word Monster writes magical clues on the wall.','A scroll glows as Gigi reads it aloud.','Gigi finds a clue in a magical book.','A library door opens when Gigi reads the clue.'][index%5],
      sentence:frame.replace('{A}',targets.map(word=>'“{'+word+'}”').join(targets.length===2?' and ':', ')),
      clue:spelling?'Find '+targets.length+' '+soundLabel+' '+(targets.length===1?'word.':'words.'):'Find '+targets.length+' '+label+' '+(targets.length===1?'word.':'words.'),
      pattern,
      anchor,
      matchSpelling:spelling,
      middle:!spelling||matching[0].group==='oo'||pattern.endsWith('_e'),
      targets,
      decoys:decoys.filter(word=>spelling||!shortSound(word,pattern)).slice(0,level==='simple'?2:level==='medium'?3:4),
    };
  });
}

function shortSound(word,pattern) {
  return /^[^aeiou]+[aeiou][^aeiou]+$/i.test(word)&&word.includes(pattern);
}
