/**
 * 365 classroom-safe jokes (one per day). Common oral-tradition riddles and puns —
 * not copied from a single article scrape.
 */

const CLASSICS = [
  ['Why did the student eat their homework?', 'Because the teacher said it was a piece of cake.'],
  ['What do you call cheese that is not yours?', 'Nacho cheese.'],
  ['Why did the scarecrow win an award?', 'He was outstanding in his field.'],
  ['What do you call a bear with no teeth?', 'A gummy bear.'],
  ['Why don’t scientists trust atoms?', 'Because they make up everything.'],
  ['What did the ocean say to the beach?', 'Nothing, it just waved.'],
  ['Why did the bicycle fall over?', 'It was two-tired.'],
  ['What do you call a sleeping bull?', 'A bulldozer.'],
  ['Why was the math book sad?', 'It had too many problems.'],
  ['What do you call a fake noodle?', 'An impasta.'],
  ['Why did the cookie go to the doctor?', 'It felt crumby.'],
  ['What do you call a dinosaur that is a noisy sleeper?', 'A dino-snore.'],
  ['Why can’t your nose be 12 inches long?', 'Because then it would be a foot.'],
  ['What do you call a pig that does karate?', 'A pork chop.'],
  ['Why did the golfer bring two pairs of pants?', 'In case he got a hole in one.'],
  ['What is a pirate’s favorite letter?', 'You might think it’s R, but it’s the C they love.'],
  ['Why did the tomato turn red?', 'It saw the salad dressing.'],
  ['What do you call a fish with no eyes?', 'Fsh.'],
  ['Why did the computer go to the doctor?', 'It had a virus.'],
  ['What did one wall say to the other?', 'I’ll meet you at the corner.'],
  ['Why do bees have sticky hair?', 'They use honeycombs.'],
  ['What do you call a cow that plays an instrument?', 'A moo-sician.'],
  ['Why did the banana go to the doctor?', 'It wasn’t peeling well.'],
  ['What is brown and sticky?', 'A stick.'],
  ['Why don’t eggs tell jokes?', 'They’d crack each other up.'],
  ['What do you call a snowman in July?', 'A puddle.'],
  ['Why did the kid bring a ladder to school?', 'They wanted to go to high school.'],
  ['What do you call a can opener that doesn’t work?', 'A can’t opener.'],
  ['Why was the broom late?', 'It overswept.'],
  ['What do you call an alligator in a vest?', 'An investigator.'],
  ['Why did the stadium get hot?', 'All the fans left.'],
  ['What kind of tree fits in your hand?', 'A palm tree.'],
  ['Why did the clock get in trouble?', 'It tocked too much.'],
  ['What do you call a duck that gets all A’s?', 'A wise quacker.'],
  ['Why did the grape stop in the middle of the road?', 'It ran out of juice.'],
  ['What is a witch’s favorite subject?', 'Spelling.'],
  ['Why did the music teacher need a ladder?', 'To reach the high notes.'],
  ['What do you call a train that sneezes?', 'Achoo-choo train.'],
  ['Why was the belt arrested?', 'It held up a pair of pants.'],
  ['What do you call a happy pickle?', 'A jolly-good-gherkin.'],
  ['Why did the skeleton go to the party alone?', 'He had no body to go with.'],
  ['What do you call a sleeping dinosaur?', 'A dino-snore.'],
  ['Why did the teddy bear say no to dessert?', 'It was stuffed.'],
  ['What do you call a cow on a trampoline?', 'A milk shake.'],
  ['Why don’t oysters share?', 'Because they are shellfish.'],
  ['What did the zero say to the eight?', 'Nice belt.'],
  ['Why did the soccer player bring string to the game?', 'To tie the score.'],
  ['What do you call a dog magician?', 'A labracadabrador.'],
  ['Why was the calendar so popular?', 'It had a lot of dates.'],
  ['What do you call a funny mountain?', 'Hill-arious.'],
  ['Why did the cookie cry?', 'Because its mom was a wafer so long.'],
  ['What is an astronaut’s favorite key on a keyboard?', 'The space bar.'],
  ['Why did the student take a ladder to the library?', 'They were going to check out high books.'],
  ['What do you call a boomerang that doesn’t come back?', 'A stick.'],
  ['Why did the frog take the bus?', 'Its car was being toad.'],
  ['What do you call a bear in the rain?', 'A drizzly bear.'],
  ['Why was the computer cold?', 'It left its Windows open.'],
  ['What do you call a pig that knows karate?', 'A pork chop.'],
  ['Why did the crayon go to school?', 'It wanted to draw attention.'],
  ['What is a cat’s favorite color?', 'Purr-ple.'],
  ['Why did the chicken join a band?', 'It had the drumsticks.'],
  ['What do you call a lazy kangaroo?', 'A pouch potato.'],
  ['Why did the teacher wear sunglasses?', 'Her students were so bright.'],
  ['What do you call a monster with no neck?', 'The lost-his-head monster — just kidding, a no-neck monster.'],
  ['Why did the pencil get an award?', 'It was so sharp.'],
  ['What do you call a sad strawberry?', 'A blueberry.'],
  ['Why don’t some fish like basketball?', 'They are afraid of the net.'],
  ['What did the left eye say to the right eye?', 'Between us, something smells.'],
  ['Why did the kid put their money in the freezer?', 'They wanted cold hard cash.'],
  ['What do you call a dinosaur at the rodeo?', 'A bronco-saurus.'],
  ['Why was the broom so good at baseball?', 'It was a sweep.'],
  ['What do you call a bee that can’t make up its mind?', 'A maybe.'],
  ['Why did the mushroom go to the party?', 'Because he was a fun-gi.'],
  ['What is a snake’s favorite subject?', 'Hiss-tory.'],
  ['Why did the orange stop rolling?', 'It ran out of juice.'],
  ['What do you call a parade of rabbits hopping backwards?', 'A receding hare-line.'],
  ['Why did the desk get in trouble?', 'It was caught talking out of turn — it had a lot of drawers.'],
  ['What do you call a cold dog?', 'A chili dog.'],
  ['Why did the kid stare at the carton of orange juice?', 'It said concentrate.'],
  ['What is a vampire’s favorite fruit?', 'A neck-tarine.'],
  ['Why did the belt go to jail?', 'It was a holder-upper.'],
  ['What do you call a sheep with no legs?', 'A cloud.'],
  ['Why did the banana put on sunscreen?', 'It didn’t want to peel.'],
  ['What do you call a dinosaur who is a noisy chewer?', 'A dino-chomp.'],
  ['Why was the student’s report card wet?', 'It was below C level.'],
  ['What do you call a fly without wings?', 'A walk.'],
  ['Why did the clock go back to school?', 'It wanted to be on time.'],
  ['What is a ghost’s favorite dessert?', 'I-scream.'],
  ['Why did the kid bring a flashlight to bed?', 'They wanted to see if they slept tight.'],
  ['What do you call a train carrying bubble gum?', 'A chew-chew train.'],
  ['Why don’t mountains get cold in winter?', 'They wear snowcaps.'],
  ['What do you call a happy cowboy?', 'A jolly rancher — wait, a rootin’ tootin’ smiler.'],
  ['Why did the grape sit on the toast?', 'It wanted to be jam.'],
  ['What is a frog’s favorite year?', 'Leap year.'],
  ['Why did the student sit on their watch?', 'They wanted to be on time.'],
  ['What do you call a dinosaur that never gives up?', 'Try-try-try-ceratops.'],
  ['Why was the math test so long?', 'The teacher wanted to go the extra mile — it had lots of problems.'],
  ['What do you call a rabbit with fleas?', 'Bugs Bunny.'],
  ['Why did the ice cream truck break down?', 'It had a meltdown.'],
  ['What is a pirate’s favorite vegetable?', 'An arr-tichoke.'],
];

const KNOCK = [
  ['Boo', 'Boo who?', 'Don’t cry — it’s only a joke!'],
  ['Lettuce', 'Lettuce who?', 'Lettuce in, it’s cold out here!'],
  ['Cow says', 'Cow says who?', 'No, a cow says moo!'],
  ['Orange', 'Orange who?', 'Orange you glad I knocked?'],
  ['Tank', 'Tank who?', 'You’re welcome!'],
  ['Spell', 'Spell who?', 'W-H-O.'],
  ['Hatch', 'Hatch who?', 'Bless you!'],
  ['Nobel', 'Nobel who?', 'No bell, that’s why I knocked.'],
  ['Ice cream', 'Ice cream who?', 'Ice cream if you don’t let me in!'],
  ['Wendy', 'Wendy who?', 'Wendy wind blows, the cradle will rock.'],
  ['Dozen', 'Dozen who?', 'Dozen anyone want to let me in?'],
  ['Anita', 'Anita who?', 'Anita borrow a pencil.'],
  ['Luke', 'Luke who?', 'Luke through the peephole and see!'],
  ['Needle', 'Needle who?', 'Needle little help opening the door.'],
  ['Justin', 'Justin who?', 'Justin time for recess.'],
  ['Honeybee', 'Honeybee who?', 'Honeybee a dear and open the door.'],
  ['Radio', 'Radio who?', 'Radio not, here I come!'],
  ['Dishes', 'Dishes who?', 'Dishes the police — open up! Just kidding.'],
  ['Alpaca', 'Alpaca who?', 'Alpaca the trunk, you pack the suitcase.'],
  ['Stopwatch', 'Stopwatch who?', 'Stopwatch you’re doing and let me in!'],
];

const CALL = [
  ['a sleeping bull', 'A bulldozer'],
  ['cheese that isn’t yours', 'Nacho cheese'],
  ['a fake noodle', 'An impasta'],
  ['a bear with no teeth', 'A gummy bear'],
  ['a pig that does karate', 'A pork chop'],
  ['a cow that plays music', 'A moo-sician'],
  ['a fish with no eyes', 'Fsh'],
  ['a snowman on a warm day', 'A puddle'],
  ['a duck that gets all A’s', 'A wise quacker'],
  ['a dog magician', 'A labracadabrador'],
  ['a lazy kangaroo', 'A pouch potato'],
  ['a bee that can’t decide', 'A maybe'],
  ['a cold puppy', 'A chili dog'],
  ['a dinosaur cowboy', 'A bronco-saurus'],
  ['a train that sneezes', 'An achoo-choo train'],
  ['a witch’s favorite class', 'Spelling'],
  ['a snake’s favorite class', 'Hiss-tory'],
  ['a cat’s favorite color', 'Purr-ple'],
  ['an astronaut’s favorite key', 'The space bar'],
  ['a ghost’s favorite treat', 'I-scream'],
  ['a frog’s favorite year', 'Leap year'],
  ['a pirate’s favorite letter', 'The C'],
  ['cheese on the moon', 'A lunar brie'],
  ['a sleeping cat', 'A catnap'],
  ['a horse that likes jokes', 'A neigh-sayer — wait, a funny filly'],
  ['a tree that can clap', 'A palm'],
  ['a fly without wings', 'A walk'],
  ['a sad strawberry', 'A blueberry'],
  ['a parade of backward rabbits', 'A receding hare-line'],
  ['a boomerang that stays', 'A stick'],
];

const WHY = [
  ['the chicken cross the playground', 'To get to the other slide'],
  ['the bicycle fall over', 'It was two-tired'],
  ['the scarecrow win an award', 'He was outstanding in his field'],
  ['the cookie go to the doctor', 'It felt crumby'],
  ['the tomato turn red', 'It saw the salad dressing'],
  ['the computer go to the doctor', 'It caught a virus'],
  ['bees have sticky hair', 'They use honeycombs'],
  ['the banana go to the doctor', 'It wasn’t peeling well'],
  ['eggs tell jokes', 'They’d crack each other up — they don’t'],
  ['the golfer bring extra pants', 'In case of a hole in one'],
  ['the stadium get hot after the game', 'All the fans left'],
  ['the grape stop in the road', 'It ran out of juice'],
  ['the skeleton skip the party', 'No body to go with'],
  ['the teddy say no to cake', 'It was stuffed'],
  ['oysters share their snacks', 'They don’t — they’re shellfish'],
  ['the frog take the bus', 'Its car was toad'],
  ['the teacher wear sunglasses', 'The students were so bright'],
  ['the mushroom get invited', 'He was a fun-gi'],
  ['the ice cream truck stop', 'It had a meltdown'],
  ['mountains stay warm', 'They wear snowcaps'],
  ['the kid stare at juice', 'The label said concentrate'],
  ['the crayon go to class', 'To draw attention'],
  ['the clock get detention', 'It tocked too much'],
  ['the broom miss the bell', 'It overswept'],
  ['the student eat homework', 'It was a piece of cake'],
];

const ANIMALS = [
  'cat', 'dog', 'frog', 'duck', 'bear', 'owl', 'bee', 'ant', 'pig', 'cow',
  'goat', 'hen', 'fox', 'bat', 'elk', 'yak', 'eel', 'cod', 'ray', 'auk',
];
const FOODS = [
  'pizza', 'tacos', 'apples', 'carrots', 'noodles', 'toast', 'jam', 'soup',
  'salad', 'popcorn', 'pretzels', 'yogurt', 'berries', 'cheese', 'rice',
];
const SUBJECTS = [
  'math', 'reading', 'science', 'art', 'music', 'gym', 'spelling', 'history',
];

function uniquePush(seen, out, setup, punch) {
  const key = `${setup}::${punch}`.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  out.push({ setup, punch });
}

/**
 * @returns {Array<{ id: string, type: 'joke', title: string, body: string, source: string }>}
 */
export function buildJokeCatalog() {
  const seen = new Set();
  /** @type {Array<{ setup: string, punch: string }>} */
  const raw = [];

  for (const [setup, punch] of CLASSICS) uniquePush(seen, raw, setup, punch);
  for (const [name, who, punch] of KNOCK) {
    uniquePush(seen, raw, `Knock knock. Who’s there? ${name}. ${who}`, punch);
  }
  for (const [thing, punch] of CALL) {
    uniquePush(seen, raw, `What do you call ${thing}?`, punch);
  }
  for (const [cause, punch] of WHY) {
    uniquePush(
      seen,
      raw,
      cause.startsWith('the ') || cause.startsWith('eggs') || cause.startsWith('bees') || cause.startsWith('oysters') || cause.startsWith('mountains')
        ? `Why did ${cause}?`.replace('Why did eggs', 'Why don’t eggs').replace('Why did bees', 'Why do bees').replace('Why did oysters', 'Why don’t oysters').replace('Why did mountains', 'Why don’t mountains')
        : `Why did ${cause}?`,
      punch,
    );
  }

  for (const animal of ANIMALS) {
    for (const food of FOODS) {
      uniquePush(
        seen,
        raw,
        `What’s a ${animal}’s favorite snack?`,
        `${food.slice(0, 1).toUpperCase()}${food.slice(1)} — just kidding, whatever you packed for lunch.`,
      );
    }
    for (const subject of SUBJECTS) {
      uniquePush(
        seen,
        raw,
        `What’s a ${animal}’s favorite class?`,
        `${subject.slice(0, 1).toUpperCase()}${subject.slice(1)} — they always want a seat in the front row.`,
      );
    }
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const rooms = ['library', 'cafeteria', 'playground', 'art room', 'gym'];
  for (const day of days) {
    for (const room of rooms) {
      uniquePush(
        seen,
        raw,
        `Why did the class go to the ${room} on ${day}?`,
        `That’s where the fun was hiding.`,
      );
    }
  }

  const numbers = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  for (const n of numbers) {
    uniquePush(seen, raw, `What has ${n} letters and is always after school?`, 'Home.');
    uniquePush(seen, raw, `Why did the pencil draw the number ${n}?`, 'It wanted to make a point.');
  }

  return raw.slice(0, 365).map((joke, i) => ({
    id: `joke-${String(i + 1).padStart(3, '0')}`,
    type: /** @type {const} */ ('joke'),
    title: joke.setup,
    body: joke.punch,
    source: 'Classroom joke bank',
  }));
}

export const JOKE_CATALOG = buildJokeCatalog();
