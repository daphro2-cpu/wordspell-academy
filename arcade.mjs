import {fitBookLabels,watchBookLabels} from './book-labels.mjs?v=labels9';
import {bindFlashlightInput} from './flashlight-input.mjs?v=touch7';
import {cueFor} from './sound-cues.mjs?v=pace6';
import {createBookReader} from './book-reading.mjs?v=voice8';
import {playVoiceSuccess} from './effects.mjs?v=arcade1';
import {moleIsUp} from './burrow-state.mjs?v=burrows1';
import {availableTopics,buildArcadeQuestion,labelSound,labelPattern,practicePool} from './arcade-bank.mjs?v=pace6';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const music=new Audio('./audio/warm-magic.mp3');
music.loop=true;music.volume=.1;
const effect=new Audio();
effect.volume=.36;
let current,clock,foxTimer,bookReader,stopFittingBooks;
const roundVoice=new Audio();roundVoice.volume=.9;let announcement=0;
const memory=new Map();
function readMemory(key){
  if(memory.has(key))return memory.get(key);
  let saved=[];
  try{saved=JSON.parse(localStorage.getItem(key)??'[]');}catch{}
  if(!Array.isArray(saved))saved=[];
  memory.set(key,saved);
  return saved;
}
function chooseEntries(entries,count,state){
  const unique=[...new Map(entries.map(e=>[e.word,e])).values()];
  const key='wordspell-arcade-words-'+state.book+'-'+state.level;
  const seen=readMemory(key);
  const sorted=shuffle(unique).sort((a,b)=>seen.lastIndexOf(a.word)-seen.lastIndexOf(b.word));
  const result=sorted.slice(0,count);
  for(const e of result){
    const previous=seen.indexOf(e.word);
    if(previous!==-1)seen.splice(previous,1);
    seen.push(e.word);
  }
  try{localStorage.setItem(key,JSON.stringify(seen.slice(-800)));}catch{}
  return result;
}
function fx(correct){
  effect.pause();effect.src='./audio/flight-'+(correct?'catch':'try')+'.mp3';effect.play().catch(()=>{});
}
function setMusic(){
  if(current&&current.music&&!current.speaking&&!current.paused&&!document.hidden&&current.phase!=='setup'&&current.phase!=='done')music.play().catch(()=>{});
  else music.pause();
}
function cleanup(){
  stopFittingBooks?.();stopFittingBooks=null;
  clearInterval(clock);clearTimeout(foxTimer);music.pause();effect.pause();announcement++;roundVoice.pause();roundVoice.onended=null;bookReader?.stop();
}
function stop(){
  cleanup();current=null;
}
export function mountArcade({getSettings,enter,exit,speak,stopSpeech}){
  const lobby=document.getElementById('lobby'),host=document.getElementById('play');
  bookReader=createBookReader({canRead:()=>current?.phase==='done'&&!current.manualReading&&!current.bookFlying&&!current.bookModelPlaying&&performance.now()>=(current.bookQuietUntil??0),onLevel:level=>{const meter=host.querySelector('#book-voice-level');if(meter){meter.value=level;meter.classList.toggle('loud-enough',level>=60);}},onRead:()=>sendBookHome('voice'),onStatus:message=>{const status=host.querySelector('#book-mic-status');if(status)status.textContent=message;const toggle=host.querySelector('[data-arcade-action="bookMic"]');if(toggle)toggle.textContent=bookReader?.listening?'Pause microphone':'Start microphone';}});
  const section=document.createElement('section');
  section.className='arcade-launch';
  section.innerHTML='<h2>After dark at the academy</h2><div class="arcade-entrances"><button type="button" data-arcade-open="mole"><span class="entrance-sprite mole-sprite" aria-hidden="true"></span><strong>Whack-a-Mole</strong><span>Find the different sound or spelling.</span></button><button type="button" data-arcade-open="flashlight"><span class="entrance-sprite fox-sprite" aria-hidden="true"></span><strong>Flashlight Library</strong><span>Shine a light. Find the matching words.</span></button></div>';
  lobby.append(section);
  function launch(game){
    cleanup();enter();
    const settings=getSettings();
    current={...settings,game,kind:'sound',task:'all',topic:null,phase:'setup',round:0,score:0,missed:[],retry:[],found:new Set(),revealed:new Set(),music:true,paused:false,timed:true,message:'',focusIndex:0,readWords:new Set(),bookFlying:false,manualReading:false,wave:0,pinnedSound:null,lastSpokenCue:null};
    const topics=availableTopics(current.book,current.kind,current.game);
    current.topic=topics[0]?.key;
    render();
    host.querySelector('h1')?.focus();
  }
  section.addEventListener('click',event=>{
    const button=event.target.closest('[data-arcade-open]');
    if(button)launch(button.dataset.arcadeOpen);
  });
  function heading(){
    return '<div class="game-nav"><button type="button" class="quiet" data-arcade-action="exit">← Academy map</button><strong>Book '+current.book+' · '+({simple:'Simple',medium:'Medium',difficult:'Difficult'}[current.level])+'</strong></div><article class="stage arcade-stage"><header><div><h1 tabindex="-1">'+(current.game==='mole'?(current.kind==='spelling'||current.task==='odd'?'Odd One Out':'Whack All Matches'):'Flashlight Library')+'</h1><p>'+(current.game==='mole'?'Help the garden moles untangle their word signs.':'Help Finn find the enchanted books.')+'</p></div><span>'+current.score+' '+(current.game==='mole'?'moles helped':'books found')+'</span></header>';
  }
  function topicOptions(topics){
    const groups=[...new Set(topics.map(t=>t.category??'Practice focus'))];
    return groups.map(group=>'<optgroup label="'+esc(group)+'">'+topics.filter(t=>(t.category??'Practice focus')===group).map(t=>'<option value="'+esc(t.key)+'" '+(t.key===current.topic?'selected':'')+'>'+esc(t.label)+'</option>').join('')+'</optgroup>').join('');
  }
  function reviewBookcase(){
    const words=[...new Set(current.collected)];
    const allLit=words.length>0&&words.every(w=>current.readWords.has(w));
    return '<section class="book-review '+(allLit?'all-lit':'')+'" aria-label="Read and light your books"><p id="book-read-status" role="status">'+(allLit?'Every book is glowing! Wonderful reading!':current.readWords.size+' of '+words.length+' books returned')+'</p><div class="returned-bookshelf" aria-label="Books returned to the shelf">'+words.map((w,i)=>'<span class="shelf-book-slot" data-shelf-slot="'+i+'"></span>').join('')+'</div><div class="reading-control"><strong id="current-read-word">'+(allLit?'All books are home!':'Read aloud: '+esc(words.find(w=>!current.readWords.has(w))??''))+'</strong><label data-book-voice-meter>Voice power — reach the star, then pause <meter id="book-voice-level" min="0" max="100" value="0" low="60" high="60" optimum="80"></meter><span aria-hidden="true">★</span></label><p id="book-mic-status" role="status">Getting the microphone ready…</p><button type="button" class="quiet" data-arcade-action="bookMic">Start microphone</button><button type="button" class="quiet" data-arcade-action="bookTeacher">Teacher check — no microphone</button><button type="button" class="primary" data-arcade-action="bookConfirm" hidden>Read correctly — send book home</button></div><div class="review-bookcase">'+words.map((word,index)=>'<div class="review-book-slot"><div class="review-book '+(current.readWords.has(word)?'is-returned':index===words.findIndex(w=>!current.readWords.has(w))?'is-current':'')+'" data-review-book="'+index+'" role="img" aria-label="Book: '+esc(word)+'" style="--book-x:'+(index%3)*50+'%;--book-y:'+Math.floor(index%6/3)*100+'%;--word-length:'+word.length+'"><strong>'+esc(word)+'</strong><span class="book-read-star" aria-hidden="true">✦</span></div>'+(clipWords.has(word)?'<button class="quiet book-model" type="button" data-review-model="'+index+'" aria-label="Hear '+esc(word)+'">◖)) Hear it</button>':'')+'</div>').join('')+'</div><p class="book-review-note">Read each highlighted word aloud. The microphone checks volume; your teacher checks the reading.</p></section>';
  }
  function render(){
    if(!current)return;
    let content='';
    const topics=availableTopics(current.book,current.kind,current.game);
    if(current.phase==='setup'){
      const words=practicePool(current.book,current.level).length;
      content='<div class="arcade-setup"><div><h2>Choose your challenge</h2><p role="status">'+esc(current.message)+'</p><label>Listen for a sound or look for a spelling?<select aria-label="Challenge type" data-arcade-setting="kind"><option value="sound" '+(current.kind==='sound'?'selected':'')+'>Sound — compare what you hear</option><option value="spelling" '+(current.book===1&&current.game==='mole'?'disabled ':'')+(current.kind==='spelling'?'selected':'')+'>Spelling — compare the letters</option></select></label><p class="mode-explanation">'+(current.kind==='sound'?'Sound: compare pronunciation. Practice a focused contrast, such as short e vs. short i or /ts/ vs. /dz/. Different spellings can make the same sound.':'Spelling: in the mole garden, catch an incorrect spelling and learn the rule. In the library, find a named sound AND spelling, such as long u /yoo/ spelled u_e, as in cute. The dot stands for a consonant.')+'</p>'+(current.game==='mole'&&current.kind==='sound'?'<label>Game task<select aria-label="Game task" data-arcade-setting="task"><option value="all" '+(current.task==='all'?'selected':'')+'>Whack all matching words</option><option value="odd" '+(current.task==='odd'?'selected':'')+'>Odd one out</option></select></label>':'')+'<label>Practice focus<select aria-label="Practice focus" data-arcade-setting="topic">'+topicOptions(topics)+'</select></label><p>Choose a comparison to practice only those sounds, or choose a target sound. Words rotate across plays.</p>'+(current.book===1&&current.game==='mole'?'<p>Spelling-rule challenges start in Book 2.</p>':'')+'<label class="arcade-check"><input type="checkbox" data-arcade-setting="timed" '+(current.timed?'checked':'')+'>Gentle countdown</label><button type="button" class="primary" data-arcade-action="begin">Let’s explore →</button></div><div class="arcade-preview"><span class="'+(current.game==='mole'?'mole-sprite':'fox-sprite')+'"></span></div></div>';
    }else if(current.phase==='done'){
      content='<div class="arcade-finish"><div class="fox-sprite celebrating" aria-hidden="true"></div><h2>The academy is glowing!</h2><p>'+current.score+' '+(current.game==='mole'?'moles helped.':'words found. Now read them aloud!')+'</p><p>Read aloud to send the magic books back to their shelves!</p>'+reviewBookcase()+'<button class="primary" type="button" data-arcade-action="replay">Explore new words →</button></div>';
    }else{
      const q=current.question;
      const topic=q.focusLabel??(current.kind==='spelling'?labelPattern(q.topic):labelSound(q.topic));
      const spokenCue=cueFor(q,current.game,current.kind);
      const prompt=q.prompt??(current.game==='mole'&&current.kind==='sound'?spokenCue.label:current.game==='mole'?'Which word has a different '+(current.kind==='spelling'?'spelling pattern?':q.position==='middle'||q.position==='vowel'?'vowel sound?':q.position==='final y'?'sound for final y?':q.position==='anywhere'?'target sound?':q.position+' sound?'):'Find every word with '+topic+'.');
      const clue=q.clue??(current.game==='mole'&&current.kind==='sound'?'Whack all the matches. Leave the other sounds alone.':current.game==='mole'?'The others '+(current.kind==='spelling'?'use '+topic+'.':(q.position==='vowel'?'have the '+topic+' sound.':q.position==='middle'?'have '+topic+' in the middle.':q.position==='final y'?'have '+topic+'.':q.position==='anywhere'?'contain the '+topic+' sound.':'have '+topic+' at the '+q.position+'.')):'Touch or drag to move your light. Lift your finger to read. Tap a matching word to collect it.');
      const canNext=current.phase==='cleared';
      const columns=current.game==='flashlight'?Math.ceil(q.options.length/2):q.options.length;
      content='<div class="arcade-instructions"><strong class="mode-badge">'+(current.kind==='sound'?'SOUND · Compare what you hear':'SPELLING · Compare the written letters')+'</strong><h2>'+esc(prompt)+'</h2><p>'+esc(clue)+'</p>'+(current.game==='mole'?'<p class="pop-instruction">Watch the holes. Whack every matching word. Missed moles come back!</p>':'')+'</div><div class="arcade-toolbar"><button type="button" class="quiet" data-arcade-action="pause">'+(current.paused?'Resume':'Pause')+'</button><button type="button" class="quiet" data-arcade-action="music">♫ Music '+(current.music?'on':'off')+'</button><button type="button" class="quiet" data-arcade-action="help">Help me compare</button><span>Round '+Math.min(current.round+1,current.total)+' of '+current.total+(current.game==='mole'&&current.kind==='sound'&&current.task==='all'?' · Set '+(current.wave+1)+' of 3':'')+'</span>'+(current.timed?'<span class="arcade-clock" role="timer">Time <b>'+Math.ceil(current.remaining/1000)+'</b> s</span>':'')+'</div><div class="arcade-field '+current.game+' '+(current.paused?'paused':'')+' '+(canNext?'cleared':'')+' '+(current.phase==='expired'?'expired':'')+'" style="--beam-x:50%;--beam-y:50%;--columns:'+columns+'" aria-label="'+(current.game==='mole'?'Mole garden':'Explore the library with your flashlight')+'">'+
        '<div class="library-door" aria-hidden="true">'+(canNext?'✦':'')+'</div>'+
        q.options.map((entry,index)=>'<button type="button" class="arcade-word '+(current.found.has(entry.word)?'collected':'')+' '+(current.revealed.has(entry.word)?'discovered':'')+'" style="--column:'+(current.game==='mole'?index%3:index%columns)+';--row:'+Math.floor(index/(current.game==='mole'?3:columns))+';--delay:'+index*.17+'s" data-arcade-word="'+index+'" '+(current.paused||current.phase!=='playing'||current.found.has(entry.word)?'disabled':'')+' aria-label="'+esc(entry.word)+'">'+(current.game==='mole'?'<span class="burrow-back" aria-hidden="true"></span><span class="mole-window"><span class="mole-rise"><span class="mole-sprite" aria-hidden="true"></span>':'<span class="book-spine" aria-hidden="true"></span>')+'<span class="word-sign" style="--letters:'+entry.word.length+'">'+esc(entry.word)+'</span>'+(current.game==='mole'?'</span></span><span class="burrow-front" aria-hidden="true"></span>':'')+'</button>').join('')+
        (current.game==='flashlight'?'<div class="library-shade" aria-hidden="true"></div><div class="fox-walker" aria-hidden="true"><span class="fox-sprite"></span><span class="torch-beam"></span></div>':'')+
        (current.paused?'<div class="arcade-overlay"><strong>Take your time</strong><button class="primary" type="button" data-arcade-action="pause">Resume</button></div>':'')+
        (current.phase==='expired'?'<div class="arcade-overlay"><strong>The magic is fading!</strong><p>Take another look. Your words are waiting.</p><button class="primary" type="button" data-arcade-action="retry">Light it up again</button></div>':'')+
        '</div><p class="arcade-feedback" role="status">'+esc(current.message||'')+'</p>'+
        (current.help?'<div class="arcade-help"><p>'+esc(q.explanation??(current.kind==='sound'?'Say each word slowly. Compare '+topic+'.':'Read each word. Look for '+topic+'.'))+'</p>'+q.options.map((entry,index)=>'<button type="button" class="quiet" data-arcade-hear="'+index+'">'+esc(entry.word)+(entry.clip?' ◖))':'')+'</button>').join('')+'<p>Teacher can read any word aloud.</p></div>':'')+
        (canNext?'<p class="auto-next">'+(current.round+1>=current.total?'Opening the magic door…':'Next round coming…')+' Pause to read the explanation.</p>':'')+
        '<div class="arcade-shelf" aria-label="Collected words">'+current.collected.map(w=>'<span>'+esc(w)+'</span>').join('')+'</div>';
    }
    host.innerHTML=heading()+content+'</article>';
    host.querySelectorAll('[data-arcade-word]').forEach(button=>{
      button.addEventListener('focus',()=>reveal(button));
    });
    stopFittingBooks?.();stopFittingBooks=null;
    if(current.phase==='done'||current.game==='flashlight')stopFittingBooks=watchBookLabels(host);
    updateMoles();setMusic();
  }
  function updateMoles(){
    if(current?.game!=='mole')return;
    host.querySelectorAll('[data-arcade-word]').forEach((button,index)=>{
      const t=current.moleElapsed??0;
      const rank=current.moleOrder?.indexOf(index)??index;
      const down=!moleIsUp(t,rank,current.question.options.length,current.level);
      button.classList.toggle('burrowed',current.phase==='cleared'||down);
    });
  }
  function resetQuestion(reuse=false){
    current.moleElapsed=0;current.phase='playing';current.found=new Set();current.revealed=new Set();current.help=false;current.message='';
    current.remaining=({simple:current.game==='mole'?30000:60000,medium:current.game==='mole'?25000:50000,difficult:current.game==='mole'?20000:45000}[current.level]);
    if(!reuse){
      current.question=buildArcadeQuestion(current,(entries,count)=>chooseEntries(entries,count,current));
      current.question.options=current.question.options.map(e=>({...e,clip:clipWords.has(e.word)}));
    }
    current.moleOrder=shuffle(current.question.options.map((_,index)=>index));
    current.lastTick=performance.now();
    render();announceQuestion();
  }
  function announceQuestion(){
    const state=current,request=++announcement,cue=cueFor(state.question,state.game,state.kind);
    const signature=JSON.stringify(cue);
    if(state.game==='mole'&&signature===state.lastSpokenCue){state.speaking=false;state.lastTick=performance.now();setMusic();return;}
    state.lastSpokenCue=signature;
    const urls=cue.files.map(f=>'./audio/arcade-cues/'+f+'.mp3');
    if(cue.example&&clipWords.has(cue.example))urls.push('./audio/ana/'+encodeURIComponent(cue.example)+'.mp3');
    state.speaking=true;setMusic();
    const feedback=host.querySelector('.arcade-feedback');if(feedback)feedback.textContent='Listen to the question…';
    function finish(){if(current!==state||request!==announcement)return;state.speaking=false;state.lastTick=performance.now();if(current.phase==='playing'){const f=host.querySelector('.arcade-feedback');if(f)f.textContent=state.game==='mole'?'Watch the holes. Whack every match!':'Move the light. Find every match!';}setMusic();}
    function next(){if(current!==state||request!==announcement)return;if(!urls.length){finish();return;}roundVoice.src=urls.shift();roundVoice.onended=next;roundVoice.onerror=finish;if(!state.paused)roundVoice.play().catch(finish);}
    next();
  }
  function begin(){
    current.total=(current.game==='mole'&&current.kind==='sound'&&current.task==='all'?{simple:2,medium:3,difficult:4}:{simple:6,medium:8,difficult:10})[current.level];current.collected=[];
    try{resetQuestion();}catch(error){current.phase='setup';current.message=error.message;render();return;}
    clearInterval(clock);
    clock=setInterval(()=>{
      if(!current)return;
      const now=performance.now(),delta=now-current.lastTick;current.lastTick=now;
      if(current.paused||current.speaking||document.hidden||document.getElementById('guide')?.open)return;
      if(current.phase==='cleared'){current.clearedFor=(current.clearedFor??0)+delta;if(current.clearedFor>=(current.question.rule?5500:1800))nextQuestion();return;}
      if(current.phase!=='playing')return;
      current.moleElapsed+=delta;updateMoles();
      if(!current.timed)return;
      current.remaining=Math.max(0,current.remaining-delta);
      const number=host.querySelector('.arcade-clock b');
      if(number)number.textContent=Math.ceil(current.remaining/1000);
      const field=host.querySelector('.arcade-field');
      field?.style.setProperty('--fading',Math.max(.35,Math.min(1,current.remaining/6000)));
      if(current.remaining===0){current.phase='expired';render();}
    },200);
  }
  function reveal(button){
    if(current?.game!=='flashlight'||current.phase!=='playing'||current.paused)return;
    const field=host.querySelector('.arcade-field');
    const rect=field.getBoundingClientRect(),box=button.getBoundingClientRect();
    field.style.setProperty('--beam-x',(box.x+box.width/2-rect.x)+'px');
    field.style.setProperty('--beam-y',(box.y+box.height/2-rect.y)+'px');
    field.querySelectorAll('[data-arcade-word]').forEach(b=>b.classList.toggle('discovered',b===button));
    current.revealed=new Set([current.question.options[Number(button.dataset.arcadeWord)].word]);
  }
  const flashlightInput=bindFlashlightInput(host,{
   active:()=>current?.game==='flashlight'&&current.phase==='playing'&&!current.paused,
   move:(event,field)=>{
    const rect=field.getBoundingClientRect(),x=event.clientX-rect.x,y=event.clientY-rect.y;
    field.style.setProperty('--beam-x',x+'px');field.style.setProperty('--beam-y',y+'px');
    const fox=field.querySelector('.fox-walker');
    if(fox)fox.style.left=Math.max(2,Math.min(80,x/rect.width*100))+'%';
    if(fox){fox.classList.add('walking');clearTimeout(foxTimer);foxTimer=setTimeout(()=>fox.classList.remove('walking'),300);}
    current.revealed.clear();
    field.querySelectorAll('[data-arcade-word]').forEach(button=>{
      const r=button.getBoundingClientRect();
      const lit=Math.hypot(r.x+r.width/2-event.clientX,r.y+r.height/2-event.clientY)<135;
      button.classList.toggle('discovered',lit);
      if(lit){
        current.revealed.add(current.question.options[Number(button.dataset.arcadeWord)].word);
        button.classList.add('discovered');
      }
    });
   },
   leave:()=>{
    current.revealed.clear();
    host.querySelectorAll('.discovered').forEach(b=>b.classList.remove('discovered'));
    const field=host.querySelector('.arcade-field');field?.style.setProperty('--beam-x','-300px');
   }
  });
  host.addEventListener('change',event=>{
    if(!current)return;
    const setting=event.target.dataset.arcadeSetting;
    if(!setting)return;
    current[setting]=setting==='timed'?event.target.checked:event.target.value;
    if(setting==='kind'){current.topic=availableTopics(current.book,current.kind,current.game)[0]?.key;render();}
  });
  function sendBookHome(source){
    if(!current||current.phase!=='done'||current.bookFlying)return;
    if(source==='voice'){if(!bookReader.listening||current.manualReading||current.bookModelPlaying||performance.now()<(current.bookQuietUntil??0))return;}
    else if(source!=='teacher'||!current.manualReading)return;
    const state=current,words=[...new Set(state.collected)],index=words.findIndex(w=>!state.readWords.has(w));if(index<0)return;
    state.bookFlying=true;const word=words[index],book=host.querySelector('[data-review-book="'+index+'"]'),slot=host.querySelector('[data-shelf-slot="'+index+'"]');
    const from=book.getBoundingClientRect(),to=slot.getBoundingClientRect();book.style.setProperty('--fly-x',(to.x+to.width/2-from.x-from.width/2)+'px');book.style.setProperty('--fly-y',(to.y+to.height/2-from.y-from.height/2)+'px');book.classList.add('is-lit','is-flying');fx(true);
    setTimeout(()=>{if(current!==state)return;state.readWords.add(word);book.classList.remove('is-flying','is-current');book.classList.add('is-returned');slot.innerHTML='<span class="shelved-book" style="--book-x:'+(index%3)*50+'%;--book-y:'+Math.floor(index%6/3)*100+'%"><strong>'+esc(word)+'</strong></span>';fitBookLabels(host);state.bookFlying=false;state.bookQuietUntil=performance.now()+700;bookReader.reset();
      const next=words.findIndex(w=>!state.readWords.has(w)),done=next<0;host.querySelector('#book-read-status').textContent=done?'Every book is home! Wonderful reading!':state.readWords.size+' of '+words.length+' books returned';host.querySelector('#current-read-word').textContent=done?'All books are home!':'Read aloud: '+words[next];
      if(done){bookReader.stop();host.querySelector('[data-arcade-action="bookConfirm"]').disabled=true;host.querySelector('[data-arcade-action="bookMic"]').disabled=true;host.querySelector('[data-arcade-action="bookTeacher"]').disabled=true;playVoiceSuccess();host.querySelector('.book-review').classList.add('all-lit');host.querySelector('#book-mic-status').textContent='You sent every book home!';}else host.querySelector('[data-review-book="'+next+'"]').classList.add('is-current');
    },1000);
  }
  function nextQuestion(){
    if(!current||current.phase!=='cleared')return;
    if(current.game==='mole'&&current.kind==='sound'&&current.task==='all'&&current.wave<2){
      current.wave++;current.pinnedSound=current.question.topic;resetQuestion();return;
    }
    current.wave=0;current.pinnedSound=null;current.round++;
    if(current.round>=current.total){current.phase='done';stopSpeech();effect.pause();roundVoice.pause();current.bookQuietUntil=performance.now()+700;render();bookReader.start();return;}
    const revisit=current.retry.find(q=>q.at<=current.round);
    if(revisit){current.retry.splice(current.retry.indexOf(revisit),1);current.question=revisit.question;resetQuestion(true);}
    else resetQuestion();
  }
  host.addEventListener('click',event=>{
    if(!current)return;
    if(flashlightInput.ignoreClick(event)){event.preventDefault();return;}
    const model=event.target.closest('[data-review-model]');
    if(model&&current.phase==='done'){
      const state=current,word=[...new Set(state.collected)][Number(model.dataset.reviewModel)];
      if(clipWords.has(word)){
        state.bookModelPlaying=true;bookReader.reset();
        const finish=()=>{if(current!==state)return;state.bookModelPlaying=false;state.bookQuietUntil=performance.now()+700;bookReader.reset();};
        roundVoice.pause();roundVoice.src='./audio/ana/'+encodeURIComponent(word)+'.mp3';roundVoice.onended=finish;roundVoice.onerror=finish;roundVoice.play().catch(finish);
      }return;
    }
    const wordButton=event.target.closest('[data-arcade-word]');
    if(wordButton&&current.phase==='playing'&&!current.paused&&!current.speaking){
      if(current.game==='mole'&&wordButton.classList.contains('burrowed')&&!wordButton.matches(':focus-visible'))return;
      const entry=current.question.options[Number(wordButton.dataset.arcadeWord)];
      if(current.game==='flashlight'&&!current.revealed.has(entry.word)){reveal(wordButton);return;}
      if(current.question.correct.has(entry.word)){
        if(current.found.has(entry.word))return;
        current.found.add(entry.word);current.score++;current.collected.push(entry.fix??entry.word);fx(true);
        const badge=host.querySelector('.arcade-stage header>span');if(badge)badge.textContent=current.score+' '+(current.game==='mole'?'moles helped':'books found');
        wordButton.classList.add('collected');wordButton.disabled=true;
        current.message=entry.fix?'You caught it! '+entry.word+' → '+entry.fix+'. '+entry.reason:current.game==='mole'?'You caught a match! '+entry.word+'.':'Back on the shelf! '+entry.word;
        if(current.found.size===current.question.correct.size){
          current.phase='cleared';current.clearedFor=0;if(!entry.fix)current.message+=' The magic is growing!';
          const state=current;
          setTimeout(()=>{if(current===state&&state.phase==='cleared'){render();}},1050);
        }else{
          host.querySelector('.arcade-feedback').textContent=current.message;
          const shelf=host.querySelector('.arcade-shelf');const tile=document.createElement('span');tile.textContent=entry.word;shelf.append(tile);
        }
      }else{
        fx(false);if(!current.retry.some(item=>item.question===current.question))current.retry.push({question:current.question,at:current.round+2});
        current.message='That word does not match. Keep looking! Use Help me compare if you need a clue.';host.querySelector('.arcade-feedback').textContent=current.message;
      }
      return;
    }
    const hear=event.target.closest('[data-arcade-hear]');
    if(hear){const e=current.question.options[Number(hear.dataset.arcadeHear)];if(e.clip)speak(e.word);return;}
    const button=event.target.closest('[data-arcade-action]');
    if(!button)return;
    switch(button.dataset.arcadeAction){
      case 'exit':stop();stopSpeech();exit();break;
      case 'begin':begin();break;
      case 'pause':current.paused=!current.paused;if(current.speaking){if(current.paused)roundVoice.pause();else roundVoice.play().catch(()=>{});}current.lastTick=performance.now();render();break;
      case 'music':current.music=!current.music;render();break;
      case 'help':current.paused=true;current.help=true;render();break;
      case 'retry':current.paused=false;resetQuestion(true);break;
      case 'replay':launch(current.game);break;
      case 'bookTeacher':host.querySelector('.book-review-note').textContent='Read each highlighted word aloud. Your teacher checks the reading and sends the book home.';current.manualReading=true;bookReader.stop();host.querySelector('[data-book-voice-meter]').hidden=true;host.querySelector('[data-arcade-action="bookConfirm"]').hidden=false;host.querySelector('#book-mic-status').textContent='Teacher check: listen to the highlighted word. If it is correct, send the book home.';button.textContent='Teacher check active';break;
      case 'bookConfirm':if(current.manualReading)sendBookHome('teacher');break;
      case 'bookMic':current.manualReading=false;host.querySelector('[data-book-voice-meter]').hidden=false;host.querySelector('[data-arcade-action="bookConfirm"]').hidden=true;host.querySelector('[data-arcade-action="bookTeacher"]').textContent='Teacher check — no microphone';if(bookReader.listening){bookReader.stop();host.querySelector('#book-mic-status').textContent='Microphone paused.';button.textContent='Start microphone';}else{bookReader.start();button.textContent='Pause microphone';}break;
      case 'next':nextQuestion();break;
    }
  });
  document.addEventListener('visibilitychange',()=>{if(current){current.lastTick=performance.now();setMusic();}});
  return {stop};
}
// Only existing child recordings are offered as audio controls. Expanded words remain readable for teacher-led play.
const clipWords=new Set();
export function registerArcadeClips(words){for(const w of words)clipWords.add(w.toLowerCase());}
