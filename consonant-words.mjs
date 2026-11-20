// Short-vowel CVC words for focused beginning-consonant comparisons.
export const consonantWords={
 p:'pan pen pin pot pup pat pet pit peg',
 b:'bat bed big bob bun bag bug bin bud bet',
 t:'tap ten tin top tub tag tip tan',
 d:'dad den dig dot dug dog dim dip',
 c:'cat cap can cot cop cut cup kid kit kin',
 g:'gap gas get gig gum got gut',
 f:'fan fed fin fit fog fun fat',
 v:'van vet vat',
 s:'sit sip sun set sad sob sum',
 z:'zip zap zed',
};
export const consonantEntries=Object.entries(consonantWords).flatMap(([pattern,words])=>words.split(' ').map(word=>({word,tiles:[...word],pattern,group:'pairs',sentence:'Read the word: '+word+'.'})));

export const endingWords={
 n:'fan ran sin pan pen pin tin can sun',m:'ham jam ram gum sum',ng:'ring sang long fang rang sing',
 ts:'cats hats bats pets pits pots cuts',ds:'beds seeds lids pads kids rods buds',
};
export const endingEntries=Object.entries(endingWords).flatMap(([pattern,words])=>words.split(' ').map(word=>({word,tiles:word.match(/ng|ee|[a-z]/g),pattern,group:'endings',sentence:'Read the word: '+word+'.'})));
export const digraphWords={sh:'ship shop fish wish shed',ch:'chip chop chin chess chat','th-unvoiced':'thin thick bath math moth path thud','th-voiced':'this that them'};
export const digraphEntries=Object.entries(digraphWords).flatMap(([pattern,words])=>words.split(' ').map(word=>({word,tiles:word.match(/sh|ch|th|ck|[a-z]/g),pattern,group:'digraphs',sentence:'Read the word: '+word+'.'})));
