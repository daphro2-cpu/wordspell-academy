export function resemblesWord(transcript,target){
  const aliases={two:'to',too:'to',four:'for',ate:'eight',won:'one',write:'right',sea:'see',bee:'be',blue:'blew',pair:'pear',flower:'flour',night:'knight',son:'sun',their:'there',wear:'where',red:'read',new:'knew',no:'know',eye:'i',by:'buy',meet:'meat',plane:'plain',road:'rode',tail:'tale',sail:'sale'};
  const normalize=w=>aliases[w]??w;
  const expected=normalize(target.toLowerCase().replace(/[^a-z]/g,''));
  const words=transcript.toLowerCase().match(/[a-z]+/g)??[];
  return words.some(word=>{
    const actual=normalize(word);
    if(actual===expected)return true;
    if(expected.length<5||actual.length<5||actual[0]!==expected[0]||Math.abs(actual.length-expected.length)>1)return false;
    let row=Array.from({length:actual.length+1},(_,i)=>i);
    for(let i=0;i<expected.length;i++){
      const next=[i+1];
      for(let j=0;j<actual.length;j++)next.push(Math.min(next[j]+1,row[j+1]+1,row[j]+Number(expected[i]!==actual[j])));
      row=next;
    }
    return row[actual.length]<=1;
  });
}
