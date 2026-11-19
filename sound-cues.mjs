export const soundCues={
a:['short a /æ/','cat'],e:['short e /ɛ/','pen'],i:['short i /ɪ/','sit'],o:['short o /ɑ/','pot'],u:['short u /ʌ/','cup'],
'long-a':['long a /eɪ/','cake'],'long-e':['long e /iː/','me'],'long-i':['long i /aɪ/','kite'],'long-o':['long o /oʊ/','home'],yoo:['long u /juː/','cute'],'oo-long':['/uː/','moon'],'oo-short':['/ʊ/','book'],
p:['/p/','pig'],b:['/b/','bed'],t:['/t/','ten'],d:['/d/','den'],k:['/k/','cap'],g:['/g/','gap'],f:['/f/','fan'],v:['/v/','van'],s:['/s/','sun'],z:['/z/','zip'],sh:['/ʃ/','ship'],ch:['/tʃ/','chin'],j:['/dʒ/','badge'],l:['/l/','bell'],
ng:['/ŋ/','ring'],n:['/n/','fan'],m:['/m/','ham'],ts:['/ts/','cats'],ds:['/dz/','beds'],'th-unvoiced':['/θ/','thin'],'th-voiced':['/ð/','this'],
'y-head':['/j/','yes'],'y-i':['/aɪ/','my'],'y-e':['/iː/','happy'],
pl:['/pl/','plan'],bl:['/bl/','block'],cl:['/kl/','clap'],gl:['/ɡl/','glad'],fl:['/fl/','flag'],sl:['/sl/','slip'],pr:['/pr/','press'],br:['/br/','brick'],cr:['/kr/','crab'],gr:['/ɡr/','grab'],fr:['/fr/','frog'],tr:['/tr/','trap'],dr:['/dr/','drum'],sp:['/sp/','spin'],st:['/st/','stop'],sk:['/sk/','skip'],sm:['/sm/','smell'],sn:['/sn/','snap'],spl:['/spl/','split'],spr:['/spr/','spring'],scr:['/skr/','scrap'],str:['/str/','string']};
export const patternExamples={ff:'puff',ss:'miss',ll:'hill',ck:'duck',tch:'catch',dge:'badge',all:'ball',oll:'roll',a_e:'cake',ai:'rain',ay:'day',e_e:'pete',e:'me',ee:'green',ea:'team',i_e:'kite',ie:'pie',igh:'night',o_e:'home',oa:'boat',ow:'snow',u_e:'cute',ew:'few',ue:'clue',ui:'fruit',oo:'moon'};
export function cueFor(question,game,kind){
 if(question.rule)return {files:['spelling'],label:question.prompt};
 const [label,example]=soundCues[question.targetSound??question.topic]??[question.focusLabel,question.options[0]?.word];
 if(game==='mole'&&question.task==='odd'){const pos=question.position;return {files:[pos==='end'||pos==='final y'?'odd-end':pos==='start'?'odd-start':pos==='middle'||pos==='vowel'?'odd-vowel':'odd-anywhere'],example,label:'Odd One Out: which word does NOT '+(pos==='end'?'end with':pos==='start'?'start with':'have')+' '+label+', as in '+example+'?'};}
 if(game==='mole'){
  const pos=question.position;
  const verb=pos==='end'||pos==='final y'?'ends with':pos==='start'?'starts with':'has';
  return {files:[['n','ng','m','ts','ds','a','e','i','o','u','long-a','long-e','long-i','long-o','yoo','oo-long','oo-short'].includes(question.topic)?question.topic:pos==='end'||pos==='final y'?'end':pos==='start'?'start':'anywhere'],example:['n','ng','m','ts','ds','a','e','i','o','u','long-a','long-e','long-i','long-o','yoo','oo-long','oo-short'].includes(question.topic)?null:example,label:'Whack every word that '+verb+' '+label+', as in '+example+'.'};
 }
 let sample=kind==='spelling'?patternExamples[question.topic]??example:example;
 if(kind==='spelling'&&question.topic==='u_e'&&question.targetSound==='oo-long')sample='flute';
 if(kind==='spelling'&&question.topic==='ew'&&question.targetSound==='oo-long')sample='crew';
 if(kind==='spelling'&&question.topic==='ue'&&question.targetSound==='yoo')sample='cue';
 if(kind==='spelling'&&question.topic==='oo'&&question.targetSound==='oo-short')sample='book';
 return {files:[kind==='spelling'?'flashlight-spelling':'flashlight'],example:sample,label:null};
}
