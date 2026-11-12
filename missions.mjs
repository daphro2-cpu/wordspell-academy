export const missions = {
  listen: {
    guide:'Orla the owl', objective:'Open the sound doors', intro:'Help! My tower doors are stuck. Listen to the word. Open the right door to set my bell free!',
    win:'The door opens!', miss:'That door is locked.', reward:['door opened','doors opened'], glyph:'✦',
  },
  blend: {
    guide:'Finn the fox', objective:'Build a bridge across the river', intro:'My bridge broke! Spin a word and read it out loud. Each word adds a plank.',
    win:'A new plank clicks into place!', miss:'That plank won’t fit yet.', reward:['plank placed','planks placed'], glyph:'▰',
  },
  segment: {
    guide:'Pip the potion maker', objective:'Brew a sound potion', intro:'Help me hatch this egg! Say the word slowly. Add one drop for each sound you hear.',
    win:'The pot is bubbling!', miss:'Try that mix again.', reward:['mix added','mixes added'], glyph:'●',
  },
  spell: {
    guide:'Bram the rune smith', objective:'Build the magic sword', intro:'Help me fix the words. Finish a set, then strike the anvil to forge the sword!',
    win:'Your word rune is forged!', miss:'That rune is still cold.', reward:['rune forged','runes forged'], glyph:'◆',
  },
  sort: {
    guide:'Juniper the keeper', objective:'Send words through the right portal', intro:'A cloud covered the words! Brush it away. Read the words and send them home.',
    win:'The portal lights up!', miss:'That portal leads somewhere else.', reward:['word sorted','words sorted'], glyph:'✶',
  },
  context: {
    guide:'Gigi the giraffe', objective:'Bring back the missing words', intro:'Oh no! The Word Monster spilled invisible ink! Find the missing words so we can read our story.',
    win:'You found it!', miss:'Try a different word.', reward:['word caught','words caught'], glyph:'★',
  },
};

export const flightMission={
  guide:'Orla the owl',objective:'Bring the flying things back',intro:'My spell made everything fly! Hear the word. Tap it to put one thing back!',
  win:'Back in its place!',miss:'That word flew away.',reward:['thing put back','things put back'],
};
