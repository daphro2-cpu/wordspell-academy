const catalog = {
  1: { title:'Sound foundations', summary:'Short vowels, consonant pairs and digraphs', color:'mint', art:'fan', groups:{
    vowels:'Short vowels', pairs:'Similar consonants', digraphs:'Digraphs', endings:'Ending sounds'
  }},
  2: { title:'Spelling patterns', summary:'FLOSS, final spellings, Magic E and vowel teams', color:'peach', art:'cake', groups:{
    finals:'FLOSS & final spellings', magic:'Magic E', teams:'Vowel teams', oo:'Long and short oo'
  }},
  3: { title:'Blends & the letter Y', summary:'Two- and three-letter blends and the sounds of y', color:'lilac', art:'fly', groups:{
    two:'Two-letter blends', three:'Three-letter blends', mixed:'Blends with long vowels', y:'The sounds of y'
  }},
};
const raw = {
  1: {
    vowels:`cat|c a t|a|The ___ purred on my lap.|a pet that purrs
mat|m a t|a|Wipe your shoes on the ___.
map|m a p|a|A ___ shows us where to go.
bed|b e d|e|I sleep in a ___.
met|m e t|e|I ___ my friend at the park.
pen|p e n|e|Write your name with a ___.
sit|s i t|i|Please ___ in this chair.
pin|p i n|i|A ___ holds the paper on the board.
pig|p i g|i|The ___ rolled in the mud.
hot|h o t|o|The soup is too ___ to eat.
cot|c o t|o|We slept on a ___ at camp.
pot|p o t|o|Put the plant in a ___.
cut|c u t|u|Use scissors to ___ the paper.
cup|c u p|u|Pour the water into my ___.
sun|s u n|u|The ___ gives us light.`,
    pairs:`pat|p a t|p|Give the dog a gentle ___.
bat|b a t|b|Swing the ___ to hit the ball.
ten|t e n|t|Five plus five is ___.
den|d e n|d|The fox went into its ___.
fan|f a n|f|Turn on the ___ to cool the room.
van|v a n|v|The driver delivered boxes in a ___.
sip|s i p|s|Take a small ___ of water.
zip|z i p|z|Please ___ up your jacket.
cap|c a p|c|Wear a ___ to shade your eyes.
gap|g a p|g|There is a ___ between the two boards.`,
    digraphs:`ship|sh i p|sh|A ___ sailed across the ocean.
shop|sh o p|sh|We bought bread at the ___.
fish|f i sh|sh|The ___ swims with its fins.
chip|ch i p|ch|I dipped a crunchy ___ in salsa.
chop|ch o p|ch|Dad will ___ the carrots.
chin|ch i n|ch|Your ___ is below your mouth.
thin|th i n|th-unvoiced|The line is very ___, like a thread.
thick|th i ck|th-unvoiced|This coat is ___ and warm.
this|th i s|th-voiced|I want ___ one right here.
that|th a t|th-voiced|Point to ___ tree over there.
phone|ph o_e n|ph|I used the ___ to call Grandma.
graph|g r a ph|ph|The bars on the ___ show our scores.
ring|r i ng|ng|She wears a ___ on her finger.
sang|s a ng|ng|We ___ a song after lunch.
long|l o ng|ng|A giraffe has a ___ neck.`,
    endings:`fan|f a n|n|The ___ blows cool air.
fang|f a ng|ng|The snake has a sharp ___.
ran|r a n|n|We ___ to catch the bus.
rang|r a ng|ng|The bell ___ at noon.
sin|s i n|n|In the story, the old king called the lie a ___.
sing|s i ng|ng|We can ___ the song together.
ham|h a m|m|I had ___ for lunch.
jam|j a m|m|I put ___ on my toast.
ram|r a m|m|A ___ is a male sheep.
cats|c a t s|ts|The ___ chased a ball of yarn.
hats|h a t s|ts|We wore ___ to keep off the sun.
bats|b a t s|ts|The ___ flew out of the cave.
beds|b e d s|ds|The hotel room has two ___ to sleep in.
seeds|s ee d s|ds|Plant the ___ in the soil.
lids|l i d s|ds|Put the ___ back on the jars.`,
  },
  2: {
    finals:`puff|p u ff|ff|Blow a ___ of air.
cliff|c l i ff|ff|The rocky ___ rises above the sea.
miss|m i ss|ss|If you do not aim, you may ___ the goal.
kiss|k i ss|ss|She gave the baby a ___ on the cheek.
hill|h i ll|ll|We walked up the ___.
bell|b e ll|ll|The ___ rang at the end of class.
ball|b a ll|all|Kick the ___ into the goal.
wall|w a ll|all|Hang the picture on the ___.
tall|t a ll|all|A giraffe is very ___.
roll|r o ll|oll-long|___ the ball across the floor.
toll|t o ll|oll-long|We paid a ___ to cross the bridge.
doll|d o ll|oll-short|She put a little dress on her ___.
back|b a ck|ck|My backpack is on my ___.
duck|d u ck|ck|A ___ swam across the pond.
sock|s o ck|ck|Put a ___ on each foot.
catch|c a tch|tch|Hold out your hands to ___ the ball.
match|m a tch|tch|These socks are the same color, so they ___.
fetch|f e tch|tch|The dog will ___ the stick.
badge|b a dge|dge|The officer wore a shiny ___.
edge|e dge|dge|Keep away from the ___ of the table.
bridge|b r i dge|dge|A ___ crosses the river.`,
    magic:`cake|c a_e k|a_e|A birthday ___ has candles.
tape|t a_e p|a_e|Use ___ to stick the paper to the wall.
gate|g a_e t|a_e|Open the ___ to enter the yard.
these|th e_e s|e_e|I will take ___ two books right here.
theme|th e_e m|e_e|The party has a space ___.
Pete|p e_e t|e_e|My friend ___ is named Peter.
bike|b i_e k|i_e|I rode my ___ to the park.
kite|k i_e t|i_e|The ___ flew high in the wind.
time|t i_e m|i_e|What ___ does school start?
home|h o_e m|o_e|I walked ___ after school.
rope|r o_e p|o_e|Pull the boat with a ___.
bone|b o_e n|o_e|The dog buried a ___.
cube|c u_e b|u_e|An ice ___ melts in the sun.
cute|c u_e t|u_e|The ___ puppy has tiny paws.
mule|m u_e l|u_e|The ___ carried bags up the hill.
flute|f l u_e t|u_e|She played a tune on her ___.
rule|r u_e l|u_e|A classroom ___ tells us what to do.`,
    teams:`rain|r ai n|ai|Dark clouds often bring ___.
train|t r ai n|ai|The ___ stopped at the station.
day|d ay|ay|A ___ has 24 hours.
play|p l ay|ay|We like to ___ outside at recess.
green|g r ee n|ee|Fresh grass is often ___.
seed|s ee d|ee|A ___ can grow into a plant.
team|t ea m|ea|Our ___ wore matching shirts.
beach|b ea ch|ea|We built sandcastles at the ___.
me|m e|e|Can you help ___ carry this box?
light|l igh t|igh|Turn on the ___ so we can see.
night|n igh t|igh|The moon shines at ___.
pie|p ie|ie|We ate apple ___ for dessert.
tie|t ie|ie|Please ___ your shoes before running.
boat|b oa t|oa|A ___ floats on the water.
coat|c oa t|oa|Wear a ___ when it is cold.
snow|s n ow|ow|The white ___ covered the ground.
grow|g r ow|ow|Plants need water to ___.
few|f ew|ew|Only a ___ cookies are left.
crew|c r ew|ew|The ship's ___ worked together.
flew|f l ew|ew|The bird ___ over our heads.
cue|c ue|ue|The bell was our ___ to line up.
clue|c l ue|ue|The detective found a ___.
fruit|f r ui t|ui|An apple is a kind of ___.
suit|s ui t|ui|He wore a ___ and tie.`,
    oo:`moon|m oo n|oo-long|The ___ orbits Earth.
food|f oo d|oo-long|We packed ___ for lunch.
pool|p oo l|oo-long|We swam in the ___.
soon|s oo n|oo-long|The show will start ___.
book|b oo k|oo-short|Read a ___ from the library.
look|l oo k|oo-short|___ at the sky.
cook|c oo k|oo-short|We will ___ rice for dinner.
foot|f oo t|oo-short|I put a shoe on my ___.`,
  },
  3: {
    two:`flag|f l a g|fl|The ___ waved in the wind.
flap|f l a p|fl|Birds ___ their wings.
clip|c l i p|cl|A paper ___ holds two sheets together.
clap|c l a p|cl|We ___ when the show ends.
glad|g l a d|gl|I am ___ you came to visit.
glass|g l a ss|gl|I drank a ___ of milk.
plan|p l a n|pl|We made a ___ before we started.
plant|p l a n t|pl|Water the ___ every week.
black|b l a ck|bl|The night sky looked ___.
block|b l o ck|bl|Put one wooden ___ on top of another.
slip|s l i p|sl|Be careful not to ___ on the ice.
sled|s l e d|sl|We rode a ___ down the snowy hill.
crab|c r a b|cr|A ___ has claws.
crack|c r a ck|cr|There is a ___ in the wall.
grab|g r a b|gr|___ your coat before you leave.
grin|g r i n|gr|He had a big ___ on his face.
frog|f r o g|fr|A ___ jumped into the pond.
dress|d r e ss|dr|She wore a blue ___ to the party.
drum|d r u m|dr|He hit the ___ with two sticks.
trap|t r a p|tr|The mouse avoided the ___.
trip|t r i p|tr|We took a ___ to the zoo.
brick|b r i ck|br|The wall is made of ___.
press|p r e ss|pr|___ the button to start.
spin|s p i n|sp|The top will ___ on the table.
spot|s p o t|sp|The dog has a brown ___ on its back.
step|s t e p|st|Take one ___ forward.
stop|s t o p|st|Cars must ___ at a red light.
skip|s k i p|sk|We like to ___ rope.
skin|s k i n|sk|The orange has thick ___.
scab|s c a b|sc|A small ___ formed over the cut.
smell|s m e ll|sm|___ the flower.
snack|s n a ck|sn|We ate a ___ after school.
snap|s n a p|sn|___ your fingers to make a sound.
swim|s w i m|sw|Fish can ___ in water.`,
    three:`splash|s p l a sh|spl|The stone made a ___ in the pond.
split|s p l i t|spl|We can ___ the orange into two parts.
spring|s p r i ng|spr|Flowers grow in ___.
spray|s p r ay|spr|Mist the plant with a water ___.
scrub|s c r u b|scr|___ the pan with a brush.
scrap|s c r a p|scr|Draw on a ___ of paper.
strip|s t r i p|str|Cut a thin ___ of paper.
string|s t r i ng|str|Tie a ___ around the box.
strap|s t r a p|str|My backpack has a broken ___.
stretch|s t r e tch|str|___ your arms above your head.`,
    mixed:`plane|p l a_e n|pl|A ___ flew above the clouds.
slide|s l i_e d|sl|The kids went down the ___.
float|f l oa t|fl|A cork can ___ on water.
green|g r ee n|gr|The leaves are ___.
brave|b r a_e v|br|The ___ firefighter helped the family.
trail|t r ai l|tr|Follow the ___ through the woods.
dream|d r ea m|dr|I had a funny ___ last night.
sleep|s l ee p|sl|I ___ in my bed at night.
smile|s m i_e l|sm|Show your biggest ___ for the photo.
spoon|s p oo n|sp|Eat your soup with a ___.
snow|s n ow|sn|We made a snowman from the ___.
stove|s t o_e v|st|The soup is on the ___.
stripe|s t r i_e p|str|The shirt has a blue ___.
street|s t r ee t|str|Cross the ___ at the crosswalk.
scrape|s c r a_e p|scr|___ the ice off the window.
spruce|s p r u_e ce|spr|A ___ is an evergreen tree.`,
    y:`yes|y e s|y-head|Say ___ if you agree.
yell|y e ll|y-head|Please do not ___ in the library.
yard|y ar d|y-head|We played in the back ___.
yellow|y e ll ow|y-head|A banana is usually ___.
my|m y|y-i|That is ___ lunchbox.
fly|f l y|y-i|Birds can ___ in the sky.
sky|s k y|y-i|Clouds float in the ___.
dry|d r y|y-i|Hang the wet towel so it can ___.
shy|sh y|y-i|The ___ child waved very quietly.
happy|h a pp y|y-e|I felt ___ on my birthday.
baby|b a b y|y-e|The ___ slept in a crib.
bunny|b u nn y|y-e|The little ___ hopped away.
puppy|p u pp y|y-e|The ___ wagged its tail.
candy|c a n d y|y-e|We each ate one piece of ___.`,
  },
};
const labels = {
  'th-unvoiced':'th as in thin','th-voiced':'th as in this',
  'oll-long':'-oll as in roll','oll-short':'-oll as in doll','oo-long':'oo as in moon','oo-short':'oo as in book',
  'y-head':'y as in yes','y-i':'y as in fly','y-e':'y as in happy',
};
const bookWords = Object.fromEntries(Object.entries(raw).map(([book, groups])=>[
  book,Object.entries(groups).flatMap(([group,data])=>data.split('\n').map(line=>{
    const [word, chunks, pattern, sentence, clue] = line.split('|');
    return {word, tiles:chunks.split(' '), pattern, group, sentence, clue};
  })),
]));
export {catalog, bookWords, labels};
