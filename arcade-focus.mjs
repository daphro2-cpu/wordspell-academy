// Teaching comparisons are explicit domains, rather than unrelated distractor sounds.
export const soundContrasts={
 1:[
  ['a-e','Short a vs. short e',['a','e'],'Compare short vowels'],
  ['e-i','Short e vs. short i',['e','i'],'Compare short vowels'],
  ['o-u','Short o vs. short u',['o','u'],'Compare short vowels'],
  ['p-b','p vs. b',['p','b'],'Compare beginning consonants'],
  ['t-d','t vs. d',['t','d'],'Compare beginning consonants'],
  ['k-g','/k/ vs. /g/ (c, k and g)',['k','g'],'Compare beginning consonants'],
  ['f-v','f vs. v',['f','v'],'Compare beginning consonants'],
  ['s-z','s vs. z',['s','z'],'Compare beginning consonants'],
  ['sh-ch','sh vs. ch',['sh','ch'],'Compare digraph sounds'],
  ['th','The two th sounds: thin vs. this',['th-unvoiced','th-voiced'],'Compare digraph sounds'],
  ['n-ng-m','Endings n, ng and m',['n','ng','m'],'Compare ending sounds'],
  ['ts-ds','Endings ts /ts/ vs. ds /dz/',['ts','ds'],'Compare ending sounds'],
 ],
 2:[
  ['oo','oo in book vs. oo in moon',['oo-short','oo-long'],'Compare vowel sounds'],
  ['u-oo','/yoo/ in cute vs. /oo/ in flute',['yoo','oo-long'],'Compare vowel sounds'],
 ],
 3:[
  ['pl-bl','pl vs. bl',['pl','bl'],'Compare L blends'],
  ['cl-gl','cl vs. gl',['cl','gl'],'Compare L blends'],
  ['fl-sl','fl vs. sl',['fl','sl'],'Compare L blends'],
  ['pr-br','pr vs. br',['pr','br'],'Compare R blends'],
  ['cr-gr','cr vs. gr',['cr','gr'],'Compare R blends'],
  ['tr-dr','tr vs. dr',['tr','dr'],'Compare R blends'],
  ['sp-st','sp vs. st',['sp','st'],'Compare S blends'],
  ['sm-sn','sm vs. sn',['sm','sn'],'Compare S blends'],
  ['y','Final y: my vs. happy',['y-i','y-e'],'Compare the sounds of y'],
 ]
};
export function contrastFor(book,key){return soundContrasts[Number(book)]?.find(c=>'contrast-'+c[0]===key);}
export function targetCategory(book,key){
 if(Number(book)===1)return 'aeiou'.includes(key)?'Find a target: short vowels':['n','ng','m','ts','ds'].includes(key)?'Find a target: ending sounds':['sh','ch','th-unvoiced','th-voiced'].includes(key)?'Find a target: digraph sounds':'Find a target: beginning consonants';
 if(Number(book)===2)return ['f','s','l','k','ch','j'].includes(key)?'Find a target: final consonant sounds':['oo-short','oo-long','yoo'].includes(key)?'Find a target: /yoo/ and /oo/ sounds':'Find a target: long vowels';
 return key.startsWith('y-')?'Find a target: sounds of y':key.length===3?'Find a target: three-consonant blends':key.endsWith('l')?'Find a target: L blends':key.endsWith('r')?'Find a target: R blends':'Find a target: S blends';
}
export function spellingCategory(book,pattern,sound){
 if(Number(book)===2)return ['long-a','long-e','long-i','long-o'].includes(sound)?'Spell '+sound.replace('-',' '):['yoo','oo-long','oo-short'].includes(sound)?'Spell /yoo/ and /oo/ sounds':'Final consonant spellings';
 return targetCategory(book,sound).replace('Find a target:','Spell');
}
