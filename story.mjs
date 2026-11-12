import {bookWords} from './bank.mjs?v=forge-workbench';
import {choiceLabel, matchFocus, shuffle} from './engine.mjs?v=story-clues';

const mixedStory=[
  {sentence:'A {cat} sat on a {mat}.', art:'cat-mat', imageAlt:'An orange cat sits on a mat.', anchor:'map', middle:true, clue:'Find 2 short a words.', targets:['cat','mat'], decoys:['bed','pin','cup']},
  {sentence:'{Ben} got a {red} {pen} to draw the cat.', art:'ben-pen', imageAlt:'Ben picks up a red pen beside the cat.', anchor:'bed', middle:true, clue:'Find 3 short e words.', targets:['ben','red','pen'], decoys:['map','pig','sun']},
  {sentence:'Ben saw a {cake} by the {gate}.', art:'cake-gate', imageAlt:'Ben sees a cake beside a gate.', anchor:'tape', middle:true, clue:'Find 2 long a words.', targets:['cake','gate'], decoys:['cap','cot','cut']},
];
const shortStory=[
  ...mixedStory.slice(0,2),
  {sentence:'A {pig} came to {sit} with the cat.', art:'pig-sit', imageAlt:'A pig sits with the cat.', anchor:'pin', middle:true, clue:'Find 2 short i words.', targets:['pig','sit'], decoys:['map','pot','sun']},
];
const magicStory=[
  {sentence:'Gigi got a {cake} and some {tape} for a party.', art:'cake-tape', imageAlt:'Gigi has a birthday cake and a roll of tape.', anchor:'gate', middle:true, clue:'Find 2 a space e words.', targets:['cake','tape'], decoys:['bell','home','cube']},
  {sentence:'She put a {kite} by the {slide}.', art:'kite-slide', imageAlt:'Gigi puts a kite next to a slide.', anchor:'bike', middle:true, clue:'Find 2 i space e words.', targets:['kite','slide'], decoys:['cake','rope','bell']},
  {sentence:'She took a {note} {home}.', art:'note-home', imageAlt:'Gigi takes a folded note to her house.', anchor:'rope', middle:true, clue:'Find 2 o space e words.', targets:['note','home'], decoys:['kite','cup','tape']},
];

export function makeStory({book,group,level}) {
  if (book===1 && group==='all') return mixedStory;
  if (book===1 && group==='vowels') return shortStory;
  if (book===2 && group==='magic') return magicStory;
  const pool=bookWords[book].filter(e=>matchFocus(book,group,e));
  const patterns=[...new Set(pool.map(e=>e.pattern))];
  const pageCount=level==='simple'?3:level==='medium'?4:5;
  const pageFrames=[
    'Gigi found {A} on a scroll.',
    'The Word Monster wrote {A} on the wall.',
    'The scroll lit up when Gigi read {A}.',
    'Gigi found a new clue. It said {A}.',
    'The door opened when Gigi read {A}.',
  ];
  const orderedPatterns=shuffle(patterns.filter(pattern=>pool.filter(e=>e.pattern===pattern).length>=2));
  if (!orderedPatterns.length) orderedPatterns.push(...shuffle(patterns));
  return pageFrames.slice(0,pageCount).map((frame,index)=>{
    const pattern=orderedPatterns[index%orderedPatterns.length];
    const matching=pool.filter(e=>e.pattern===pattern);
    const targets=shuffle(matching).slice(0,level==='difficult'?3:2).map(e=>e.word.toLowerCase());
    const anchor=matching.find(e=>!targets.includes(e.word.toLowerCase()))?.word??targets[0];
    const nearby=pool.filter(e=>e.pattern!==pattern&&e.group===matching[0].group);
    const outside=bookWords[book].filter(e=>e.pattern!==pattern);
    const decoys=[...new Set([...shuffle(nearby),...shuffle(outside)].map(e=>e.word.toLowerCase()))]
      .filter(word=>word!==anchor.toLowerCase()&&!targets.includes(word)&&!matching.some(e=>e.word.toLowerCase()===word));
    const label=matching[0].group==='vowels'?'short '+pattern:choiceLabel(pattern);
    const spelling=matching[0].group!=='vowels';
    const soundLabel=pattern==='oo-long'?'long oo':pattern==='oo-short'?'short oo':label;
    return {
      sentence:frame.replace('{A}',targets.map(word=>'{'+word+'}').join(targets.length===2?' and ':', ')),
      clue:spelling?'Find '+targets.length+' '+soundLabel+' '+(targets.length===1?'word.':'words.'):'Find '+targets.length+' '+label+' '+(targets.length===1?'word.':'words.'),
      pattern,
      anchor,
      middle:!spelling||matching[0].group==='oo'||pattern.endsWith('_e'),
      targets,
      decoys:decoys.filter(word=>spelling||!shortSound(word,pattern)).slice(0,level==='simple'?2:level==='medium'?3:4),
    };
  });
}

function shortSound(word,pattern) {
  return /^[^aeiou]+[aeiou][^aeiou]+$/i.test(word)&&word.includes(pattern);
}
