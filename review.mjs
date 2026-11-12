// Small picture clues use a scene when one object would suggest the wrong meaning.
const scenes={
  cat:'🐈',mat:'🚪▰',map:'🗺️',bed:'🛏️',met:'👋🧍🧍',pen:'🖊️',sit:'🪑🧍',pin:'🧷',pig:'🐖',hot:'♨️',cot:'⛺🛏️',pot:'🍲',cut:'✂️📄',cup:'☕',sun:'☀️',pat:'✋🐕',bat:'🦇',ten:'🖐️🖐️',den:'🦊🪨',fan:'🌀💨',van:'🚐',sip:'🥤',zip:'🤐',cap:'🧢',gap:'🧱　🧱',ship:'🚢',shop:'🏪',fish:'🐟',chip:'🥔',chop:'🔪🥕',chin:'👇🙂',thin:'🧵',thick:'📚',this:'👇🎁',that:'👉　🎁',phone:'☎️',graph:'📊',ring:'💍',sang:'🎤🎵',long:'📏↔',fang:'🐍🦷',ran:'🏃💨',rang:'🔔♪',sin:'🙅🍎',sing:'🎤🎶',cats:'🐈🐈',hats:'🧢👒',bats:'🦇🦇',beds:'🛏️🛏️',seeds:'🌱🌱',lids:'🫙🫙',
  puff:'😮💨',cliff:'⛰️🌊',miss:'🏀↗',kiss:'😚💕',hill:'⛰️',bell:'🔔',ball:'⚽',wall:'🧱',tall:'🦒⬆️',roll:'⚽↪️',toll:'💰🌉',doll:'🪆',back:'🎒',duck:'🦆',sock:'🧦',catch:'👐⚾',match:'🧦🧦',fetch:'🐕🦴',badge:'🛡️',edge:'⚠️🪨',bridge:'🌉',cake:'🎂',tape:'📦➰',gate:'🚧',these:'👇🎁🎁',theme:'🎭✨',pete:'👦',bike:'🚲',kite:'🪁',time:'🕒',home:'🏠',rope:'🪢',bone:'🦴',cube:'🧊',cute:'🥺🐶',mule:'🫏',flute:'🪈',rule:'📋✅',rain:'🌧️',train:'🚂',day:'🌞🏞️',play:'🧸⚽',green:'🟢',seed:'🌱',team:'👫⚽👫',beach:'🏖️',me:'🙋',light:'💡',night:'🌃',pie:'🥧',tie:'👔',boat:'⛵',coat:'🧥',snow:'❄️',grow:'🌱➡🌳',few:'🍎🍎',crew:'👩‍🚒🧑‍🚒',flew:'🐦💨',cue:'🎭👈',clue:'🔍🧩',fruit:'🍎🍐🍊',suit:'🤵',moon:'🌙',food:'🍲🍎',pool:'🏊',soon:'⌛➡',book:'📖',look:'👀',cook:'🧑‍🍳',foot:'🦶',
  flag:'🚩',flap:'🪽',clip:'📎',clap:'👏',glad:'😄',glass:'🥛',plan:'📝',plant:'🪴',black:'⚫',block:'🧱',slip:'🧍🍌',sled:'🛷',crab:'🦀',crack:'⚡🥚',grab:'✊🍎',grin:'😁',frog:'🐸',dress:'👗',drum:'🥁',trap:'🪤',trip:'🚶🪨',brick:'🧱',press:'👇🔘',spin:'🌀',spot:'🔴',step:'👣',stop:'🛑',skip:'🪢🏃',skin:'✋',scab:'🩹',smell:'👃🌸',snack:'🍪',snap:'🫰',swim:'🏊',splash:'💦',split:'🍎🔪',spring:'🌷🌱',spray:'🧴💦',scrub:'🧽🫧',scrap:'✂️📄',strip:'📏📄',string:'🧵',strap:'🎒',stretch:'🙆',plane:'✈️',slide:'🛝',float:'🎈',brave:'🛡️🦁',trail:'🥾🌲',dream:'😴💭',sleep:'😴🛏️',smile:'🙂',spoon:'🥄',stove:'🔥🍳',stripe:'🦓',street:'🛣️',scrape:'🪚🪵',spruce:'🌲',yes:'👍',yell:'📣',yard:'🏠🌳',yellow:'🟡',my:'🙋🎒',fly:'🪰',sky:'🌤️',dry:'☀️👕',shy:'🫣',happy:'😊',baby:'👶',bunny:'🐇',puppy:'🐶',candy:'🍬',
  ham:'🥪',jam:'🍓🫙',ram:'🐏',skate:'⛸️',ben:'👦',red:'🔴',note:'📝',
};
const drawn=new Set('cat mat map bed pen pin pig pot cup sun fan van cake kite home moon mop nap man bun bud men pet net pan tin peg pit pug hop hat hut cop dot pop pup run sat fit met cut'.split(' '));
export function reviewPicture(word) {
  const key=word.toLowerCase();
  if(drawn.has(key))return {src:'./assets/review/'+key+'.webp'};
  return scenes[key]?{icons:scenes[key]}:null;
}
