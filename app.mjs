import {resemblesWord} from './spoken-word.mjs?v=arcade1';
import {mountArcade,registerArcadeClips} from './arcade.mjs?v=arcade4';
import {playSpinSound,playReelStop,stopSpinSound,playVoiceSuccess} from './effects.mjs?v=arcade1';
import {catalog} from './bank.mjs?v=arcade1';
import {modes,levels,createRound,sortingBoard,practiceContrasts,shuffle,choiceLabel,isVowelTile} from './engine.mjs?v=arcade1';

import {missions,flightMission} from './missions.mjs?v=listen-sort';
import {makeStory} from './story.mjs?v=arcade1';
import {reviewPicture} from './review.mjs?v=word-clues';

const by=id=>document.getElementById(id);
const lobby=by('lobby'), play=by('play'), guide=by('guide');
const audio=new Audio();
const flightMusic=by('flight-music');
const flightEffect=new Audio();
flightEffect.volume=.42;
const flightTime={simple:22,medium:19,difficult:16};
const sortTime={simple:18,medium:20,difficult:20};
const flightWarningAt=5000;
let sortClock;
let flightClock;
let flightTransition;
let promptWatchdog;
const musicKey='wordspell-flight-music';
let musicEnabled=true;
let flightPicturesEnabled=true;
let promptPlaying=false;
try {
  musicEnabled=localStorage.getItem(musicKey)!=='off';
  flightPicturesEnabled=localStorage.getItem('wordspell-flight-pictures')!=='off';
} catch {}
flightMusic.volume=.13;
function syncFlightMusic(){
  const inFlight=active?.settings.variant==='flight'&&['live','caught','missed'].includes(active.flightPhase)&&active.index<active.questions.length;
  const teacherSpeaking=voicePreference==='teacher'&&active?.teacherOpen;
  if(inFlight&&musicEnabled&&!document.hidden){
    flightMusic.volume=(promptPlaying||teacherSpeaking) ? .024 : .13;
    if(flightMusic.paused)flightMusic.play().catch(()=>{});
  } else flightMusic.pause();
}
function finishAudioPrompt(request){
  if(request!==soundRequest)return;
  clearTimeout(promptWatchdog);
  promptPlaying=false;
  if(active?.sortPhase==='listening'){
    active.sortPhase='pick';
    updateSortCue();
    startSortClock();
  }
  syncFlightMusic();
}
const defaultFocus={1:'vowels',2:'magic',3:'two'};
const focusOptions=book=>({...catalog[book].groups,...practiceContrasts(book)});
let active;
let selection={book:1,level:'simple',group:defaultFocus[1]};

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const speech='speechSynthesis' in window?window.speechSynthesis:null;
const AudioContextClass=window.AudioContext??window.webkitAudioContext;
const canUseMic=Boolean(AudioContextClass&&navigator.mediaDevices?.getUserMedia);
const loudEnough=.035;
const voiceGoal=75;
let mic;
const voiceStorage='wordspell-voice-v2';
let voicePreference='auto';
try {
  const saved=localStorage.getItem(voiceStorage);
  const teacherReads=localStorage.getItem('wordspell-voice-v1')==='teacher';
  voicePreference=saved??(teacherReads?'teacher':'auto');
} catch {}
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
  if(voicePreference==='teacher')return 'teacher';
  if(voicePreference==='auto')return 'bundled';
  const choices=usVoices();
  return choices.find(v=>v.voiceURI===voicePreference)??choices[0]??'bundled';
}
function voiceUi(){
  const available=usVoices();
  const select=by('voice-select');
  const entries=[['auto','Ana · American English child voice'],['device-auto','Best available browser voice'],...available.map(v=>[v.voiceURI,v.name]),
    ['teacher','Teacher reads']];
  select.innerHTML=entries.map(([value,label])=>'<option value="'+esc(value)+'">'+esc(label)+'</option>').join('');
  select.value=entries.some(([value])=>value===voicePreference)?voicePreference:'auto';
  const voice=voiceChoice();
  by('voice-note').textContent=voice==='teacher'?'Use Teacher word to read the prompt aloud.':
    voice==='bundled'?'Using saved clips of Ana, an American English child voice.':
    'Using '+voice.name+' (US). Preview it to check pacing and pronunciation.';
  by('voice-preview').disabled=voice==='teacher';
}
function stopListening(){
  if(!mic)return;
  const session=mic;
  mic=null;
  cancelAnimationFrame(session.frame);
  if(session.recognizer){session.recognizer.onend=null;session.recognizer.abort();}
  session.stream?.getTracks().forEach(track=>track.stop());
  session.context?.close().catch(()=>{});
}
function stopSound(){
  clearTimeout(promptWatchdog);
  soundRequest++;
  promptPlaying=false;
  audio.pause();
  speech?.cancel();
  if(active?.sortPhase==='listening'){
    active.sortPhase='ready';
    updateSortCue();
  }
}
function playBundled(word,request,rate=1){
  if (request!==soundRequest)return;
  audio.src=new URL('./audio/ana/'+encodeURIComponent(word.toLowerCase())+'.mp3',import.meta.url).href;
  audio.playbackRate=rate;
  audio.onended=()=>finishAudioPrompt(request);
  const unavailable=()=>{
    if(request===soundRequest)by('live').textContent='Audio is unavailable. Open Teacher word to read the prompt.';
    finishAudioPrompt(request);
  };
  audio.onerror=unavailable;
  audio.play().catch(unavailable);
}
function say(word,preview=false,sortPrompt=false){
  stopSound();
  const request=soundRequest;
  if(sortPrompt){
    active.sortPhase='listening';
    updateSortCue();
  }
  const voice=voiceChoice();
  if(voice==='teacher'){
    by('live').textContent='Teacher reads mode is on. Open Teacher word or Teacher recordings.';
    finishAudioPrompt(request);
    return;
  }
  promptPlaying=true;
  if(sortPrompt||active?.settings.variant==='flight')promptWatchdog=setTimeout(()=>finishAudioPrompt(request),6000);
  syncFlightMusic();
  if(voice==='bundled'){playBundled(word,request);return;}
  const message=preview?'Listen carefully. Can you find the word that completes the spell?':word;
  const clip=new SpeechSynthesisUtterance(message);
  clip.voice=voice;
  clip.lang='en-US';
  clip.rate=.92;
  clip.onend=()=>finishAudioPrompt(request);
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
const audioButton=(word,label='Hear the word',forgeIndex)=>'<button class="quiet audio" type="button" data-audio="'+esc(word)+'"'+(forgeIndex===undefined?'':' data-forge-hear="'+forgeIndex+'"')+'><span aria-hidden="true">◖))</span> '+esc(label)+'</button>';
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
const landmarkPositions={
  listen:[18,26,25,13],
  sort:[51,66,75,26],
  blend:[51,23,25,40],
  segment:[83,27,75,54],
  spell:[18,69,25,68],
  context:[83,69,75,82],
};
function renderMap(){
  let earned=0;
  by('game-picker').innerHTML=modes.map((m,i)=>{
    const cleared=runes.has(roomKey(selection.book,m.id));
    earned+=Number(cleared);
    const [x,y,mobileX,mobileY]=landmarkPositions[m.id];
    const title='Mission '+(i+1)+', '+m.title+' · '+missions[m.id].objective;
    return `<button class="map-node ${m.color} ${cleared?'earned':''}" data-game="${m.id}" type="button" aria-label="${esc(title)}" style="--map-x:${x}%;--map-y:${y}%;--mobile-x:${mobileX}%;--mobile-y:${mobileY}%">
      <span class="map-sigil" aria-hidden="true">${i+1}</span>
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
  if(settings.mode==='sort')settings={...settings,sortTimed:settings.sortTimed??true};
  stopSortClock();
  stopFlightRun();
  stopListening();
  stopSound();
  const board=settings.mode==='sort'?sortingBoard(settings):null;
  const questions=board?.cards??(settings.mode==='context'
    ? makeStory(settings).map(page=>({...page,options:shuffle([...page.targets,...page.decoys])}))
    : createRound({...settings,mode:settings.variant==='flight'?'flight':settings.mode}));
  active={settings,questions,index:0,board,sortPhase:'ready',sortRemaining:sortTime[settings.level]*1000,sortStars:0,boardMessage:'',drops:[],hatched:false,mistakes:[],score:0,verdict:null,selected:null,spin:false,micMessage:'',micReady:false,micUnavailable:!canUseMic,spelling:'',forgeStart:0,forgeIndex:0,forgeSolved:new Set(),forgeDrafts:new Map(),forgeStriking:false,forgeMessage:'',forgeHint:null,forgeAttempts:new Map(),revealed:new Set(),found:new Set(),storyMessage:'',teacherOpen:false,outcomes:[],earned:false,flightStarted:performance.now(),flightPhase:'ready',flightRemaining:flightTime[settings.level]*1000};
  lobby.hidden=true;
  play.hidden=false;
  history.replaceState(null,'','#play');
  render();
  syncFlightMusic();
  play.scrollIntoView({block:'start'});
  play.querySelector('h1').focus({preventScroll:true});
}
function returnToLobby(){
  stopSpinSound();
  stopSortClock();
  stopFlightRun();
  stopListening();
  stopSound();
  const last=active?.settings.mode;
  active=null;
  syncFlightMusic();
  play.hidden=true;
  lobby.hidden=false;
  renderMap();
  history.replaceState(null,'','#books');
  if (last) by('game-picker').querySelector('[data-game="'+last+'"]').focus({preventScroll:true});
  by('books').scrollIntoView({block:'start'});
}
function question() {return active.questions[active.settings.mode==='spell'?active.forgeIndex:active.index];}
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
  if(mode.id==='spell'&&index<questions.length){
    play.innerHTML=top+forgeView(mission);
    return;
  }
  if(index>=questions.length){
    play.innerHTML=top+result(mode);
    return;
  }
  const q=question();
  const audioControls=q.audio?(q.mode==='flight'?'':'<div class="play-actions">'+audioButton(q.entry.word)+'</div>')+'<details class="teacher-word" '+(active.teacherOpen?'open':'')+'><summary>Teacher word</summary><p>'+esc(q.entry.word)+'</p>'+'</details>':'';
  let body;
  switch(q.mode){
    case 'blend': body=blend(q);break;
    case 'segment': body=segment(q);break;
    case 'flight': body=flightView(q);break;
    default: body=options(q);
  }
  const verdict=active.verdict;
  const feedback=verdict===null?'':'<div class="answer-feedback '+(verdict?'':'missed')+'" tabindex="-1" id="feedback"><strong>'+esc(verdict?mission.win:mission.miss)+'</strong> <span>'+esc(q.entry.word)+'</span><details class="teacher-word"><summary>Teacher tip</summary><p>'+esc(q.explanation)+'</p></details></div>';
  const next=verdict===null||['flight','blend'].includes(q.mode)?'':'<div class="play-actions"><button class="primary" type="button" data-action="next">'+(index+1===questions.length?'Finish':'Next word')+' →</button>'+audioButton(q.entry.word,'Hear the word')+'</div>';
  const track=mode.id==='blend'?bridgeProgress(questions.length):mode.id==='segment'?cauldron():'';
  play.innerHTML=top+`<article class="stage mission scene-${mode.id}">
    <header class="mission-header"><div><h1 tabindex="-1">${settings.variant==='flight'?'Flying Things':esc(mode.title)}</h1><p class="mission-objective">${esc(mission.objective)}</p></div>
    <span class="mission-count">Word ${index+1} of ${questions.length} · ${active.score} ${esc(mission.reward[active.score===1?0:1])}</span></header>
    ${trail(questions.length)}
    ${mode.id==='listen'?'<div class="flight-picker" role="group" aria-label="Echo Tower games"><button type="button" class="quiet" data-action="doors" aria-pressed="'+(settings.variant!=='flight')+'">Sound Doors</button><button type="button" class="quiet" data-action="flight" aria-pressed="'+(settings.variant==='flight')+'">Flying Things</button></div>':''}
    <div class="scene-grid"><div class="task"><h2>${esc(q.prompt)}</h2>${track}${audioControls}${body}${feedback}${next}</div>${guideView(mission,verdict)}</div>
  </article>`;
  play.querySelector('details')?.addEventListener('toggle',e=>{
    if(active)active.teacherOpen=e.target.open;
    syncFlightMusic();
  });
  play.querySelector('.potion-demo')?.addEventListener('toggle',e=>{if(active)active.demoOpen=e.target.open;});
}
function sortView(mission) {
  const {questions,board,score,sortPhase}=active;
  const canPick=sortPhase==='pick';
  const next=questions[score];
  const placed=questions.slice(0,score);
  return `<article class="stage mission scene-sort"><header class="mission-header"><div><h1 tabindex="-1">The Sorting Hall</h1><p class="mission-objective">Listen and bring the words home.</p></div><span class="mission-count">${score} of ${questions.length} words sorted</span></header>
    <div class="scene-grid"><div class="task">
    <h2>${next?'Hear the word. Tap its box.':'Yay! All the words are home.'}</h2>
    ${next?`<p class="prompt">${esc(board.prompt)} The word will appear when you tap the right box.</p>
      <div class="sort-listen"><span aria-hidden="true">☁</span><button class="quiet audio" type="button" data-action="hearSort">◖)) ${sortPhase==='ready'?'Hear the word':'Hear it again'}</button></div>
      <details class="teacher-word"><summary>Teacher word</summary><p>${esc(next.entry.word)}</p></details>
      <div class="sort-challenge"><button type="button" class="quiet" data-action="toggleSortChallenge" aria-pressed="${Boolean(active.settings.sortTimed)}">Timer ${active.settings.sortTimed?'on':'off'}</button>
      <div class="sort-timer ${active.settings.sortTimed?'':'timer-disabled'}"><span id="sort-clock" role="timer">${sortClockText()}</span><progress id="sort-round-progress" aria-label="Time left for this round" max="${sortTime[active.settings.level]*1000}" value="${active.sortRemaining}"></progress><small>${active.settings.sortTimed?'One clock for all '+questions.length+' words · pauses while you listen':'Countdown paused'}</small></div><span>★ ${active.sortStars}</span></div>`:''}
    ${next?`<p class="sort-cue" role="status" data-phase="${sortPhase}">${sortCueText[sortPhase]}</p>`:''}
    <div class="word-portals" role="group" aria-label="Sound boxes">${board.categories.map((key,index)=>{
      const words=placed.filter(card=>card.correct===key);
      return `<button class="word-portal" type="button" data-portal="${index}" ${next&&canPick?'':'disabled'}><span class="portal-label">${shown(key)}</span><span class="portal-words">${words.map(card=>'<span class="'+(card===placed.at(-1)?'just-sorted':'')+'">'+esc(card.entry.word)+'</span>').join('')}</span></button>`;
    }).join('')}</div>
    <p class="story-status" role="status">${esc(active.boardMessage)}</p>
    ${next?'':'<button class="primary" type="button" data-action="finishSort">Let’s read! →</button>'}
    </div>${guideView(mission,null)}</div></article>`;
}
const sortCueText={
  ready:'Tap “Hear the word” to start.',
  listening:'Listen…',
  pick:'↓ Tap a box! ↓',
};
function updateSortCue(){
  const cue=play.querySelector('.sort-cue');
  if(!cue)return;
  const phase=active.sortPhase;
  cue.dataset.phase=phase;
  cue.textContent=sortCueText[phase];
  play.querySelector('[data-action=hearSort]').textContent=phase==='ready'?'◖)) Hear the word':'◖)) Hear it again';
  play.querySelectorAll('[data-portal]').forEach(box=>{box.disabled=phase!=='pick';});
}
function sortClockText(){
  if(!active.settings.sortTimed)return 'Timer off';
  return active.sortRemaining>0?Math.ceil(active.sortRemaining/1000)+' seconds left':'Time’s up. Keep sorting!';
}
function stopSortClock(){
  clearInterval(sortClock);
}
function startSortClock(){
  stopSortClock();
  if(!active.settings.sortTimed||active.sortPhase!=='pick'||active.sortRemaining<=0||document.hidden)return;
  const round=active;
  let last=performance.now();
  sortClock=setInterval(()=>{
    const now=performance.now();
    if(active!==round||round.sortPhase!=='pick'){stopSortClock();return;}
    if(!document.hidden&&!guide.open&&!play.querySelector('.scene-sort .teacher-word[open]')){
      round.sortRemaining=Math.max(0,round.sortRemaining-(now-last));
      const clock=by('sort-clock');
      if(clock&&clock.textContent!==sortClockText())clock.textContent=sortClockText();
      const progress=by('sort-round-progress');if(progress)progress.value=round.sortRemaining;
      if(!round.sortRemaining)stopSortClock();
    }
    last=now;
  },100);
}
function hearSort(){
  const next=active.questions[active.score];
  if(next){
    stopSortClock();
    say(next.entry.word,false,true);
  }
}
function sortWord(portal) {
  const next=active.questions[active.score];
  if(active.sortPhase!=='pick'||!next)return;
  if(next.correct!==active.board.categories[portal]){
    active.boardMessage='Try another box. You can hear the word again.';
    play.querySelector('.story-status').textContent=active.boardMessage;
    return;
  }
  stopSortClock();
  const bonus=active.settings.sortTimed&&active.sortRemaining>0;
  if(bonus)active.sortStars++;
  active.score++;
  active.sortPhase='ready';
  active.boardMessage=bonus?'That word is home! ★ Bonus star!':'That word is home!';
  const following=active.questions[active.score];
  render();
  if(following){
    hearSort();
    focusOption('[data-action=hearSort]');
  } else focusOption('[data-action=finishSort]');
}
function flightPicture(word){
  const picture=reviewPicture(word);
  if(!picture)return '';
  if(picture.atlas)return '<span class="storybook-clue" aria-hidden="true" style="'+(picture.sheet?'background-image:url('+esc(picture.sheet)+');':'')+'background-position:'+picture.x+'% '+picture.y+'%"></span>';
  return picture.src?'<img src="'+esc(picture.src)+'" alt="" class="flying-object">':
    '<span class="flight-picture-icon" aria-hidden="true">'+esc(picture.icons)+'</span>';
}
const flightSpeeds=[6.8,8.1,7.2,8.8,7.6];
const flightPhases=[0.8,5.2,2.8,6.1,1.7];
function flightFade(remaining){
  return .28+.72*Math.min(1,remaining/flightWarningAt);
}
function updateFlightClock(){
  const remaining=active.flightRemaining;
  const clock=by('flight-clock');
  if(clock)clock.value=remaining;
  const seconds=by('flight-seconds');
  if(seconds)seconds.textContent=Math.ceil(remaining/1000)+' s';
  play.querySelector('.flying-yard')?.style.setProperty('--flight-opacity',flightFade(remaining));
  const warning=by('flight-warning');
  const message=remaining<=flightWarningAt?'Almost gone!':'';
  if(warning&&warning.textContent!==message)warning.textContent=message;
}
function flightView(q){
  const {flightPhase,flightStarted,flightPausedAt}=active;
  const waiting=flightPhase==='ready';
  const paused=flightPhase==='paused';
  const flying=flightPhase==='live';
  const shelf=active.outcomes.flatMap((correct,i)=>correct?[i]:[]);
  const elapsed=((paused?flightPausedAt:performance.now())-flightStarted)/1000;
  const controls=waiting?'<button type="button" class="primary" data-action="startFlight">Start flight</button>':
    paused?'<button type="button" class="primary" data-action="resumeFlight">Resume</button>':
    flying?'<button type="button" class="quiet" data-action="pauseFlight">Pause</button>'+audioButton(q.entry.word,'Hear again'):'';
  const ready=waiting?'<p>Listen for five words, one at a time. Catch each one before it flies away.</p>':'';
  const remaining=Math.max(0,Math.ceil(active.flightRemaining/1000));
  return `<div class="flight-toolbar">${controls}<button type="button" class="quiet flight-picture-toggle" data-action="toggleFlightPictures" aria-pressed="${flightPicturesEnabled}" aria-label="Picture clues">Picture clues ${flightPicturesEnabled?'on':'off'}</button><button type="button" class="quiet flight-music-toggle" data-action="toggleMusic" aria-pressed="${musicEnabled}" aria-label="Background music">♫ Music ${musicEnabled?'on':'off'}</button></div>
    ${ready}<div class="flight-time">${waiting?'':'<label for="flight-clock">Time left</label><progress id="flight-clock" value="'+active.flightRemaining+'" max="'+(flightTime[active.settings.level]*1000)+'"></progress><span id="flight-seconds">'+remaining+' s</span><strong id="flight-warning" role="status">'+(flying&&active.flightRemaining<=flightWarningAt?'Almost gone!':'')+'</strong>'}</div>
    <div class="flying-yard ${waiting||paused?'flight-paused':''} ${flightPhase==='missed'?'flight-escaping':''}" style="--flight-opacity:${flightFade(active.flightRemaining)}" role="group" aria-label="Flying words">${q.options.map((word,i)=>{
      const caught=flightPhase==='caught'&&word===q.correct;
      const timing='--duration:'+flightSpeeds[i]+'s;--offset:'+(-(flightPhases[i]+elapsed))+'s';
      return '<div class="flight-lane" style="'+timing+'"><button type="button" class="flying-tag'+(caught?' caught':'')+'" data-choice="'+i+'" '+(flying?'':'disabled')+'>'+(flightPicturesEnabled?flightPicture(word):'')+'<span>'+esc(word)+'</span></button></div>';
    }).join('')}</div>
    <p class="story-status flight-status" role="status">${esc(active.boardMessage)}</p>
    <div class="object-shelf" aria-label="${shelf.length} ${shelf.length===1?'word':'words'} caught">${shelf.map(i=>{
      const word=active.questions[i].entry.word;
      return '<span class="flight-trophy '+(i===active.index?'just-landed':'')+'">'+flightPicture(word)+'<span>'+esc(word)+'</span></span>';
    }).join('')}</div>`;
}
function stopFlightRun(){
  clearInterval(flightClock);
  clearTimeout(flightTransition);
  flightEffect.pause();
}
function playFlightEffect(correct){
  flightEffect.src=new URL('./audio/flight-'+(correct?'catch':'try')+'.mp3',import.meta.url).href;
  flightEffect.play().catch(()=>{});
}
function startFlight(){
  if(active.flightPhase!=='ready')return;
  const session=active;
  let last=performance.now();
  active.flightPhase='live';
  active.flightStarted=last;
  render();
  say(question().entry.word);
  focusOption('[data-action=pauseFlight]');
  flightClock=setInterval(()=>{
    const now=performance.now();
    if(active===session&&active.flightPhase==='live'&&!promptPlaying&&!document.hidden&&!(voicePreference==='teacher'&&active.teacherOpen)){
      active.flightRemaining=Math.max(0,active.flightRemaining-(now-last));
      updateFlightClock();
      if(active.flightRemaining===0)missFlyingWord();
    }
    last=now;
  },100);
}
function pauseFlight(){
  if(active.flightPhase!=='live')return;
  active.flightPhase='paused';
  active.flightPausedAt=performance.now();
  stopSound();
  syncFlightMusic();
  render();
  focusOption('[data-action=resumeFlight]');
}
function resumeFlight(){
  if(active.flightPhase!=='paused')return;
  active.flightStarted+=performance.now()-active.flightPausedAt;
  active.flightPhase='live';
  render();
  say(question().entry.word);
  focusOption('[data-action=pauseFlight]');
}
function queueFlightWord(){
  const session=active;
  flightTransition=setTimeout(()=>{
    if(active!==session)return;
    advance();
  },1150);
}
function missFlyingWord(){
  active.flightPhase='missed';
  active.boardMessage='That word flew away. Listen for the next one.';
  respond(null,false);
  queueFlightWord();
}
function catchFlyingWord(button,word){
  const start=button.getBoundingClientRect();
  stopSound();
  active.flightPhase='caught';
  syncFlightMusic();
  respond(word,true);
  playFlightEffect(true);
  const caught=play.querySelector('.flying-tag.caught');
  const landing=play.querySelector('.object-shelf .just-landed');
  if(caught&&landing){
    const lane=caught.parentElement.getBoundingClientRect();
    const end=landing.getBoundingClientRect();
    caught.style.setProperty('--caught-x',start.left-lane.left+'px');
    caught.style.setProperty('--caught-y',start.top-lane.top+'px');
    caught.style.setProperty('--shelf-x',end.left-start.left+'px');
    caught.style.setProperty('--shelf-y',end.top-start.top+'px');
  }
  queueFlightWord();
}
function nextStoryTarget(page,found){
  return page.ordered?page.targets.find(word=>!found.has(word)):undefined;
}
function restoredText(page,found) {
  const next=nextStoryTarget(page,found);
  return esc(page.sentence).replace(/\{([^}]+)\}/g,(_,word)=>{
    const key=word.toLowerCase();
    if(found.has(key))return '<strong class="sentence-insert">'+word+'</strong>';
    return key===next?'<span class="ink-blank ink-blank-next" aria-label="Fill this blank next">___</span>':
      '<span class="ink-blank" aria-label="missing word">___</span>';
  });
}
function storyIllustration(page){
  if(page.art)return '<img class="story-art" src="./assets/story-'+esc(page.art)+'.webp" alt="'+esc(page.imageAlt)+'">';
  if(page.sledPanel!==undefined){
    const x=page.sledPanel%3*50;
    const y=page.sledPanel<3?0:100;
    return `<span class="story-art sled-art" role="img" aria-label="${esc(page.imageAlt)}" style="background-position:${x}% ${y}%"></span>`;
  }
  return '';
}
function storyView(mission) {
  const done=active.index===active.questions.length;
  const q=question();
  const complete=q&&active.found.size===q.targets.length;
  const content=done
    ? `<h2>You brought the words back!</h2><div class="story-scroll">${active.questions.map(page=>'<figure class="restored-page">'+storyIllustration(page)+'<p>'+restoredText(page,new Set(page.targets))+'</p></figure>').join('')}</div>
      <div class="play-actions"><button class="primary" data-action="readStory" type="button">Read with me</button><button class="quiet" data-action="replay" type="button">Play again</button></div><p id="story-read-note" role="status"></p>${wordReview(active.questions.flatMap(page=>page.targets.map(word=>({word}))),true)}`
    : `<h2>${esc(q.clue)}</h2>${q.anchor?`<div class="story-clue"><strong>Example word: ${esc(q.anchor)}</strong>${audioButton(q.anchor,'Hear the example')}</div>`:''}
      <p class="story-directions">${q.ordered?'Tap the word that fits the highlighted blank. Some choices match the sound clue but don’t fit the story.':(q.anchor?'Use the example to help you. ':'')+(q.anchor&&q.middle&&!q.matchSpelling?'Read the choices. Tap the words with the same sound in the middle.':'Read the choices. Tap the words that match the clue.')+' The words you tap go in the blanks.'}</p>
      <div class="story-scroll"><figure class="restored-page">${storyIllustration(q)}<p>${restoredText(q,active.found)}</p></figure></div>
      <div class="choices story-words" role="group" aria-label="Words to find">${q.options.map(word=>'<button class="option'+(active.found.has(word)?' correct':'')+'" type="button" data-story-word="'+esc(word)+'" '+(active.found.has(word)||complete?'disabled':'')+'>'+esc(word)+'</button>').join('')}</div>
      <p role="status" class="story-status">${esc(active.storyMessage||active.found.size+' of '+q.targets.length+' words found')}</p>
      ${complete?'<div class="play-actions"><button class="primary" data-action="storyNext" type="button">'+(active.index+1===active.questions.length?'Read the story':'Next page')+' →</button></div>':''}`;
  return `<article class="stage mission scene-context"><header class="mission-header"><div><h1 tabindex="-1">Sentence Quest</h1><p class="mission-objective">The Invisible Ink Story</p></div><span class="mission-count">${done?'Story found!':'Page '+(active.index+1)+' of '+active.questions.length}</span></header>
    ${trail(active.questions.length)}<div class="scene-grid"><div class="task">${done?'':storyPuzzle()}${content}</div>
    <div>${guideView(mission,null)}${done?'':'<div class="ink-monster" role="img" aria-label="The Word Monster and its spilled ink"></div>'}</div></div></article>`;
}
function storyPuzzle(){
  const placed=active.index;
  return `<div class="story-panels" aria-label="${placed} of ${active.questions.length} pages restored">
    ${active.questions.map((page,index)=>'<div class="story-panel '+(index===placed-1?'just-fit':'')+'">'+(index<placed?(storyIllustration(page)||'<span aria-hidden="true">✓</span>'):'<span aria-hidden="true">✧</span>')+'</div>').join('')}
  </div>`;
}
function catchWord(word) {
  const q=question();
  const next=nextStoryTarget(q,active.found);
  if(active.found.has(word)||active.found.size===q.targets.length)return;
  if(q.ordered?word===next:q.targets.includes(word)) {
    active.found.add(word);
    active.storyMessage=active.found.size===q.targets.length?'You found all the words!':'You found '+active.found.size+' of '+q.targets.length+' words.';
  } else {
    active.storyMessage=q.ordered?'Read the sentence and look at the picture. Which word fits this blank?':
      q.middle?'Try again. Say the word and listen to its middle sound.':'Try again. Read the word and look for the clue pattern.';
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
    if(active.settings.book===3&&active.settings.group==='two'){
      playBundled('story-sled-'+active.settings.level,soundRequest,.88);
      return;
    }
    if(!((active.settings.book===1&&['all','vowels'].includes(active.settings.group))||(active.settings.book===2&&active.settings.group==='magic'))){
      note.textContent='Read the story out loud together. Choose a US voice in Teacher guide for narration on this trail.';
      return;
    }
    const track=active.settings.book===2?'story-magic-v2':active.settings.group==='all'?'story-mixed-v2':'story-short-v2';
    playBundled(track,soundRequest,.88);
    return;
  }
  const request=soundRequest;
  paragraphs.forEach(line=>{
    const utterance=new SpeechSynthesisUtterance(line.textContent);
    utterance.voice=voice;
    utterance.lang='en-US';
    utterance.rate=.75;
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
      <div class="bridge-track" style="--plank-count:${count}">${Array.from({length:count},(_,i)=>{
        const placing=i===finished-1&&active.verdict===true;
        return '<span class="bridge-slot"><i class="'+(i<finished?'plank':'')+(placing?' fresh':'')+'"></i>'+
          (placing?'<span class="finn-at-work" style="--steps:'+i+'"><span class="finn-carrying"></span></span>':'')+'</span>';
      }).join('')}</div>
    </div>
  </div>`;
}
function options(q){
  const showExamples=active.settings.level==='simple';
  const exampleFor=i=>active.verdict===null&&q.samples[i]&&q.samples[i]!==q.entry.word&&voicePreference!=='teacher';
  const choices='<div class="choices" role="group" aria-label="Answer choices">'+q.options.map((key,i)=>{
    const open=active.verdict===true&&key===q.correct;
    const inside=open?'<span class="door-reveal" aria-hidden="true"><span>✦</span>'+esc(q.entry.word)+'</span>':'';
    const pick='<button type="button" data-choice="'+i+'" class="option sound-door'+optionClass(key,q)+(open?' door-open':'')+'" '+(active.verdict===null?'':'disabled')+'>'+inside+'<span class="door-leaf">'+shown(key)+'</span></button>';
    const example=showExamples&&exampleFor(i)?audioButton(q.samples[i],'Hear an example'):'';
    return '<div class="door-choice">'+pick+example+'</div>';
  }).join('')+'</div>';
  if(showExamples||!q.options.some((_,i)=>exampleFor(i)))return choices;
  return choices+'<details class="teacher-note"><summary>Need sound examples?</summary><div class="play-actions">'+q.options.map((key,i)=>exampleFor(i)?audioButton(q.samples[i],'Example for '+choiceLabel(key)):'').join('')+'</div></details>';
}
function optionClass(key,q){
  if(active.verdict===null)return '';
  if(key===q.correct)return ' correct';
  return key===active.selected?' wrong':'';
}
function wordChunks(entry) {
  let start=0;
  const chunks=[];
  let finalE=false;
  const letters=()=>[...entry.word].map(text=>({text,vowel:isVowelTile(text)}));
  for (const tile of entry.tiles) {
    const split=tile.endsWith('_e');
    const length=split?1:tile.length;
    const text=entry.word.slice(start,start+length);
    if (text.toLowerCase()!==(split?tile[0]:tile).toLowerCase()) return letters();
    chunks.push({text,vowel:isVowelTile(tile)});
    finalE ||= split;
    start+=length;
  }
  if (finalE&&entry.word.slice(start).toLowerCase()==='e') {
    chunks.push({text:entry.word.slice(start),vowel:true});
    start++;
  }
  return start===entry.word.length?chunks:letters();
}
function printedWord(entry){
  return wordChunks(entry).map(({text,vowel})=>'<span class="'+(vowel?'vowel-ink':'')+'">'+esc(text)+'</span>').join('');
}
function blend(q){
  const chunks=wordChunks(q.entry);
  const spinning=active.spin==='turning';
  const settled=active.spin===true;
  const reel=({text,vowel},index)=>{
    const glyphs=vowel?'aeiou':'brmsft';
    const strip=spinning?'<span class="reel-strip" aria-hidden="true">'+[...glyphs+glyphs[0]].map(letter=>'<span>'+letter+'</span>').join('')+'</span>':'';
    return '<span class="reel-window '+(spinning?'reel-running':'')+(vowel?' vowel-ink':'')+'" data-reel="'+index+'"><span class="reel-face">'+(settled||spinning?esc(text):'✦')+'</span>'+strip+'</span>';
  };
  const canSpin=active.spin===false;
  const controls=spinning?'<p role="status">Spinning…</p>':
    settled&&active.verdict===null?readControls(q):'';
  return `<div class="reel-machine">
    <div class="word-reels" ${settled?'role="img" aria-label="'+esc(q.entry.word)+'"':'aria-hidden="true"'}>${chunks.map(reel).join('')}</div>
    <button class="spin-lever ${spinning?'pulled':''}" type="button" data-action="spin" aria-label="Pull the lever to spin" ${canSpin?'':'disabled'}><span class="lever-arm" aria-hidden="true"></span><span class="lever-copy">Pull</span></button>
  </div>${controls}`;
}
function readControls(q){
  const ready=active.micReady;
  const fallback=active.micUnavailable;
  const status=active.micMessage||(fallback?'Mic unavailable. Your teacher can still check your reading.':'Tap Start mic when you’re ready to read.');
  const next=active.index+1===active.questions.length?'Finish':'Next word';
  return `<div class="read-controls">
    ${fallback?'':`<div class="voice-meter ${ready?'heard':''}" style="--voice-goal:${voiceGoal}%">
      <div class="voice-meter-top"><strong id="voice-meter-label">Voice power</strong><span>${ready?'✓ You did it!':'Aim for the star!'}</span></div>
      <div class="voice-track"><meter id="voice-level" aria-labelledby="voice-meter-label" min="0" max="100" value="${ready?100:0}"></meter><span class="voice-goal" aria-hidden="true">★</span></div>
    </div>`}
    <p class="mic-status ${ready?'voice-success':''}" role="status" tabindex="-1">${esc(status)}</p>
    ${fallback||ready?'':`<button class="quiet" type="button" data-action="${mic?'cancelMic':'readMic'}">${mic?'Stop mic':'Start mic'}</button>`}
    <div class="teacher-check" role="group" aria-label="Teacher check"><strong>Teacher check</strong>
      <button class="primary" type="button" data-action="readCorrect" ${ready||fallback?'':'disabled'}>${next} →</button>
      <button class="quiet" type="button" data-action="readAgain">Try again</button>${audioButton(q.entry.word,'Hear the word')}
    </div></div>`;
}
async function startMic(){
  if(!canUseMic||mic||!active.spin||active.verdict!==null||active.micReady||active.micUnavailable)return;
  stopSound();
  const round=active;
  const session={heard:false,matched:false};
  mic=session;
  round.micMessage='Allow the mic when your browser asks.';
  if(round.spin===true){
    render();
    play.querySelector('.mic-status')?.focus({preventScroll:true});
  }
  try {
    session.context=new AudioContextClass();
    await session.context.resume();
    if(mic!==session)return;
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:false}});
    if(mic!==session){stream.getTracks().forEach(track=>track.stop());return;}
    session.stream=stream;
    const analyser=session.context.createAnalyser();
    analyser.fftSize=2048;
    session.context.createMediaStreamSource(stream).connect(analyser);
    const samples=new Float32Array(analyser.fftSize);
    let heardSince=null;
    const listen=now=>{
      if(mic!==session)return;
      if(round.spin!==true){
        session.frame=requestAnimationFrame(listen);
        return;
      }
      analyser.getFloatTimeDomainData(samples);
      const rms=Math.sqrt(samples.reduce((sum,value)=>sum+value*value,0)/samples.length);
      const meter=by('voice-level');
      if(meter)meter.value=Math.min(100,voiceGoal*rms/loudEnough);
      heardSince=rms>=loudEnough?(heardSince??now):null;
      if(heardSince!==null&&now-heardSince>=150){
        session.heard=true;
        if(session.matched){finishSpokenWord(round);return;}
        const status=play.querySelector('.mic-status');
        if(status&&!session.recognitionUnavailable)status.textContent='I can hear you! Say the whole word: '+question().entry.word+'.';
      }
      session.frame=requestAnimationFrame(listen);
    };
    stream.getAudioTracks().forEach(track=>track.addEventListener('ended',()=>{
      if(mic===session)micUnavailable(round);
    }));
    const Recognition=window.SpeechRecognition??window.webkitSpeechRecognition;
    if(Recognition){
      const recognizer=new Recognition();
      session.recognizer=recognizer;
      recognizer.lang='en-US';recognizer.interimResults=true;recognizer.continuous=true;recognizer.maxAlternatives=3;
      recognizer.onresult=event=>{
        if(mic!==session||active!==round)return;
        const results=Array.from(event.results).slice(event.resultIndex);
        const said=results.flatMap(result=>Array.from(result).map(a=>a.transcript));
        if(said.some(text=>resemblesWord(text,question().entry.word))){
          session.matched=true;
          finishSpokenWord(round);
        }else{
          round.micMessage='I heard “'+said[0]?.trim()+'”. Try saying '+question().entry.word+' again.';
          const status=play.querySelector('.mic-status');if(status)status.textContent=round.micMessage;
        }
      };
      const fallback=()=>{
        if(mic!==session)return;
        session.recognitionUnavailable=true;
        round.micUnavailable=true;
        round.micMessage='Word checking is unavailable here. Teacher: listen to the whole word and confirm below.';
        render();
      };
      recognizer.onerror=fallback;
      recognizer.onend=()=>{if(mic===session&&!session.matched&&!session.recognitionUnavailable){try{recognizer.start();}catch{fallback();}}};
      try{recognizer.start();}catch{fallback();}
    }else{
      session.recognitionUnavailable=true;round.micUnavailable=true;
    }
    round.micMessage=session.recognitionUnavailable?'Word checking is unavailable here. Teacher: listen to the whole word and confirm below.':'Say each sound, then read the whole word clearly.';
    if(round.spin===true){
      render();
      play.querySelector('.mic-status')?.focus({preventScroll:true});
    }
    session.frame=requestAnimationFrame(listen);
  } catch {
    if(mic===session)micUnavailable(round);
  }
}
function finishSpokenWord(round){
  stopListening();
  round.micReady=true;
  round.micMessage='Your voice powered the bridge! You can stop now. Teacher: check the reading, then click Next.';
  playVoiceSuccess();
  render();
  focusOption('[data-action=readCorrect]');
}
function micUnavailable(round){
  stopListening();
  round.micUnavailable=true;
  round.micMessage='Mic unavailable. Your teacher can still check your reading.';
  if(round.spin===true){
    render();
    focusOption('[data-action=readCorrect]');
  }
}
function cauldron(){
  const percent=Math.min(91,Math.round(91*active.score/active.questions.length));
  const pouring=active.verdict===true;
  return `<div class="brew-scene ${pouring?'pouring':''} ${active.hatched==='hatching'?'egg-magic':''}">
    <div class="brew-flask" role="img" aria-label="${active.drops.length} drops in the bottle"><i style="--drops:${active.drops.length}"></i><span>${active.drops.length}</span></div>
    <span class="pour-stream" aria-hidden="true"></span>
    <div class="cauldron ${pouring?'brewing':''}" role="img" aria-label="Cauldron with ${active.score} mixes added" style="--fill:${percent}%;--brew-color:${165+active.score*13}"><i></i><b>✦</b><span class="brew-bubbles" aria-hidden="true"><em></em><em></em><em></em><em></em></span></div>
    <span class="egg-stream" aria-hidden="true"></span><span class="potion-egg" aria-label="Dragon egg" role="img">✧</span>
  </div>`;
}
function potionTileLabel(tile){
  return tile.endsWith('_e')?tile[0]+'…e':tile;
}
function segment(q){
  if(active.verdict===true)return '<p class="prompt-word mixed-word">'+printedWord(q.entry)+'</p>';
  const drops=active.drops;
  const full=drops.length===q.correct.length;
  const split=drops.some(tile=>tile.endsWith('_e'));
  return `<p class="potion-instructions">Listen to the word. Say each sound as you tap its tile.${q.tiles.length>new Set(q.correct).size?' Some tiles are extra.':''}</p>
    <details class="teacher-word potion-demo" ${active.demoOpen?'open':''}><summary>Show me an example</summary>
      <p>Hear <strong>ship</strong>. Say each sound and tap <strong>sh</strong>, <strong>i</strong>, then <strong>p</strong>. The letters <strong>sh</strong> work together for one sound.</p>
      ${audioButton('ship','Hear ship')}
    </details>
    <ol class="potion-slots" aria-label="Sounds in order">
      ${q.correct.map((_,index)=>{
        const tile=drops[index];
        const label=tile?.endsWith('_e')?tile[0]:tile;
        return `<li class="${tile?'filled':''} ${tile&&isVowelTile(tile)?'vowel':''}">${label?esc(label):'<span class="empty-sound" aria-label="Empty sound">·</span>'}</li>`;
      }).join('')}
      ${split?'<li class="filled vowel" aria-label="Silent e at the end">e</li>':''}
    </ol>
    <div class="potion-bank" role="group" aria-label="Choose sound tiles">
      ${q.tiles.map(tile=>`<button class="tile ${isVowelTile(tile)?'vowel':''}" type="button" data-potion-tile="${esc(tile)}" ${tile.endsWith('_e')?'aria-label="'+choiceLabel(tile)+'"':''} ${full?'disabled':''}>${esc(potionTileLabel(tile))}</button>`).join('')}
    </div>
    <div class="play-actions">
      <button class="primary" data-action="brew" type="button" ${full?'':'disabled'}>Pour into the pot</button>
      <button class="quiet" data-action="undoDrop" type="button" ${drops.length?'':'disabled'}>Take back a tile</button>
    </div>
    <p class="story-status" role="status">${esc(active.boardMessage)}</p>`;
}
function forgeBatch(){
  const size=active.settings.level==='simple'?2:3;
  return active.questions.slice(active.forgeStart,active.forgeStart+size);
}
function swordView(){
  const done=active.index>=active.questions.length;
  const built=done?active.questions.length:active.forgeStart+(active.forgeStriking?forgeBatch().length:0);
  const progress=Math.round(100*built/active.questions.length);
  const prior=Math.round(100*active.forgeStart/active.questions.length);
  return `<div class="forge-anvil ${active.forgeStriking?'hammering':''} ${done?'sword-complete':''}" role="img" aria-label="Sword ${progress}% forged" style="--forged:${progress}%;--prior:${prior}%">
    <span class="magic-sword"><i class="sword-grip"></i><i class="sword-guard"></i><i class="sword-blade"></i></span>
    <span class="anvil-shape"></span><span class="forge-sparks">✦ · ✧ · ✦</span><span class="forge-hammer"></span>
  </div>`;
}
function forgeView(mission){
  const batch=forgeBatch();
  const ready=batch.every((_,i)=>active.forgeSolved.has(active.forgeStart+i));
  const heading=active.forgeStriking?'Watch the sword grow!':ready?'All the words are ready!':'Listen and fix these words.';
  const cards=batch.map((q,i)=>{
    const index=active.forgeStart+i;
    const solved=active.forgeSolved.has(index);
    const label=solved?q.entry.word:q.mask??'Word '+(index+1);
    return `<div class="forge-card ${solved?'repaired':''}"><button class="quiet" type="button" data-forge-card="${index}" aria-pressed="${index===active.forgeIndex&&!ready}" ${solved||active.forgeStriking?'disabled':''}>${esc(label)}</button>
      ${audioButton(q.entry.word,'Hear word '+(index+1),index)}</div>`;
  }).join('');
  const q=question();
  return `<article class="stage mission scene-spell">
    <header class="mission-header"><div><h1 tabindex="-1">Spelling Forge</h1><p class="mission-objective">${esc(mission.objective)}</p></div><span class="mission-count">${active.score} of ${active.questions.length} words fixed</span></header>
    <div class="scene-grid"><div class="task"><h2>${heading}</h2>${swordView()}
      <div class="forge-cards" role="group" aria-label="Words on the workbench">${cards}</div>
      ${ready?'<button class="primary" type="button" data-action="strikeAnvil" '+(active.forgeStriking?'disabled':'')+'>Strike the anvil</button>':
        '<p class="prompt">'+(q.mask?'Fill in the missing letters.':'Tap letters to build the whole word.')+'</p>'+spellingForge(q)+'<details class="teacher-word"><summary>Teacher word</summary><p>'+esc(q.entry.word)+'</p><p>'+esc(q.entry.sentence.replace('___',q.entry.word))+'</p></details>'}
      <p class="story-status" role="status">${esc(active.forgeMessage)}</p>
    </div>${guideView(mission,null)}</div></article>`;
}
function selectForgeCard(index){
  if(active.forgeSolved.has(index)||active.forgeStriking)return;
  active.forgeDrafts.set(active.forgeIndex,active.spelling);
  active.forgeIndex=index;
  active.spelling=active.forgeDrafts.get(index)??'';
  active.forgeMessage='';
  active.forgeHint=null;
  render();
  play.querySelector('[data-forge-card="'+index+'"]')?.focus({preventScroll:true});
}
function spellingHint(draft,target,attempt){
  let start=0;
  while(start<draft.length&&draft[start]===target[start])start++;
  let end=draft.length;
  let targetEnd=target.length;
  while(end>start&&targetEnd>start&&draft[end-1]===target[targetEnd-1]){
    end--;
    targetEnd--;
  }
  const missing=target.slice(start,targetEnd);
  const doubled=start===end&&missing.length===1&&(draft[start-1]===missing||draft[start]===missing);
  let message='Say the word slowly. Check the marked letters.';
  if(doubled){
    message=attempt>1?`Use two ${missing} letters together here.`:'A letter needs to be doubled at the marked spot.';
  } else if(!missing){
    message=end-start===1?'Take out the extra letter.':'Take out the extra letters.';
  } else if(start===end){
    message=missing.length===1?'One letter is missing here.':'Letters are missing here.';
  }
  if(attempt>1&&missing&&!doubled){
    message=`Try “${missing[0]}” at the marked spot.`;
  }
  return {start,end,message};
}
function checkForgeWord(){
  if(!active.spelling||active.forgeStriking||active.forgeSolved.has(active.forgeIndex))return;
  const q=question();
  if(active.spelling!==q.correct){
    const attempt=(active.forgeAttempts.get(active.forgeIndex)??0)+1;
    active.forgeAttempts.set(active.forgeIndex,attempt);
    active.forgeHint=spellingHint(active.spelling,q.correct,attempt);
    active.forgeMessage='';
    render();
    play.querySelector('.forge-hint')?.focus({preventScroll:true});
    return;
  }
  active.forgeDrafts.delete(active.forgeIndex);
  active.forgeHint=null;
  active.forgeSolved.add(active.forgeIndex);
  active.outcomes[active.forgeIndex]=true;
  active.score++;
  const next=forgeBatch().findIndex((_,i)=>!active.forgeSolved.has(active.forgeStart+i));
  if(next!==-1)active.forgeIndex=active.forgeStart+next;
  active.spelling=active.forgeDrafts.get(active.forgeIndex)??'';
  active.forgeMessage='You fixed '+q.entry.word+'!';
  render();
  (play.querySelector('[data-action=strikeAnvil]')??play.querySelector('[data-forge-card="'+active.forgeIndex+'"]'))?.focus({preventScroll:true});
}
function strikeAnvil(){
  const size=forgeBatch().length;
  if(active.forgeStriking||!forgeBatch().every((_,i)=>active.forgeSolved.has(active.forgeStart+i)))return;
  const session=active;
  active.forgeStriking=true;
  active.forgeMessage='';
  render();
  setTimeout(()=>{
    if(active!==session)return;
    active.forgeStart+=size;
    active.index=active.forgeStart;
    active.forgeIndex=active.forgeStart;
    active.forgeStriking=false;
    if(active.index===active.questions.length)awardRune();
    render();
    play.querySelector('h1')?.focus({preventScroll:true});
  },window.matchMedia('(prefers-reduced-motion: reduce)').matches?300:1350);
}
function spellingForge(q){
  let position=0;
  const hint=active.forgeHint;
  const slot=(letter,index)=>{
    const marked=hint&&index>=hint.start&&index<hint.end;
    return '<span class="letter-slot'+(marked?' needs-fix':'')+'">'+esc(letter??'')+'</span>';
  };
  const word=q.mask
    ? [...q.mask].map(letter=>letter==='_'?slot(active.spelling[position],position++):esc(letter)).join('')
    : Array.from({length:active.spelling.length+1},(_,index)=>{
      const gap=hint&&hint.start===hint.end&&index===hint.start?'<span class="letter-slot needs-fix missing-letter" aria-label="Missing letters"></span>':'';
      return gap+(index<active.spelling.length?slot(active.spelling[index],index):'');
    }).join('');
  return `<div class="forge-word" aria-label="Word so far: ${esc(active.spelling||'empty')}">${word||'&nbsp;'}</div>
    ${hint?`<div class="forge-hint" role="status" tabindex="-1"><span>${esc(hint.message)}</span>${audioButton(q.entry.word,'Hear the word again')}</div>`:''}
    <div class="letter-bank" role="group" aria-label="Letters">${q.letters.map(letter=>'<button class="tile" type="button" data-letter="'+letter+'">'+letter+'</button>').join('')}</div>
    <div class="play-actions"><button class="primary" type="button" data-action="forge" ${active.spelling&&(q.mask?active.spelling.length===q.correct.length:true)?'':'disabled'}>Check</button>
    <button class="quiet" type="button" data-action="erase" ${active.spelling?'':'disabled'}>Take back</button></div>`;
}
function addLetter(letter){
  const q=question();
  if(active.verdict!==null||active.forgeStriking||active.forgeSolved.has(active.forgeIndex)||active.spelling.length>=(q.mask?q.correct.length:16))return;
  active.spelling+=letter;
  active.forgeHint=null;
  render();
  play.querySelector('[data-letter="'+letter+'"]')?.focus({preventScroll:true});
}
function wordReview(entries,storyOnly=false){
  const words=[...new Map(entries.map(entry=>[entry.word.toLowerCase(),entry])).values()];
  return `<section class="word-review" aria-label="Read the words again"><h2>Read the words again</h2><p>${storyOnly?'Read each word, then tap Hear it to check.':'Read a word. Then tap it to see the picture.'}</p>
    <div class="review-cards">${words.map(entry=>{
      const word=entry.word;
      const clue=entry.nonsense?null:reviewPicture(word);
      const picture=clue;
      const opened=active.revealed.has(word);
      const art=picture?.atlas?'<span class="storybook-clue review-atlas" aria-hidden="true" style="'+(picture.sheet?'background-image:url('+esc(picture.sheet)+');':'')+'background-position:'+picture.x+'% '+picture.y+'%"></span>':picture?.src?'<img alt="" src="'+esc(picture.src)+'">':'<span class="review-icon" aria-hidden="true">'+esc(picture?.icons??'')+'</span>';
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
    m.id==='sort'?'<p class="potion-reveal">The clouds are gone. All the words are home!</p>'+(active.sortStars?'<p>★ '+active.sortStars+' bonus '+(active.sortStars===1?'star':'stars')+'</p>':''):
    m.id==='spell'?swordView()+'<p class="potion-reveal">The magic sword is ready!</p>':
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
  stopListening();
  stopSound();
  active.index++;
  active.flightStarted=performance.now();
  if(active.settings.variant==='flight'){
    active.flightPhase=document.hidden?'paused':'live';
    active.flightPausedAt=active.flightStarted;
    active.flightRemaining=flightTime[active.settings.level]*1000;
  }
  if(active.index===active.questions.length){
    stopFlightRun();
    awardRune();
  }
  active.drops=[];
  active.boardMessage='';
  active.spin=false;
  active.micMessage='';
  active.micReady=false;
  active.spelling='';
  active.selected=null;
  active.verdict=null;
  active.teacherOpen=false;
  render();
  if(active.settings.variant==='flight'&&active.flightPhase==='live'&&active.index<active.questions.length){
    say(question().entry.word);
    focusOption('[data-action=pauseFlight]');
  } else {
    syncFlightMusic();
    play.querySelector('h1').focus({preventScroll:true});
  }
}
function focusOption(selector){
  (play.querySelector(selector+':not(:disabled)')??play.querySelector('.tile:not(:disabled)')??play.querySelector('[data-action=check]:not(:disabled)'))?.focus({preventScroll:true});
}
const actions={
  lobby:returnToLobby,
  next:advance,
  replay:()=>start({...active.settings,review:undefined}),
  review:()=>start({...active.settings,review:active.mistakes}),
  undoDrop:()=>{
    active.drops.pop();
    active.boardMessage='';
    render();
    focusOption('[data-potion-tile]');
  },
  brew:()=>{
    const q=question();
    if(active.drops.length!==q.correct.length)return;
    if(q.correct.every((tile,index)=>tile===active.drops[index])){respond(active.drops,true);return;}
    active.boardMessage='Try again. Say the sounds slowly, from first to last.';
    active.drops=[];
    render();
    focusOption('[data-potion-tile]');
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
  hearSort,
  toggleSortChallenge:()=>{
    active.settings.sortTimed=!active.settings.sortTimed;
    render();
    startSortClock();
    focusOption('[data-action=toggleSortChallenge]');
  },
  finishSort:()=>{
    if(active.score!==active.questions.length)return;
    stopSortClock();
    stopSound();
    active.index=active.questions.length;
    awardRune();
    render();
    play.querySelector('h1')?.focus({preventScroll:true});
  },
  startFlight,
  pauseFlight,
  resumeFlight,
  toggleFlightPictures:()=>{
    flightPicturesEnabled=!flightPicturesEnabled;
    try {localStorage.setItem('wordspell-flight-pictures',flightPicturesEnabled?'on':'off');} catch {}
    render();
    focusOption('[data-action=toggleFlightPictures]');
  },
  toggleMusic:()=>{
    musicEnabled=!musicEnabled;
    try {localStorage.setItem(musicKey,musicEnabled?'on':'off');} catch {}
    const toggle=play.querySelector('.flight-music-toggle');
    toggle.textContent='♫ Music '+(musicEnabled?'on':'off');
    toggle.setAttribute('aria-pressed',String(musicEnabled));
    syncFlightMusic();
  },
  flight:()=>{if(active.settings.variant!=='flight')start({...active.settings,variant:'flight',review:undefined});},
  doors:()=>{if(active.settings.variant==='flight')start({...active.settings,variant:undefined,review:undefined});},
  spin:()=>{
    if(active.spin!==false)return;
    const session=active;
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    active.spin='turning';
    playSpinSound();
    render();
    const reels=[...play.querySelectorAll('[data-reel]')];
    reels.forEach((reel,index)=>setTimeout(()=>{
      if(active!==session||active.spin!=='turning')return;
      reel.classList.remove('reel-running');
      reel.classList.add('reel-stopped');
      playReelStop(index);
      if(index===reels.length-1){
        stopSpinSound();
        playReelStop(index+1);
        active.spin=true;
        render();
        setTimeout(()=>{if(active===session&&active.spin===true)startMic();},250);
        play.querySelector('.mic-status')?.focus({preventScroll:true});
      }
    },motion?60+index*70:520+index*260));
  },
  readMic:startMic,
  cancelMic:()=>{
    stopListening();
    active.micMessage='Listening stopped.';
    render();
    focusOption('[data-action=readMic]');
  },
  readCorrect:()=>{
    if(active.spin!==true||active.verdict!==null||!(active.micReady||active.micUnavailable))return;
    stopListening();
    const round=active;
    const index=round.index;
    respond(question().entry.word,true);
    setTimeout(()=>{
      if(active===round&&round.index===index)advance();
    },matchMedia('(prefers-reduced-motion: reduce)').matches?600:1550);
  },
  readAgain:()=>{
    stopListening();
    active.micReady=false;
    if(!active.micUnavailable){startMic();return;}
    active.micMessage='Say each sound, then read the word.';
    render();
    focusOption('[data-action=readCorrect]');
  },
  readStory,
  forge:checkForgeWord,
  strikeAnvil,
  erase:()=>{
    active.spelling=active.spelling.slice(0,-1);
    active.forgeHint=null;
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
  if(d.audio){
    if(d.forgeHear!==undefined)selectForgeCard(Number(d.forgeHear));
    if(mic){stopListening();active.micMessage='Mic stopped. Tap Start mic when you are ready.';render();}
    say(d.audio);
    return;
  }
  if(d.potionTile){
    const q=question();
    if(active.verdict!==null||!q.tiles.includes(d.potionTile)||active.drops.length>=q.correct.length)return;
    active.drops.push(d.potionTile);
    active.boardMessage='';
    render();
    focusOption(active.drops.length===q.correct.length?'[data-action=brew]':'[data-potion-tile="'+d.potionTile+'"]');
    return;
  }
  if(d.action){actions[d.action]?.();return;}
  if(d.reviewWord){
    if(active.revealed.has(d.reviewWord))active.revealed.delete(d.reviewWord);
    else active.revealed.add(d.reviewWord);
    render();
    [...play.querySelectorAll('[data-review-word]')].find(card=>card.dataset.reviewWord===d.reviewWord)?.focus({preventScroll:true});
    return;
  }
  if(d.letter){addLetter(d.letter);return;}
  if(d.forgeCard!==undefined){selectForgeCard(Number(d.forgeCard));return;}
  const q=question();
  if(d.storyWord){catchWord(d.storyWord);return;}
  if(d.choice!==undefined){
    const chosen=q.options[Number(d.choice)];
    if(q.mode==='flight'){
      if(active.flightPhase!=='live')return;
      if(chosen===q.correct){
        active.boardMessage='';
        catchFlyingWord(button,chosen);
      } else {
        active.boardMessage='Hear it again. Catch the word you heard.';
        play.querySelector('.flight-status').textContent=active.boardMessage;
        playFlightEffect(false);
        button.classList.remove('wrong-catch');
        requestAnimationFrame(()=>button.classList.add('wrong-catch'));
      }
      return;
    }
    active.boardMessage='';
    respond(chosen,chosen===q.correct);return;
  }
  if(d.portal!==undefined)sortWord(Number(d.portal));
});

let leverStart;
play.addEventListener('pointerdown',event=>{
  const lever=event.target.closest('.spin-lever:not(:disabled)');
  if(!lever||!event.isPrimary||event.button!==0)return;
  leverStart={lever,y:event.clientY,id:event.pointerId};
  lever.setPointerCapture(event.pointerId);
});
play.addEventListener('pointermove',event=>{
  if(leverStart?.id!==event.pointerId)return;
  const angle=Math.min(50,Math.max(0,event.clientY-leverStart.y));
  leverStart.lever.style.setProperty('--pull',angle+'deg');
});
play.addEventListener('pointerup',event=>{
  if(leverStart?.id!==event.pointerId)return;
  const {lever,y}=leverStart;
  leverStart=null;
  lever.style.removeProperty('--pull');
  if(event.clientY-y>18)actions.spin();
});
play.addEventListener('lostpointercapture',event=>{
  if(leverStart?.id!==event.pointerId)return;
  leverStart.lever.style.removeProperty('--pull');
  leverStart=null;
});
by('focus').addEventListener('change',e=>selection.group=e.target.value);
by('teacher').addEventListener('click',()=>{voiceUi();guide.showModal();});
by('voice-select').addEventListener('change',e=>{
  stopSound();
  voicePreference=e.target.value;
  try {localStorage.setItem(voiceStorage,voicePreference);} catch {}
  voiceUi();
  syncFlightMusic();
  if(active)render();
});
by('voice-preview').addEventListener('click',()=>say('spring',true));
speech?.addEventListener('voiceschanged',voiceUi);
document.addEventListener('visibilitychange',()=>{
  if(active?.settings.mode==='sort')startSortClock();
  if(document.hidden&&mic)actions.cancelMic();
  if(document.hidden&&active?.settings.variant==='flight'&&active.flightPhase==='live')pauseFlight();
  else syncFlightMusic();
});
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
let fontRequest=0;
const classroomFontKey='wordspell-classroom-font-v1';
const classroomFontInput=by('classroom-font');
const classroomFontStatus=by('classroom-font-status');
const resetClassroomFont=by('reset-classroom-font');

function readClassroomFont(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=()=>reject(reader.error);
    reader.readAsDataURL(file);
  });
}
async function applyClassroomFont(data,request){
  const encoded=data.split(',')[1];
  if(!encoded)throw Error('Font data is empty');
  const bytes=Uint8Array.from(atob(encoded),character=>character.charCodeAt(0));
  const next=await new FontFace('Classroom Letters',bytes,{weight:'400 900'}).load();
  if(request!==fontRequest)return false;
  if(customFont)document.fonts.delete(customFont);
  document.fonts.add(next);
  const canvas=document.createElement('canvas');
  const sample=canvas.getContext('2d');
  sample.font='700 28px "Classroom Letters", sans-serif';
  sample.fillText('abc cat 123',6,38);
  if(!sample.getImageData(0,0,canvas.width,canvas.height).data.some((value,index)=>index%4===3&&value>0)){
    document.fonts.delete(next);
    if(customFont)document.fonts.add(customFont);
    throw Error('Font preview is blank');
  }
  customFont=next;
  document.documentElement.classList.add('use-classroom-font');
  resetClassroomFont.hidden=false;
  return true;
}
classroomFontInput.addEventListener('change',async event=>{
  const file=event.target.files[0];
  if(!file)return;
  const request=++fontRequest;
  try {
    const data=await readClassroomFont(file);
    if(!await applyClassroomFont(data,request))return;
    try {
      localStorage.setItem(classroomFontKey,data);
      classroomFontStatus.textContent='Classroom font applied and saved in this browser.';
    } catch {
      classroomFontStatus.textContent='Classroom font applied for this visit.';
    }
  } catch {
    if(request===fontRequest)classroomFontStatus.textContent='This font could not be displayed.';
  }
});
resetClassroomFont.addEventListener('click',()=>{
  fontRequest++;
  classroomFontInput.value='';
  document.documentElement.classList.remove('use-classroom-font');
  if(customFont)document.fonts.delete(customFont);
  customFont=undefined;
  try {localStorage.removeItem(classroomFontKey);} catch {}
  resetClassroomFont.hidden=true;
  classroomFontStatus.textContent='Default font restored.';
  classroomFontInput.focus();
});
try {
  const savedFont=localStorage.getItem(classroomFontKey);
  if(savedFont)applyClassroomFont(savedFont,fontRequest).then(applied=>{
    if(applied)classroomFontStatus.textContent='Using the classroom font saved in this browser.';
  }).catch(()=>{
    if(fontRequest===0)localStorage.removeItem(classroomFontKey);
  });
} catch {}

const atmosphere=document.createElement('div');
atmosphere.className='map-atmosphere';
atmosphere.setAttribute('aria-hidden','true');
atmosphere.innerHTML=Array.from({length:22},(_,i)=>'<span class="map-star" style="left:'+(23+(i*17)%70)+'%;top:'+(2+(i*7)%19)+'%;--duration:'+(3+i%5)+'s;--delay:-'+(i*.73)+'s">✦</span>').join('')+
  Array.from({length:5},(_,i)=>'<i class="map-smoke" style="--delay:-'+i*1.1+'s"></i>').join('')+
  [[18,25],[20,36],[45,61],[49,64],[80,63],[83,61]].map(([x,y],i)=>'<i class="map-window" style="--x:'+x+'%;--y:'+y+'%;--delay:-'+i+'s"></i>').join('');
document.querySelector('.map').prepend(atmosphere);
registerArcadeClips(['neck', 'fish', 'chess', 'puff', 'lodge', 'bats', 'string', 'cut', 'snap', 'cue', 'foot', 'street', 'fly', 'phone', 'dry', 'flew', 'bike', 'skate', 'sled', 'stop', 'mat', 'ridge', 'pat', 'my', 'fudge', 'pass', 'long', 'crew', 'shop', 'book', 'jam', 'glad', 'witch', 'doll', 'that', 'drum', 'boat', 'me', 'note', 'pie', 'rain', 'plane', 'back', 'play', 'gate', 'chip', 'rule', 'puppy', 'pin', 'plant', 'met', 'baby', 'split', 'cake', 'cat', 'green', 'cute', 'cook', 'hutch', 'cube', 'cot', 'flap', 'story-sled-medium', 'catch', 'frog', 'ring', 'plan', 'map', 'match', 'skip', 'pool', 'fang', 'hot', 'blotch', 'sick', 'story-sled-difficult', 'rang', 'time', 'sun', 'trap', 'chop', 'ham', 'roll', 'kite', 'grab', 'stretch', 'story-sled-simple', 'huff', 'crab', 'beach', 'red', 'chin', 'train', 'spot', 'toll', 'ben', 'spring', 'muss', 'coat', 'sit', 'sip', 'few', 'flag', 'step', 'swim', 'spray', 'hill', 'team', 'pig', 'beds', 'bat', 'these', 'stove', 'bunny', 'pen', 'edge', 'smile', 'home', 'bed', 'yellow', 'sin', 'etch', 'yell', 'fetch', 'theme', 'spin', 'brick', 'snow', 'float', 'splash', 'tie', 'brave', 'tape', 'hats', 'cap', 'scab', 'sleep', 'cup', 'strap', 'ten', 'sock', 'ram', 'bridge', 'press', 'clue', 'yard', 'clip', 'ball', 'block', 'cliff', 'kiss', 'light', 'night', 'stripe', 'clap', 'smell', 'pete', 'ran', 'glass', 'graph', 'sing', 'spoon', 'sang', 'story-magic-v2', 'dream', 'snack', 'grow', 'trail', 'boss', 'bell', 'doff', 'scrape', 'slide', 'skin', 'duck', 'zip', 'look', 'moon', 'this', 'gull', 'candy', 'badge', 'wall', 'mule', 'yes', 'strip', 'thin', 'gaff', 'food', 'bone', 'soon', 'gap', 'tall', 'dress', 'miss', 'pot', 'rope', 'tiff', 'grin', 'ship', 'thick', 'lids', 'sky', 'crack', 'suit', 'seeds', 'day', 'rock', 'fan', 'van', 'scrap', 'scrub', 'fruit', 'trip', 'story-short-v2', 'story-mixed-v2', 'flute', 'happy', 'seed', 'cats', 'black', 'slip', 'fill', 'den', 'spruce', 'shy']);
mountArcade({
  getSettings:()=>({...selection}),
  enter:()=>{returnToLobby();lobby.hidden=true;play.hidden=false;history.replaceState(null,'','#arcade');play.scrollIntoView({block:'start'});},
  exit:returnToLobby,
  speak:word=>say(word),
  stopSpeech:stopSound
});
