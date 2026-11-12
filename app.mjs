import {catalog} from './bank.mjs';
import {modes,levels,createRound,sortingBoard,practiceContrasts,shuffle,choiceLabel,isVowelTile} from './engine.mjs?v=swinging-doors';

import {missions,flightMission} from './missions.mjs';
import {makeStory} from './story.mjs';
import {reviewPicture} from './review.mjs';

const by=id=>document.getElementById(id);
const lobby=by('lobby'), play=by('play'), guide=by('guide');
const audio=new Audio();
const defaultFocus={1:'vowels',2:'magic',3:'two'};
const focusOptions=book=>({...catalog[book].groups,...practiceContrasts(book)});
let active;
let selection={book:1,level:'simple',group:defaultFocus[1]};

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const speech='speechSynthesis' in window?window.speechSynthesis:null;
const voiceStorage='wordspell-voice-v1';
let voicePreference='auto';
try {voicePreference=localStorage.getItem(voiceStorage)||'auto';} catch {}
let soundRequest=0;
const voicePriority=voice=>{
  if(/online|neural|natural|premium|enhanced|google/i.test(voice.name))return 0;
  if(/ava|allison|samantha|aria|jenny|guy|serena/i.test(voice.name))return 1;
  return 2;
};
function usVoices(){
  return (speech?.getVoices()??[]).filter(v=>/^en[-_]US$/i.test(v.lang))
    .sort((a,b)=>voicePriority(a)-voicePriority(b)||a.name.localeCompare(b.name));
}
function voiceChoice(){
  if(voicePreference==='teacher'||voicePreference==='bundled')return voicePreference;
  const choices=usVoices();
  return choices.find(v=>v.voiceURI===voicePreference)??choices[0]??'bundled';
}
function voiceUi(){
  const available=usVoices();
  const select=by('voice-select');
  const entries=[['auto','Best available US voice'],...available.map(v=>[v.voiceURI,v.name]),
    ['bundled','Built-in American English audio'],['teacher','Teacher reads']];
  select.innerHTML=entries.map(([value,label])=>'<option value="'+esc(value)+'">'+esc(label)+'</option>').join('');
  select.value=entries.some(([value])=>value===voicePreference)?voicePreference:'auto';
  const voice=voiceChoice();
  by('voice-note').textContent=voice==='teacher'?'Use Teacher word to read the prompt aloud.':
    voice==='bundled'?'Using the built-in US word clips. Device voices appear here when your browser provides them.':
    'Using '+voice.name+' (US). Preview it to check pacing and pronunciation.';
  by('voice-preview').disabled=voice==='teacher';
}
function stopSound(){
  soundRequest++;
  audio.pause();
  speech?.cancel();
}
function playBundled(word,request){
  if (request!==soundRequest)return;
  audio.src=new URL('./audio/'+encodeURIComponent(word.toLowerCase())+'.mp3',import.meta.url).href;
  audio.play().catch(()=>{
    if(request===soundRequest)by('live').textContent='Audio is unavailable. Open Teacher word to read the prompt.';
  });
}
function say(word,preview=false){
  stopSound();
  const request=soundRequest;
  const voice=voiceChoice();
  if(voice==='teacher'){
    by('live').textContent='Teacher reads mode is on. Open Teacher word or Teacher recordings.';
    return;
  }
  if(voice==='bundled'){playBundled(word,request);return;}
  const message=preview?'Listen carefully. Can you find the word that completes the spell?':word;
  const clip=new SpeechSynthesisUtterance(message);
  clip.voice=voice;
  clip.lang='en-US';
  clip.rate=.92;
  clip.onerror=event=>{
    if(!['canceled','interrupted'].includes(event.error))playBundled(word,request);
  };
  speech.speak(clip);
}
function shown(key) {
  if(key==='th-voiced')return '<u>th</u>';
  if(key==='th-unvoiced')return 'th';
  if(key==='oo-long'||key==='oo as in moon'||key==='long oo as in moon'||key==='long oo') {
    return key==='long oo' ? 'long <u>oo</u>' : '<u>oo</u> as in moon';
  }
  return esc(choiceLabel(key));
}
const audioButton=(word,label='Hear the word')=>'<button class="quiet audio" type="button" data-audio="'+esc(word)+'"><span aria-hidden="true">◖))</span> '+esc(label)+'</button>';
const runeKey='wordspell-room-runes-v1';
let runes;
try {
  const stored=JSON.parse(localStorage.getItem(runeKey)||'[]');
  runes=new Set(Array.isArray(stored)?stored:[]);
} catch {
  runes=new Set();
}
const roomKey=(book,mode)=>book+'-'+mode;
const goalFor=count=>Math.ceil(count*2/3);
const nodePositions=[
  ['18%','32%','27%','24%'],['51%','29%','73%','24%'],['83%','33%','27%','51%'],
  ['18%','75%','73%','51%'],['51%','72%','27%','80%'],['83%','75%','73%','80%'],
];
function renderMap(){
  let earned=0;
  by('game-picker').innerHTML=modes.map((m,i)=>{
    const cleared=runes.has(roomKey(selection.book,m.id));
    earned+=Number(cleared);
    const [x,y,mx,my]=nodePositions[i];
    const title=m.title+' · '+missions[m.id].objective;
    return `<button class="map-node ${m.color} ${cleared?'earned':''}" data-game="${m.id}" type="button" aria-label="${esc(title)}" style="--mx:${x};--my:${y};--mobile-x:${mx};--mobile-y:${my}">
      <span class="map-sigil" aria-hidden="true">${esc(missions[m.id].glyph)}</span>
      ${cleared?'<span class="collected" title="Rune collected" aria-hidden="true">✦</span>':''}
      <strong>${esc(m.title)}</strong><span class="map-skill">${esc(m.skill)}</span>
    </button>`;
  }).join('');
  by('rune-total').textContent='✦ '+earned+' / '+modes.length+' room runes';
}
function selectionUi(){
  by('book-picker').innerHTML=Object.entries(catalog).map(([key,b])=>
    `<button type="button" data-book="${key}" aria-pressed="${Number(key)===selection.book}" title="${esc(b.title)}">Book ${key}</button>`
  ).join('');
  by('level-picker').innerHTML=Object.entries(levels).map(([key,l])=>
    `<button type="button" data-level="${key}" aria-pressed="${selection.level===key}">${l.title}</button>`
  ).join('');
  by('focus').innerHTML='<option value="all">Mixed review</option>'+
    '<optgroup label="Practice one topic">'+Object.entries(catalog[selection.book].groups).map(([k,v])=>'<option value="'+k+'">'+esc(v)+'</option>').join('')+'</optgroup>'+
    '<optgroup label="Focus on a pattern or compare sounds">'+Object.entries(practiceContrasts(selection.book)).map(([k,v])=>'<option value="'+k+'">'+esc(v)+'</option>').join('')+'</optgroup>';
  by('focus').value=selection.group;
  by('book-summary').textContent=catalog[selection.book].summary;
  by('level-hint').textContent=levels[selection.level].hint;
  renderMap();
}
selectionUi();

function start(settings) {
  stopSound();
  const board=settings.mode==='sort'?sortingBoard(settings):null;
  const questions=board?.cards??(settings.mode==='context'
    ? makeStory(settings).map(page=>({...page,options:shuffle([...page.targets,...page.decoys])}))
    : createRound({...settings,mode:settings.variant==='flight'?'flight':settings.mode}));
  active={settings,questions,index:0,board,clouds:new Set(),sorted:new Set(),boardMessage:'',drops:0,hatched:false,mistakes:[],score:0,verdict:null,selected:null,spin:false,spelling:'',revealed:new Set(),found:new Set(),storyMessage:'',teacherOpen:false,outcomes:[],earned:false};
  lobby.hidden=true;
  play.hidden=false;
  history.replaceState(null,'','#play');
  render();
  play.scrollIntoView({block:'start'});
  play.querySelector('h1').focus({preventScroll:true});
}
function returnToLobby(){
  stopSound();
  const last=active?.settings.mode;
  active=null;
  play.hidden=true;
  lobby.hidden=false;
  renderMap();
  history.replaceState(null,'','#books');
  if (last) by('game-picker').querySelector('[data-game="'+last+'"]').focus({preventScroll:true});
  by('books').scrollIntoView({block:'start'});
}
function question() {return active.questions[active.index];}
function render() {
  const {settings,questions,index}=active;
  const mode=modes.find(x=>x.id===settings.mode);
  const mission=settings.variant==='flight'?flightMission:missions[mode.id];
  const focus=settings.group==='all'?'Mixed review':focusOptions(settings.book)[settings.group];
  const top='<div class="game-nav"><button type="button" class="quiet" data-action="lobby">← Academy map</button><strong>Book '+settings.book+' · '+levels[settings.level].title+' · '+esc(focus)+'</strong></div>';
  if(mode.id==='context'){
    play.innerHTML=top+storyView(mission);
    return;
  }
  if(mode.id==='sort'&&index<questions.length){
    play.innerHTML=top+sortView(mission);
    return;
  }
  if(index>=questions.length){
    play.innerHTML=top+result(mode);
    return;
  }
  const q=question();
  const audioControls=q.audio?'<div class="play-actions">'+audioButton(q.entry.word)+'</div><details class="teacher-word" '+(active.teacherOpen?'open':'')+'><summary>Teacher word</summary><p>'+esc(q.entry.word)+'</p>'+(q.mode==='spell'?'<p>'+esc(q.entry.sentence.replace('___',q.entry.word))+'</p>':'')+'</details>':'';
  let body;
  switch(q.mode){
    case 'blend': body=blend(q);break;
    case 'segment': body=segment(q);break;
    case 'spell': body=spellingForge(q);break;
    case 'flight': body=flightView(q);break;
    default: body=options(q);
  }
  const verdict=active.verdict;
  const feedback=verdict===null?'':'<div class="answer-feedback '+(verdict?'':'missed')+'" tabindex="-1" id="feedback"><strong>'+esc(verdict?mission.win:mission.miss)+'</strong> <span>'+esc(q.entry.word)+'</span><details class="teacher-word"><summary>Teacher tip</summary><p>'+esc(q.explanation)+'</p></details></div>';
  const next=verdict===null?'':'<div class="play-actions"><button class="primary" type="button" data-action="next">'+(index+1===questions.length?'Finish':'Next word')+' →</button>'+audioButton(q.entry.word,'Hear the word')+'</div>';
  const track=mode.id==='blend'?bridgeProgress(questions.length):mode.id==='segment'?cauldron():'';
  play.innerHTML=top+`<article class="stage mission scene-${mode.id}">
    <header class="mission-header"><div><h1 tabindex="-1">${settings.variant==='flight'?'Flying Things':esc(mode.title)}</h1><p class="mission-objective">${esc(mission.objective)}</p></div>
    <span class="mission-count">Word ${index+1} of ${questions.length} · ${active.score} ${esc(mission.reward[active.score===1?0:1])}</span></header>
    ${trail(questions.length)}
    ${mode.id==='listen'?'<div class="flight-picker"><button type="button" class="quiet" data-action="'+(settings.variant==='flight'?'doors':'flight')+'">'+(settings.variant==='flight'?'Play Sound Doors':'Play Flying Things')+'</button></div>':''}
    <div class="scene-grid"><div class="task"><h2>${esc(q.prompt)}</h2>${track}${audioControls}${body}${feedback}${next}</div>${guideView(mission,verdict)}</div>
  </article>`;
  play.querySelector('details')?.addEventListener('toggle',e=>{if(active) active.teacherOpen=e.target.open;});
}
function sortView(mission) {
  const {questions,board,clouds,sorted,selected}=active;
  const wordTiles=questions.map(({entry},index)=>{
    if(sorted.has(index))return '';
    const word=esc(entry.word);
    if(!clouds.has(index))return '<button type="button" class="cloud-card" data-cloud="'+index+'" aria-label="Brush away cloud '+(index+1)+'"><span aria-hidden="true">☁</span></button>';
    return '<button type="button" class="found-word" data-sort-word="'+index+'" draggable="true" aria-pressed="'+(selected===index)+'">'+word+'</button>';
  }).join('');
  return `<article class="stage mission scene-sort"><header class="mission-header"><div><h1 tabindex="-1">The Sorting Hall</h1><p class="mission-objective">Clear the clouds. Sort the words.</p></div><span class="mission-count">${sorted.size} of ${questions.length} words sorted</span></header>
    <div class="scene-grid"><div class="task">
    <h2>Brush away a cloud. Read the word.</h2><p class="prompt">Tap a word, then tap its door. You can drag it, too.</p>
    <div class="cloud-pile" role="group" aria-label="Clouds and words">${wordTiles}</div>
    <div class="word-portals" role="group" aria-label="Sort words into groups">${board.categories.map((key,index)=>'<div class="word-portal"><button type="button" data-portal="'+index+'">'+shown(key)+'</button><div class="portal-words">'+[...sorted].filter(i=>questions[i].correct===key).map(i=>'<span>'+esc(questions[i].entry.word)+'</span>').join('')+'</div></div>').join('')}</div>
    <p class="story-status" role="status">${esc(active.boardMessage)}</p>
    ${sorted.size===questions.length?'<button class="primary" type="button" data-action="finishSort">Read the words again →</button>':''}
    </div>${guideView(mission,null)}</div></article>`;
}
function clearCloud(index){
  if(active.clouds.has(index))return;
  active.clouds.add(index);
  active.boardMessage='';
  render();
  play.querySelector('[data-sort-word="'+index+'"]')?.focus({preventScroll:true});
}
function sortWord(index,portal) {
  if(!active.clouds.has(index)||active.sorted.has(index)){
    active.boardMessage='Pick a word first.';
  } else if(active.questions[index].correct===active.board.categories[portal]){
    active.sorted.add(index);
    active.selected=null;
    active.score++;
    active.boardMessage=active.sorted.size===active.questions.length?'You cleared the hall!':'That word is home!';
  } else {
    active.boardMessage='Try another door.';
  }
  render();
  (play.querySelector('[data-action=finishSort]')??play.querySelector('[data-portal="'+portal+'"]'))?.focus({preventScroll:true});
}
function flightView(q){
  const objects=['🪶','🗝️','🧹','🕯️','🔮','🍂','📜','💎','🪄','🧭'];
  const shelf=active.outcomes.flatMap((correct,i)=>correct?[objects[i]]:[]);
  return `<div class="flying-yard" role="group" aria-label="Flying word tags">${q.options.map((word,i)=>'<button type="button" class="flying-tag'+optionClass(word,q)+'" data-choice="'+i+'" style="--drift:'+i+'" '+(active.verdict===null?'':'disabled')+'><span aria-hidden="true">'+objects[(active.index+(word===q.correct?0:i+1))%objects.length]+'</span>'+esc(word)+'</button>').join('')}</div><p class="story-status" role="status">${esc(active.boardMessage)}</p>
    <div class="object-shelf" aria-label="${shelf.length} things put back">${shelf.map(object=>'<span aria-hidden="true">'+object+'</span>').join('')}</div>`;
}
function restoredText(page,found) {
  return esc(page.sentence).replace(/\{([^}]+)\}/g,(_,word)=>found.has(word.toLowerCase())
    ? '<strong class="sentence-insert">'+word+'</strong>' : '<span class="ink-blank" aria-label="missing word">___</span>');
}
function storyView(mission) {
  const done=active.index===active.questions.length;
  const q=question();
  const complete=q&&active.found.size===q.targets.length;
  const content=done
    ? `<h2>You brought the words back!</h2><div class="story-scroll">${active.questions.map(page=>'<p>'+restoredText(page,new Set(page.targets))+'</p>').join('')}</div>
      <div class="play-actions"><button class="primary" data-action="readStory" type="button">Read with me</button><button class="quiet" data-action="replay" type="button">Play again</button></div><p id="story-read-note" role="status"></p>${wordReview(active.questions.flatMap(page=>page.targets.map(word=>({word}))))}`
    : `<h2>${esc(q.clue)}</h2><p class="prompt">Read the words. Catch the ones that match.</p>
      <div class="story-scroll"><p>${restoredText(q,active.found)}</p></div>
      <div class="choices story-words" role="group" aria-label="Words to find">${q.options.map(word=>'<button class="option'+(active.found.has(word)?' correct':'')+'" type="button" data-story-word="'+esc(word)+'" '+(active.found.has(word)||complete?'disabled':'')+'>'+esc(word)+'</button>').join('')}</div>
      <p role="status" class="story-status">${esc(active.storyMessage||active.found.size+' of '+q.targets.length+' words found')}</p>
      ${complete?'<div class="play-actions"><button class="primary" data-action="storyNext" type="button">'+(active.index+1===active.questions.length?'Read the story':'Next page')+' →</button></div>':''}`;
  return `<article class="stage mission scene-context"><header class="mission-header"><div><h1 tabindex="-1">Sentence Quest</h1><p class="mission-objective">The Invisible Ink Story</p></div><span class="mission-count">${done?'Story found!':'Page '+(active.index+1)+' of '+active.questions.length}</span></header>
    ${trail(active.questions.length)}<div class="scene-grid"><div class="task">${storyPuzzle()}${content}</div>
    <div>${guideView(mission,null)}${done?'':'<div class="ink-monster" role="img" aria-label="The Word Monster and its spilled ink"></div>'}</div></div></article>`;
}
function storyPuzzle(){
  const total=active.questions.length;
  const placed=active.index;
  return `<div class="story-puzzle" style="--pieces:${total}" role="img" aria-label="${placed} of ${total} picture pieces placed">
    ${Array.from({length:total},(_,index)=>'<span class="'+(index<placed?'piece '+(index===placed-1?'just-fit':''):'')+'" style="--piece-x:'+Math.round(100*index/(total-1))+'%"></span>').join('')}
  </div>`;
}
function catchWord(word) {
  const q=question();
  if(q.targets.includes(word)) {
    active.found.add(word);
    active.storyMessage=active.found.size===q.targets.length?'You found all the words!':'You found '+active.found.size+' of '+q.targets.length+' words.';
  } else {
    active.storyMessage='Try again. Read the word slowly.';
  }
  render();
  (play.querySelector('[data-action=storyNext]')??[...play.querySelectorAll('[data-story-word]:enabled')].find(el=>el.dataset.storyWord===word)??play.querySelector('[data-story-word]:enabled'))?.focus({preventScroll:true});
}
function readStory() {
  stopSound();
  const voice=voiceChoice();
  const paragraphs=[...play.querySelectorAll('.story-scroll p')];
  const note=by('story-read-note');
  if(voice==='teacher') {note.textContent='Take turns reading the story out loud.';return;}
  if(voice==='bundled'){
    if(!((active.settings.book===1&&['all','vowels'].includes(active.settings.group))||(active.settings.book===2&&active.settings.group==='magic'))){
      note.textContent='Read the story out loud together. Choose a US voice in Teacher guide for narration on this trail.';
      return;
    }
    const track=active.settings.book===2?'story-magic':active.settings.group==='all'?'story-mixed':'story-short';
    playBundled(track,soundRequest);
    return;
  }
  const request=soundRequest;
  paragraphs.forEach(line=>{
    const utterance=new SpeechSynthesisUtterance(line.textContent);
    utterance.voice=voice;
    utterance.lang='en-US';
    utterance.rate=.83;
    utterance.onstart=()=>{
      if(request!==soundRequest)return;
      paragraphs.forEach(p=>p.classList.toggle('reading',p===line));
    };
    utterance.onend=()=>line.classList.remove('reading');
    utterance.onerror=event=>{
      if(!['canceled','interrupted'].includes(event.error))note.textContent='Read the story out loud together.';
    };
    speech.speak(utterance);
  });
}
function guideView(mission,verdict){
  const line=verdict===null ? mission.intro : verdict ? mission.win : 'Listen or read again, then try the next one.';
  return `<aside class="scene-guide ${verdict===true?'reacts':''}" aria-label="Mission guide">
    <div class="guide-sprite" role="img" aria-label="${esc(mission.guide)}"></div>
    <div class="guide-speech"><strong>${esc(mission.guide)}</strong>${esc(line)}</div>
  </aside>`;
}
function trail(count){
  return '<ol class="trail" aria-label="Round progress">'+Array.from({length:count},(_,i)=>{
    const state=active.outcomes[i];
    const status=state===undefined?(i===active.index?'current':''):state?'cleared':'revisit';
    const label=state===undefined?(i===active.index?'current':'upcoming'):state?'correct':'revisit';
    return '<li class="'+status+'" aria-label="Question '+(i+1)+', '+label+'">'+(state===true?'✦':state===false?'·':i+1)+'</li>';
  }).join('')+'</ol>';
}
function bridgeProgress(count){
  const finished=active.score;
  return `<div class="bridge-scene">
    <span class="bridge-count">${finished} of ${count} planks</span>
    <div class="bridge-deck ${finished===count?'crossed':''}" aria-hidden="true">
      <div class="bridge-track" style="--plank-count:${count}">${Array.from({length:count},(_,i)=>'<i class="'+(i<finished?'plank':'')+(i===finished-1&&active.verdict===true?' fresh':'')+'"></i>').join('')}</div>
    </div>
  </div>`;
}
function options(q){
  return '<div class="choices" role="group" aria-label="Answer choices">'+q.options.map((key,i)=>{
    const open=active.verdict===true&&key===q.correct;
    const inside=open?'<span class="door-reveal" aria-hidden="true"><span>✦</span>'+esc(q.entry.word)+'</span>':'';
    const pick='<button type="button" data-choice="'+i+'" class="option sound-door'+optionClass(key,q)+(open?' door-open':'')+'" '+(active.verdict===null?'':'disabled')+'>'+inside+'<span class="door-leaf">'+shown(key)+'</span></button>';
    const example=active.verdict===null&&q.samples[i]&&voicePreference!=='teacher'?audioButton(q.samples[i],'Hear an example'):'';
    return '<div class="door-choice">'+pick+example+'</div>';
  }).join('')+'</div>';
}
function optionClass(key,q){
  if(active.verdict===null)return '';
  if(key===q.correct)return ' correct';
  return key===active.selected?' wrong':'';
}
function printedWord(entry) {
  let start=0;
  const chunks=[];
  let finalE=false;
  for (const tile of entry.tiles) {
    const split=tile.endsWith('_e');
    const length=split?1:tile.length;
    const text=entry.word.slice(start,start+length);
    if (text.toLowerCase()!==(split?tile[0]:tile).toLowerCase()) return esc(entry.word);
    chunks.push('<span class="'+(isVowelTile(tile)?'vowel-ink':'')+'">'+esc(text)+'</span>');
    finalE ||= split;
    start+=length;
  }
  if (finalE&&entry.word.slice(start).toLowerCase()==='e') {
    chunks.push('<span class="vowel-ink">'+esc(entry.word.slice(start))+'</span>');
    start++;
  }
  return start===entry.word.length?chunks.join(''):esc(entry.word);
}
function blend(q){
  const tiles=active.spin===true?printedWord(q.entry):'<span>✦</span><span>✦</span><span>✦</span>';
  const controls=active.spin===false
    ? '<button class="primary" type="button" data-action="spin">Spin the reels</button>'
    : active.spin==='turning'
    ? '<p role="status">Spinning…</p>'
    : active.verdict===null
    ? '<div class="teacher-check"><strong>Teacher check</strong><button class="primary" type="button" data-action="readCorrect">Read it!</button><button class="quiet" type="button" data-action="readAgain">Try again</button>'+audioButton(q.entry.word,'Hear the word')+'</div>'
    : '';
  return '<div class="word-reels '+(active.spin==='turning'?'spinning':'')+'" '+(active.spin===true?'role="img" aria-label="'+esc(q.entry.word)+'"':'aria-hidden="true"')+'>'+tiles+'</div>'+controls;
}
function cauldron(){
  const percent=Math.min(91,Math.round(91*active.score/active.questions.length));
  const pouring=active.verdict===true;
  return `<div class="brew-scene ${pouring?'pouring':''} ${active.hatched==='hatching'?'egg-magic':''}">
    <div class="brew-flask" role="img" aria-label="${active.drops} drops in the bottle"><i style="--drops:${active.drops}"></i><span>${active.drops}</span></div>
    <span class="pour-stream" aria-hidden="true"></span>
    <div class="cauldron ${pouring?'brewing':''}" role="img" aria-label="Cauldron with ${active.score} mixes added" style="--fill:${percent}%;--brew-color:${165+active.score*13}"><i></i><b>✦</b><span class="brew-bubbles" aria-hidden="true"><em></em><em></em><em></em><em></em></span></div>
    <span class="egg-stream" aria-hidden="true"></span><span class="potion-egg" aria-label="Dragon egg" role="img">✧</span>
  </div>`;
}
function segment(q){
  if(active.verdict===true)return '<p class="prompt-word mixed-word">'+printedWord(q.entry)+'</p>';
  return `<p class="drop-count" role="status">${active.drops} ${active.drops===1?'drop':'drops'}</p>
    <div class="play-actions"><button class="quiet add-drop" type="button" data-action="drop" ${active.drops>=8?'disabled':''}>💧 Add a drop</button>
    <button class="primary" data-action="brew" type="button" ${active.drops?'':'disabled'}>Pour it in</button>
    <button class="quiet" data-action="clear" type="button" ${active.drops?'':'disabled'}>Start over</button></div>
    <p class="story-status" role="status">${esc(active.boardMessage)}</p>`;
}
function spellingForge(q){
  if(active.verdict!==null)return '<p class="prompt-word">'+esc(q.entry.word)+'</p>';
  let position=0;
  const word=q.mask
    ? [...q.mask].map(letter=>letter==='_'?'<span class="letter-slot">'+esc(active.spelling[position++]??'')+'</span>':esc(letter)).join('')
    : [...active.spelling].map(letter=>'<span class="letter-slot">'+esc(letter)+'</span>').join('');
  return `<div class="forge-word" aria-label="Word so far: ${esc(active.spelling||'empty')}">${word||'&nbsp;'}</div>
    <div class="letter-bank" role="group" aria-label="Letters">${q.letters.map(letter=>'<button class="tile" type="button" data-letter="'+letter+'">'+letter+'</button>').join('')}</div>
    <div class="play-actions"><button class="primary" type="button" data-action="forge" ${active.spelling&&(q.mask?active.spelling.length===q.correct.length:true)?'':'disabled'}>Check</button>
    <button class="quiet" type="button" data-action="erase" ${active.spelling?'':'disabled'}>Take back</button></div>`;
}
function addLetter(letter){
  const q=question();
  if(active.verdict!==null||active.spelling.length>=(q.mask?q.correct.length:16))return;
  active.spelling+=letter;
  render();
  play.querySelector('[data-letter="'+letter+'"]')?.focus({preventScroll:true});
}
function wordReview(entries){
  const words=[...new Map(entries.map(entry=>[entry.word.toLowerCase(),entry])).values()];
  return `<section class="word-review" aria-label="Read the words again"><h2>Read the words again</h2><p>Read a word. Then tap it to see the picture.</p>
    <div class="review-cards">${words.map(entry=>{
      const word=entry.word;
      const picture=entry.nonsense?null:reviewPicture(word);
      const opened=active.revealed.has(word);
      const art=picture?.src?'<img alt="" src="'+esc(picture.src)+'">':'<span class="review-icon" aria-hidden="true">'+esc(picture?.icons??'')+'</span>';
      return `<div class="review-card">${picture?'<button type="button" class="review-flip" data-review-word="'+esc(word)+'" aria-expanded="'+opened+'">'+(opened?art:'<span class="review-curtain" aria-hidden="true">✧</span>')+'<strong>'+esc(word)+'</strong></button>':'<strong class="review-text">'+esc(word)+'</strong>'}
        ${picture?.hint&&opened?'<p>'+esc(picture.hint)+'</p>':''}${entry.nonsense?'':audioButton(word,'Hear it')}</div>`;
    }).join('')}</div></section>`;
}
function result(m){
  const allCorrect=active.score===active.questions.length;
  const mission=active.settings.variant==='flight'?flightMission:missions[m.id];
  const list=active.mistakes.length?'<h3>Words to revisit</h3><ul class="review-list">'+active.mistakes.map(e=>'<li>'+esc(e.word)+'</li>').join('')+'</ul>':'';
  const review=active.mistakes.length?'<button class="primary" type="button" data-action="review">Practice missed words</button>':'';
  const badge=active.earned?'<span class="medal">✦ Room rune collected</span>':'';
  const reveal=m.id==='segment'&&allCorrect?(active.hatched===true
    ? '<div class="dragon-hatch" role="img" aria-label="A baby dragon hatched"></div><p class="potion-reveal" tabindex="-1" id="hatch-result">You hatched a baby dragon!</p>'
    : cauldron()+(active.hatched==='hatching'?'<p class="potion-reveal" role="status">Look! The egg is moving…</p>':'<button class="primary" type="button" data-action="hatch">Pour the potion on the egg</button>')):
    active.settings.variant==='flight'&&allCorrect?'<p class="potion-reveal">Everything is back in its place!</p>':
    m.id==='sort'?'<p class="potion-reveal">The clouds are gone. All the words are home!</p>':
    m.id==='blend'&&allCorrect?bridgeProgress(active.questions.length)+'<p class="potion-reveal">Finn made it across the bridge!</p>':
    m.id==='listen'&&!active.settings.variant&&active.earned?'<div class="bell-reveal" aria-hidden="true">✦</div><p>Orla can ring her bell again!</p>':'';
  const help=active.settings.review?'Review complete.':allCorrect?'You got every word right.':'Try the tricky words again.';
  return `<article class="stage mission scene-${m.id}"><div class="result-scene"><div class="task">
    ${badge}<h1 tabindex="-1">Mission complete</h1><p class="result-score">${active.score} / ${active.questions.length}</p>
    <p>${esc(help)}</p>${reveal}${list}${wordReview(active.questions.map(q=>q.entry))}
    <div class="result-actions">${review}<button class="quiet" type="button" data-action="replay">Play another round</button><button class="quiet" type="button" data-action="lobby">Back to the map</button></div></div>
    ${guideView(mission,allCorrect)}</div></article>`;
}
function awardRune(){
  if(active.settings.review || active.score<goalFor(active.questions.length))return;
  const key=roomKey(active.settings.book,active.settings.mode);
  active.earned=true;
  runes.add(key);
  try {localStorage.setItem(runeKey,JSON.stringify([...runes]));} catch {}
}
function respond(answer,correct){
  const q=question();
  if (active.verdict!==null)return;
  active.selected=answer;
  active.verdict=correct;
  active.outcomes[active.index]=correct;
  if(correct)active.score++;
  else active.mistakes.push(q.entry);
  render();
  by('live').textContent=correct?(q.mode==='flight'?flightMission:missions[q.mode]).win:'The word is '+q.entry.word+'.';
  by('feedback').focus({preventScroll:true});
}
function advance(){
  stopSound();
  active.index++;
  if(active.index===active.questions.length)awardRune();
  active.drops=0;
  active.boardMessage='';
  active.spin=false;
  active.spelling='';
  active.selected=null;
  active.verdict=null;
  active.teacherOpen=false;
  render();
  play.querySelector('h1').focus({preventScroll:true});
}
function focusOption(selector){
  (play.querySelector(selector+':not(:disabled)')??play.querySelector('.tile:not(:disabled)')??play.querySelector('[data-action=check]:not(:disabled)'))?.focus({preventScroll:true});
}
const actions={
  lobby:returnToLobby,
  next:advance,
  replay:()=>start({...active.settings,review:undefined}),
  review:()=>start({...active.settings,review:active.mistakes}),
  clear:()=>{active.drops=0;active.boardMessage='';render();focusOption('[data-action=drop]');},
  drop:()=>{active.drops++;active.boardMessage='';render();focusOption('[data-action=drop]');},
  brew:()=>{
    const q=question();
    if(active.drops===q.correct){respond(active.drops,true);return;}
    active.boardMessage='Try again. Say the word slowly.';
    active.drops=0;
    render();
    focusOption('[data-action=drop]');
  },
  hatch:()=>{
    if(active.hatched)return;
    const session=active;
    active.hatched='hatching';
    render();
    setTimeout(()=>{
      if(active!==session)return;
      active.hatched=true;
      render();
      by('hatch-result')?.focus({preventScroll:true});
    },1150);
  },
  finishSort:()=>{
    active.index=active.questions.length;
    awardRune();
    render();
    play.querySelector('h1')?.focus({preventScroll:true});
  },
  flight:()=>start({...active.settings,variant:'flight',review:undefined}),
  doors:()=>start({...active.settings,variant:undefined,review:undefined}),
  spin:()=>{
    if(active.spin!==false)return;
    const session=active;
    active.spin='turning';
    render();
    setTimeout(()=>{
      if(active!==session)return;
      active.spin=true;
      render();
      play.querySelector('[data-action=readCorrect]')?.focus({preventScroll:true});
    },650);
  },
  readCorrect:()=>{if(active.spin===true)respond(question().entry.word,true);},
  readAgain:()=>{
    by('live').textContent='Say the sounds slowly. Try the whole word again.';
    const heading=play.querySelector('.task h2');
    if(heading)heading.textContent='Try again. Say each sound, then the word.';
  },
  readStory,
  forge:()=>{
    const q=question();
    if(active.spelling)respond(active.spelling,active.spelling===q.correct);
  },
  erase:()=>{
    active.spelling=active.spelling.slice(0,-1);
    render();
    focusOption('[data-action=erase]');
  },
  storyNext:()=>{
    if(active.found.size!==question().targets.length)return;
    active.outcomes[active.index]=true;
    active.score++;
    active.index++;
    if(active.index===active.questions.length)awardRune();
    active.found.clear();
    active.storyMessage='';
    render();
    play.querySelector('h1')?.focus({preventScroll:true});
  },

};

document.addEventListener('click',e=>{
  const button=e.target.closest('button');
  if(!button)return;
  const d=button.dataset;
  if(d.book){selection={...selection,book:Number(d.book),group:defaultFocus[Number(d.book)]};selectionUi();by('book-picker').querySelector('[data-book="'+d.book+'"]').focus();return;}
  if(d.level){selection.level=d.level;selectionUi();by('level-picker').querySelector('[data-level="'+d.level+'"]').focus();return;}
  if(d.game){start({...selection,mode:d.game});return;}
  if('closeGuide' in d){guide.close();return;}
  if(!active)return;
  if(d.audio){say(d.audio);return;}
  if(d.action){actions[d.action]?.();return;}
  if(d.reviewWord){
    if(active.revealed.has(d.reviewWord))active.revealed.delete(d.reviewWord);
    else active.revealed.add(d.reviewWord);
    render();
    [...play.querySelectorAll('[data-review-word]')].find(card=>card.dataset.reviewWord===d.reviewWord)?.focus({preventScroll:true});
    return;
  }
  if(d.letter){addLetter(d.letter);return;}
  const q=question();
  if(d.storyWord){catchWord(d.storyWord);return;}
  if(d.choice!==undefined){
    const chosen=q.options[Number(d.choice)];
    if(q.mode==='flight'&&chosen!==q.correct){
      active.boardMessage='Hear it again. Try another word.';
      render();
      focusOption('[data-choice="'+d.choice+'"]');
      return;
    }
    active.boardMessage='';
    respond(chosen,chosen===q.correct);return;
  }
  if(d.cloud!==undefined){clearCloud(Number(d.cloud));return;}
  if(d.sortWord!==undefined){
    active.selected=Number(d.sortWord);
    active.boardMessage='Now pick its door.';
    render();
    play.querySelector('[data-sort-word="'+d.sortWord+'"]')?.focus({preventScroll:true});
    return;
  }
  if(d.portal!==undefined)sortWord(active.selected,Number(d.portal));
});

play.addEventListener('dragstart',e=>{
  const word=e.target.closest('[data-sort-word]');
  if(!word)return;
  e.dataTransfer.setData('text/x-wordspell-card',word.dataset.sortWord);
  e.dataTransfer.effectAllowed='move';
});
play.addEventListener('dragover',e=>{
  if(e.target.closest('[data-portal]')&&e.dataTransfer.types.includes('text/x-wordspell-card'))e.preventDefault();
});
play.addEventListener('drop',e=>{
  const portal=e.target.closest('[data-portal]');
  const word=e.dataTransfer.getData('text/x-wordspell-card');
  if(!portal||word==='')return;
  e.preventDefault();
  sortWord(Number(word),Number(portal.dataset.portal));
});
by('focus').addEventListener('change',e=>selection.group=e.target.value);
by('teacher').addEventListener('click',()=>{voiceUi();guide.showModal();});
by('voice-select').addEventListener('change',e=>{
  stopSound();
  voicePreference=e.target.value;
  try {localStorage.setItem(voiceStorage,voicePreference);} catch {}
  voiceUi();
  if(active)render();
});
by('voice-preview').addEventListener('click',()=>say('spring',true));
speech?.addEventListener('voiceschanged',voiceUi);
voiceUi();
by('fullscreen').addEventListener('click',async()=>{
  try{
    if(document.fullscreenElement)await document.exitFullscreen();
    else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
  }catch{
    by('live').textContent='Full screen is unavailable in this browser.';
  }
});
by('home').addEventListener('click',e=>{if(active){e.preventDefault();returnToLobby();}});

let customFont;
const classroomFontInput=by('classroom-font');
const classroomFontStatus=by('classroom-font-status');
const resetClassroomFont=by('reset-classroom-font');
classroomFontInput.addEventListener('change',async event=>{
  const file=event.target.files[0];
  if(!file)return;
  try {
    const next=new FontFace('Classroom Letters',await file.arrayBuffer(),{weight:'400 900'});
    await next.load();
    if(classroomFontInput.files[0]!==file)return;
    if(customFont)document.fonts.delete(customFont);
    document.fonts.add(next);
    customFont=next;
    document.documentElement.classList.add('use-classroom-font');
    resetClassroomFont.hidden=false;
    classroomFontStatus.textContent='Practice font loaded for this visit.';
  } catch {
    if(classroomFontInput.files[0]===file)classroomFontStatus.textContent='This font could not be opened.';
  }
});
resetClassroomFont.addEventListener('click',()=>{
  classroomFontInput.value='';
  document.documentElement.classList.remove('use-classroom-font');
  if(customFont)document.fonts.delete(customFont);
  customFont=undefined;
  resetClassroomFont.hidden=true;
  classroomFontStatus.textContent='Default font restored.';
  classroomFontInput.focus();
});
