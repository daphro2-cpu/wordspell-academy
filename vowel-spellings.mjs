// These are possible sound-to-spelling choices for the patterns taught here,
// not a claim that every generated spelling is a conventional English word.
// Final ai/oa and medial ay/ow are excluded from these beginner pattern choices.
const alternatives={
 cake:{a_e:'cake',ai:'caik'},tape:{a_e:'tape',ai:'taip'},gate:{a_e:'gate',ai:'gait'},
 rain:{ai:'rain',a_e:'rane'},train:{ai:'train',a_e:'trane'},day:{ay:'day'},play:{ay:'play'},
 these:{e_e:'these',ee:'thees',ea:'theas'},theme:{e_e:'theme',ee:'theem',ea:'theam'},
 pete:{e_e:'Pete',ee:'peet',ea:'peat'},green:{ee:'green',ea:'grean',e_e:'grene'},seed:{ee:'seed',ea:'sead',e_e:'sede'},
 team:{ea:'team',ee:'teem',e_e:'teme'},beach:{ea:'beach',ee:'beech'},me:{e:'me',ee:'mee',ea:'mea'},
 bike:{i_e:'bike'},kite:{i_e:'kite',igh:'kight'},time:{i_e:'time'},
 light:{igh:'light',i_e:'lite'},night:{igh:'night',i_e:'nite'},pie:{ie:'pie',igh:'pigh'},tie:{ie:'tie',igh:'tigh'},
 home:{o_e:'home',oa:'hoam'},rope:{o_e:'rope',oa:'roap'},bone:{o_e:'bone',oa:'boan'},
 boat:{oa:'boat',o_e:'bote'},coat:{oa:'coat',o_e:'cote'},snow:{ow:'snow'},grow:{ow:'grow'},
 cube:{u_e:'cube'},cute:{u_e:'cute'},mule:{u_e:'mule'},
 flute:{u_e:'flute',ui:'fluit'},rule:{u_e:'rule',ui:'ruil'},
 few:{ew:'few',ue:'fue'},crew:{ew:'crew',ue:'crue'},flew:{ew:'flew',ue:'flue'},
 cue:{ue:'cue',ew:'cew'},clue:{ue:'clue',ew:'clew'},fruit:{ui:'fruit',u_e:'frute'},suit:{ui:'suit',u_e:'sute'},
};
export function possibleVowelSpellings(entry){return {...(alternatives[entry.word.toLowerCase()]??{}),[entry.pattern]:entry.word};}
