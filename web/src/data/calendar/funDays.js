/**
 * Fun Days / novelty & world observances for Edu.Calendar overlays.
 *
 * Titles keep authentic public names (National Day Calendar / common
 * observances). Multiple options per date support teacher choice.
 * Display-only — these do not close session days.
 */

import { parseIsoDate, toIsoDate } from './calendarModel';

export const FUN_DAY_COLOR = '#f97316';

/** @typedef {{'fun'|'global'|'civic'}} FunDayKind */

/**
 * @type {Array<{
 *   month: number,
 *   day: number,
 *   options: Array<{ id: string, label: string, kind: FunDayKind }>
 * }>}
 */
export const FUN_DAYS = [
  {
    month: 1,
    day: 1,
    options: [
      { id: '01-01-new-year-s-day', label: 'New Year\'s Day', kind: 'fun' },
      { id: '01-01-polar-bear-plunge-day', label: 'Polar Bear Plunge Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 2,
    options: [
      { id: '01-02-science-fiction-day', label: 'Science Fiction Day', kind: 'fun' },
      { id: '01-02-cream-puff-day', label: 'Cream Puff Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 3,
    options: [
      { id: '01-03-festival-of-sleep-day', label: 'Festival of Sleep Day', kind: 'fun' },
      { id: '01-03-fruitcake-toss-day', label: 'Fruitcake Toss Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 4,
    options: [
      { id: '01-04-trivia-day', label: 'Trivia Day', kind: 'fun' },
      { id: '01-04-spaghetti-day', label: 'Spaghetti Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 5,
    options: [
      { id: '01-05-bird-day', label: 'Bird Day', kind: 'fun' },
      { id: '01-05-whipped-cream-day', label: 'Whipped Cream Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 6,
    options: [
      { id: '01-06-bean-day', label: 'Bean Day', kind: 'fun' },
      { id: '01-06-cuddle-up-day', label: 'Cuddle Up Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 7,
    options: [
      { id: '01-07-old-rock-day', label: 'Old Rock Day', kind: 'fun' },
      { id: '01-07-bobblehead-day', label: 'Bobblehead Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 8,
    options: [
      { id: '01-08-earth-s-rotation-day', label: 'Earth\'s Rotation Day', kind: 'fun' },
      { id: '01-08-bubble-bath-day', label: 'Bubble Bath Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 9,
    options: [
      { id: '01-09-word-nerd-day', label: 'Word Nerd Day', kind: 'fun' },
      { id: '01-09-static-electricity-day', label: 'Static Electricity Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 10,
    options: [
      { id: '01-10-save-the-eagles-day', label: 'Save the Eagles Day', kind: 'fun' },
      { id: '01-10-cut-your-energy-costs-day', label: 'Cut Your Energy Costs Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 11,
    options: [
      { id: '01-11-morse-code-day', label: 'Morse Code Day', kind: 'fun' },
      { id: '01-11-milk-day', label: 'Milk Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 12,
    options: [
      { id: '01-12-marzipan-day', label: 'Marzipan Day', kind: 'fun' },
      { id: '01-12-national-clean-off-your-desk-day', label: 'National Clean Off Your Desk Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 13,
    options: [
      { id: '01-13-rubber-ducky-day', label: 'Rubber Ducky Day', kind: 'fun' },
      { id: '01-13-sticker-day', label: 'Sticker Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 14,
    options: [
      { id: '01-14-dress-up-your-pet-day', label: 'Dress Up Your Pet Day', kind: 'fun' },
      { id: '01-14-organize-your-home-day', label: 'Organize Your Home Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 15,
    options: [
      { id: '01-15-national-hat-day', label: 'National Hat Day', kind: 'fun' },
      { id: '01-15-bagel-day', label: 'Bagel Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 16,
    options: [
      { id: '01-16-national-nothing-day', label: 'National Nothing Day', kind: 'fun' },
      { id: '01-16-fig-newton-day', label: 'Fig Newton Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 17,
    options: [
      { id: '01-17-kid-inventors-day', label: 'Kid Inventors\' Day', kind: 'fun' },
      { id: '01-17-benjamin-franklin-day', label: 'Benjamin Franklin Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 18,
    options: [
      { id: '01-18-winnie-the-pooh-day', label: 'Winnie the Pooh Day', kind: 'fun' },
      { id: '01-18-thesaurus-day', label: 'Thesaurus Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 19,
    options: [
      { id: '01-19-popcorn-day', label: 'Popcorn Day', kind: 'fun' },
      { id: '01-19-tin-can-day', label: 'Tin Can Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 20,
    options: [
      { id: '01-20-penguin-awareness-day', label: 'Penguin Awareness Day', kind: 'fun' },
      { id: '01-20-cheese-lover-s-day', label: 'Cheese Lover\'s Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 21,
    options: [
      { id: '01-21-squirrel-appreciation-day', label: 'Squirrel Appreciation Day', kind: 'fun' },
      { id: '01-21-national-hugging-day', label: 'National Hugging Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 22,
    options: [
      { id: '01-22-answer-your-cat-s-questions-day', label: 'Answer Your Cat\'s Questions Day', kind: 'fun' },
      { id: '01-22-hot-sauce-day', label: 'Hot Sauce Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 23,
    options: [
      { id: '01-23-handwriting-day', label: 'Handwriting Day', kind: 'fun' },
      { id: '01-23-pie-day', label: 'Pie Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 24,
    options: [
      { id: '01-24-compliment-day', label: 'Compliment Day', kind: 'fun' },
      { id: '01-24-peanut-butter-day', label: 'Peanut Butter Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 25,
    options: [
      { id: '01-25-opposite-day', label: 'Opposite Day', kind: 'fun' },
      { id: '01-25-bubble-wrap-appreciation-day', label: 'Bubble Wrap Appreciation Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 26,
    options: [
      { id: '01-26-australia-day', label: 'Australia Day', kind: 'global' },
      { id: '01-26-have-fun-at-work-day', label: 'Have Fun At Work Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 27,
    options: [
      { id: '01-27-chocolate-cake-day', label: 'Chocolate Cake Day', kind: 'fun' },
      { id: '01-27-e-day', label: 'e-Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 28,
    options: [
      { id: '01-28-national-lego-day', label: 'National LEGO Day', kind: 'fun' },
      { id: '01-28-kazoo-day', label: 'Kazoo Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 29,
    options: [
      { id: '01-29-puzzle-day', label: 'Puzzle Day', kind: 'fun' },
      { id: '01-29-corn-chip-day', label: 'Corn Chip Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 30,
    options: [
      { id: '01-30-croissant-day', label: 'Croissant Day', kind: 'fun' },
      { id: '01-30-draw-a-dinosaur-day', label: 'Draw a Dinosaur Day', kind: 'fun' },
    ],
  },
  {
    month: 1,
    day: 31,
    options: [
      { id: '01-31-backwards-day', label: 'Backwards Day', kind: 'fun' },
      { id: '01-31-hot-chocolate-day', label: 'Hot Chocolate Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 1,
    options: [
      { id: '02-01-world-read-aloud-day', label: 'World Read Aloud Day', kind: 'global' },
      { id: '02-01-dark-chocolate-day', label: 'Dark Chocolate Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 2,
    options: [
      { id: '02-02-groundhog-day', label: 'Groundhog Day', kind: 'fun' },
      { id: '02-02-play-your-ukulele-day', label: 'Play Your Ukulele Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 3,
    options: [
      { id: '02-03-carrot-cake-day', label: 'Carrot Cake Day', kind: 'fun' },
      { id: '02-03-golden-retriever-day', label: 'Golden Retriever Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 4,
    options: [
      { id: '02-04-thank-your-mail-carrier-day', label: 'Thank Your Mail Carrier Day', kind: 'fun' },
      { id: '02-04-homemade-soup-day', label: 'Homemade Soup Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 5,
    options: [
      { id: '02-05-world-nutella-day', label: 'World Nutella Day', kind: 'global' },
      { id: '02-05-weatherperson-s-day', label: 'Weatherperson\'s Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 6,
    options: [
      { id: '02-06-frozen-yogurt-day', label: 'Frozen Yogurt Day', kind: 'fun' },
      { id: '02-06-lame-duck-day', label: 'Lame Duck Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 7,
    options: [
      { id: '02-07-card-to-a-friend-day', label: 'Card to a Friend Day', kind: 'fun' },
      { id: '02-07-fingers-at-your-neighbors-day', label: 'Fingers at Your Neighbors Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 8,
    options: [
      { id: '02-08-boy-scouts-day', label: 'Boy Scouts Day', kind: 'fun' },
      { id: '02-08-laugh-and-get-rich-day', label: 'Laugh and Get Rich Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 9,
    options: [
      { id: '02-09-pizza-day', label: 'Pizza Day', kind: 'fun' },
      { id: '02-09-toothache-day', label: 'Toothache Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 10,
    options: [
      { id: '02-10-world-pulses-day', label: 'World Pulses Day', kind: 'global' },
      { id: '02-10-umbrella-day', label: 'Umbrella Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 11,
    options: [
      { id: '02-11-make-a-friend-day', label: 'Make a Friend Day', kind: 'fun' },
      { id: '02-11-don-t-cry-over-spilled-milk-day', label: 'Don\'t Cry Over Spilled Milk Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 12,
    options: [
      { id: '02-12-abraham-lincoln-s-birthday', label: 'Abraham Lincoln\'s Birthday', kind: 'civic' },
      { id: '02-12-darwin-day', label: 'Darwin Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 13,
    options: [
      { id: '02-13-world-radio-day', label: 'World Radio Day', kind: 'global' },
      { id: '02-13-world-galentine-s-day', label: 'World Galentine\'s Day', kind: 'global' },
    ],
  },
  {
    month: 2,
    day: 14,
    options: [
      { id: '02-14-valentine-s-day', label: 'Valentine\'s Day', kind: 'fun' },
      { id: '02-14-ferris-wheel-day', label: 'Ferris Wheel Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 15,
    options: [
      { id: '02-15-hippo-day', label: 'Hippo Day', kind: 'fun' },
      { id: '02-15-gumdrop-day', label: 'Gumdrop Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 16,
    options: [
      { id: '02-16-do-a-grouch-a-favor-day', label: 'Do a Grouch a Favor Day', kind: 'fun' },
      { id: '02-16-innovation-day', label: 'Innovation Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 17,
    options: [
      { id: '02-17-random-acts-of-kindness-day', label: 'Random Acts of Kindness Day', kind: 'fun' },
      { id: '02-17-world-cabbage-day', label: 'World Cabbage Day', kind: 'global' },
    ],
  },
  {
    month: 2,
    day: 18,
    options: [
      { id: '02-18-pluto-day', label: 'Pluto Day', kind: 'fun' },
      { id: '02-18-battery-day', label: 'Battery Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 19,
    options: [
      { id: '02-19-mint-day', label: 'Mint Day', kind: 'fun' },
      { id: '02-19-tug-of-war-day', label: 'Tug-of-War Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 20,
    options: [
      { id: '02-20-love-your-pet-day', label: 'Love Your Pet Day', kind: 'fun' },
      { id: '02-20-cherry-pie-day', label: 'Cherry Pie Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 21,
    options: [
      { id: '02-21-international-mother-language-day', label: 'International Mother Language Day', kind: 'global' },
      { id: '02-21-sticky-bun-day', label: 'Sticky Bun Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 22,
    options: [
      { id: '02-22-world-thinking-day', label: 'World Thinking Day', kind: 'global' },
      { id: '02-22-single-tasking-day', label: 'Single Tasking Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 23,
    options: [
      { id: '02-23-dog-biscuit-day', label: 'Dog Biscuit Day', kind: 'fun' },
      { id: '02-23-national-banana-bread-day', label: 'National Banana Bread Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 24,
    options: [
      { id: '02-24-tortilla-chip-day', label: 'Tortilla Chip Day', kind: 'fun' },
      { id: '02-24-national-trading-card-day', label: 'National Trading Card Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 25,
    options: [
      { id: '02-25-quiet-day', label: 'Quiet Day', kind: 'fun' },
      { id: '02-25-clam-chowder-day', label: 'Clam Chowder Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 26,
    options: [
      { id: '02-26-tell-a-fairy-tale-day', label: 'Tell a Fairy Tale Day', kind: 'fun' },
      { id: '02-26-pistachio-day', label: 'Pistachio Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 27,
    options: [
      { id: '02-27-polar-bear-day', label: 'Polar Bear Day', kind: 'fun' },
      { id: '02-27-no-brainer-day', label: 'No Brainer Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 28,
    options: [
      { id: '02-28-tooth-fairy-day', label: 'Tooth Fairy Day', kind: 'fun' },
      { id: '02-28-public-sleeping-day', label: 'Public Sleeping Day', kind: 'fun' },
    ],
  },
  {
    month: 2,
    day: 29,
    options: [
      { id: '02-29-leap-day', label: 'Leap Day', kind: 'fun' },
      { id: '02-29-rare-disease-day', label: 'Rare Disease Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 1,
    options: [
      { id: '03-01-world-compliment-day', label: 'World Compliment Day', kind: 'global' },
      { id: '03-01-peanut-butter-lover-s-day', label: 'Peanut Butter Lover\'s Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 2,
    options: [
      { id: '03-02-read-across-america-day', label: 'Read Across America Day', kind: 'fun' },
      { id: '03-02-old-stuff-day', label: 'Old Stuff Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 3,
    options: [
      { id: '03-03-world-wildlife-day', label: 'World Wildlife Day', kind: 'global' },
      { id: '03-03-you-to-be-happy-day', label: 'You to Be Happy Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 4,
    options: [
      { id: '03-04-marching-band-day', label: 'Marching Band Day', kind: 'fun' },
      { id: '03-04-national-grammar-day', label: 'National Grammar Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 5,
    options: [
      { id: '03-05-cheese-doodle-day', label: 'Cheese Doodle Day', kind: 'fun' },
      { id: '03-05-learn-what-your-name-means-day', label: 'Learn What Your Name Means Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 6,
    options: [
      { id: '03-06-oreo-cookie-day', label: 'Oreo Cookie Day', kind: 'fun' },
      { id: '03-06-dentist-s-day', label: 'Dentist\'s Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 7,
    options: [
      { id: '03-07-national-cereal-day', label: 'National Cereal Day', kind: 'fun' },
      { id: '03-07-flapjack-day', label: 'Flapjack Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 8,
    options: [
      { id: '03-08-international-women-s-day', label: 'International Women\'s Day', kind: 'global' },
      { id: '03-08-proofreading-day', label: 'Proofreading Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 9,
    options: [
      { id: '03-09-barbie-day', label: 'Barbie Day', kind: 'fun' },
      { id: '03-09-meatball-day', label: 'Meatball Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 10,
    options: [
      { id: '03-10-mario-day', label: 'Mario Day', kind: 'fun' },
      { id: '03-10-pack-your-lunch-day', label: 'Pack Your Lunch Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 11,
    options: [
      { id: '03-11-johnny-appleseed-day', label: 'Johnny Appleseed Day', kind: 'fun' },
      { id: '03-11-oatmeal-nut-waffles-day', label: 'Oatmeal Nut Waffles Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 12,
    options: [
      { id: '03-12-plant-a-flower-day', label: 'Plant a Flower Day', kind: 'fun' },
      { id: '03-12-girl-scout-birthday', label: 'Girl Scout Birthday', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 13,
    options: [
      { id: '03-13-jewel-day', label: 'Jewel Day', kind: 'fun' },
      { id: '03-13-earmuffs-day', label: 'Earmuffs Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 14,
    options: [
      { id: '03-14-pi-day', label: 'Pi Day', kind: 'fun' },
      { id: '03-14-learn-about-butterflies-day', label: 'Learn About Butterflies Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 15,
    options: [
      { id: '03-15-ides-of-march', label: 'Ides of March', kind: 'civic' },
      { id: '03-15-shoe-the-world-day', label: 'Shoe the World Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 16,
    options: [
      { id: '03-16-panda-day', label: 'Panda Day', kind: 'fun' },
      { id: '03-16-art-day', label: 'Art Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 17,
    options: [
      { id: '03-17-st-patrick-s-day', label: 'St. Patrick\'s Day', kind: 'fun' },
      { id: '03-17-submarine-day', label: 'Submarine Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 18,
    options: [
      { id: '03-18-awkward-moments-day', label: 'Awkward Moments Day', kind: 'fun' },
      { id: '03-18-biodiesel-day', label: 'Biodiesel Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 19,
    options: [
      { id: '03-19-let-s-laugh-day', label: 'Let\'s Laugh Day', kind: 'fun' },
      { id: '03-19-poultry-day', label: 'Poultry Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 20,
    options: [
      { id: '03-20-international-day-of-happiness', label: 'International Day of Happiness', kind: 'global' },
      { id: '03-20-first-day-of-spring', label: 'First Day of Spring', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 21,
    options: [
      { id: '03-21-world-poetry-day', label: 'World Poetry Day', kind: 'global' },
      { id: '03-21-french-bread-day', label: 'French Bread Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 22,
    options: [
      { id: '03-22-world-water-day', label: 'World Water Day', kind: 'global' },
      { id: '03-22-goof-off-day', label: 'Goof Off Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 23,
    options: [
      { id: '03-23-puppy-day', label: 'Puppy Day', kind: 'fun' },
      { id: '03-23-meteorology-day', label: 'Meteorology Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 24,
    options: [
      { id: '03-24-chocolate-covered-raisin-day', label: 'Chocolate Covered Raisin Day', kind: 'fun' },
      { id: '03-24-cheesesteak-day', label: 'Cheesesteak Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 25,
    options: [
      { id: '03-25-waffle-day', label: 'Waffle Day', kind: 'fun' },
      { id: '03-25-tolkien-reading-day', label: 'Tolkien Reading Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 26,
    options: [
      { id: '03-26-make-up-your-own-day', label: 'Make Up Your Own Day', kind: 'fun' },
      { id: '03-26-spinach-day', label: 'Spinach Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 27,
    options: [
      { id: '03-27-world-theatre-day', label: 'World Theatre Day', kind: 'global' },
      { id: '03-27-spanish-paella-day', label: 'Spanish Paella Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 28,
    options: [
      { id: '03-28-something-on-a-stick-day', label: 'Something on a Stick Day', kind: 'fun' },
      { id: '03-28-respect-your-cat-day', label: 'Respect Your Cat Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 29,
    options: [
      { id: '03-29-mom-and-pop-business-owners-day', label: 'Mom and Pop Business Owners Day', kind: 'fun' },
      { id: '03-29-lemon-chiffon-cake-day', label: 'Lemon Chiffon Cake Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 30,
    options: [
      { id: '03-30-walk-in-the-park-day', label: 'Walk in the Park Day', kind: 'fun' },
      { id: '03-30-pencil-day', label: 'Pencil Day', kind: 'fun' },
    ],
  },
  {
    month: 3,
    day: 31,
    options: [
      { id: '03-31-crayon-day', label: 'Crayon Day', kind: 'fun' },
      { id: '03-31-eiffel-tower-day', label: 'Eiffel Tower Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 1,
    options: [
      { id: '04-01-april-fools-day', label: 'April Fools\' Day', kind: 'fun' },
      { id: '04-01-sourdough-bread-day', label: 'Sourdough Bread Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 2,
    options: [
      { id: '04-02-international-children-s-book-day', label: 'International Children\'s Book Day', kind: 'global' },
      { id: '04-02-peanut-butter-and-jelly-day', label: 'Peanut Butter and Jelly Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 3,
    options: [
      { id: '04-03-find-a-rainbow-day', label: 'Find a Rainbow Day', kind: 'fun' },
      { id: '04-03-world-party-day', label: 'World Party Day', kind: 'global' },
    ],
  },
  {
    month: 4,
    day: 4,
    options: [
      { id: '04-04-school-librarian-day', label: 'School Librarian Day', kind: 'fun' },
      { id: '04-04-hug-a-newsperson-day', label: 'Hug a Newsperson Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 5,
    options: [
      { id: '04-05-deep-dish-pizza-day', label: 'Deep Dish Pizza Day', kind: 'fun' },
      { id: '04-05-read-a-road-map-day', label: 'Read a Road Map Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 6,
    options: [
      { id: '04-06-caramel-popcorn-day', label: 'Caramel Popcorn Day', kind: 'fun' },
      { id: '04-06-tartan-day', label: 'Tartan Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 7,
    options: [
      { id: '04-07-world-health-day', label: 'World Health Day', kind: 'global' },
      { id: '04-07-no-housework-day', label: 'No Housework Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 8,
    options: [
      { id: '04-08-draw-a-bird-day', label: 'Draw a Bird Day', kind: 'fun' },
      { id: '04-08-zoo-lovers-day', label: 'Zoo Lovers Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 9,
    options: [
      { id: '04-09-unicorn-day', label: 'Unicorn Day', kind: 'fun' },
      { id: '04-09-name-yourself-day', label: 'Name Yourself Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 10,
    options: [
      { id: '04-10-national-siblings-day', label: 'National Siblings Day', kind: 'fun' },
      { id: '04-10-farm-animals-day', label: 'Farm Animals Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 11,
    options: [
      { id: '04-11-national-pet-day', label: 'National Pet Day', kind: 'fun' },
      { id: '04-11-submarine-day', label: 'Submarine Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 12,
    options: [
      { id: '04-12-grilled-cheese-sandwich-day', label: 'Grilled Cheese Sandwich Day', kind: 'fun' },
      { id: '04-12-international-day', label: 'International Day', kind: 'global' },
    ],
  },
  {
    month: 4,
    day: 13,
    options: [
      { id: '04-13-scrabble-day', label: 'Scrabble Day', kind: 'fun' },
      { id: '04-13-plant-appreciation-day', label: 'Plant Appreciation Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 14,
    options: [
      { id: '04-14-look-up-at-the-sky-day', label: 'Look Up at the Sky Day', kind: 'fun' },
      { id: '04-14-dolphin-day', label: 'Dolphin Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 15,
    options: [
      { id: '04-15-world-art-day', label: 'World Art Day', kind: 'global' },
      { id: '04-15-rubber-eraser-day', label: 'Rubber Eraser Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 16,
    options: [
      { id: '04-16-save-the-elephant-day', label: 'Save the Elephant Day', kind: 'fun' },
      { id: '04-16-wear-pajamas-to-work-day', label: 'Wear Pajamas to Work Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 17,
    options: [
      { id: '04-17-haiku-poetry-day', label: 'Haiku Poetry Day', kind: 'fun' },
      { id: '04-17-bat-appreciation-day', label: 'Bat Appreciation Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 18,
    options: [
      { id: '04-18-animal-crackers-day', label: 'Animal Crackers Day', kind: 'fun' },
      { id: '04-18-velociraptor-awareness-day', label: 'Velociraptor Awareness Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 19,
    options: [
      { id: '04-19-bicycle-day', label: 'Bicycle Day', kind: 'fun' },
      { id: '04-19-garlic-day', label: 'Garlic Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 20,
    options: [
      { id: '04-20-look-alike-day', label: 'Look Alike Day', kind: 'fun' },
      { id: '04-20-volunteer-recognition-day', label: 'Volunteer Recognition Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 21,
    options: [
      { id: '04-21-kindergarten-day', label: 'Kindergarten Day', kind: 'fun' },
      { id: '04-21-tea-day', label: 'Tea Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 22,
    options: [
      { id: '04-22-earth-day', label: 'Earth Day', kind: 'fun' },
      { id: '04-22-jelly-bean-day', label: 'Jelly Bean Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 23,
    options: [
      { id: '04-23-world-book-day', label: 'World Book Day', kind: 'global' },
      { id: '04-23-picnic-day', label: 'Picnic Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 24,
    options: [
      { id: '04-24-pig-in-a-blanket-day', label: 'Pig in a Blanket Day', kind: 'fun' },
      { id: '04-24-plumbers-day', label: 'Plumbers Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 25,
    options: [
      { id: '04-25-world-penguin-day', label: 'World Penguin Day', kind: 'global' },
      { id: '04-25-dna-day', label: 'DNA Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 26,
    options: [
      { id: '04-26-pretzel-day', label: 'Pretzel Day', kind: 'fun' },
      { id: '04-26-help-a-horse-day', label: 'Help a Horse Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 27,
    options: [
      { id: '04-27-tell-a-story-day', label: 'Tell a Story Day', kind: 'fun' },
      { id: '04-27-babe-ruth-day', label: 'Babe Ruth Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 28,
    options: [
      { id: '04-28-superhero-day', label: 'Superhero Day', kind: 'fun' },
      { id: '04-28-astronomy-day', label: 'Astronomy Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 29,
    options: [
      { id: '04-29-international-dance-day', label: 'International Dance Day', kind: 'global' },
      { id: '04-29-zipper-day', label: 'Zipper Day', kind: 'fun' },
    ],
  },
  {
    month: 4,
    day: 30,
    options: [
      { id: '04-30-bugs-bunny-day', label: 'Bugs Bunny Day', kind: 'fun' },
      { id: '04-30-bugs-bunny-honesty-day', label: 'Bugs Bunny Honesty Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 1,
    options: [
      { id: '05-01-may-day', label: 'May Day', kind: 'fun' },
      { id: '05-01-mother-goose-day', label: 'Mother Goose Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 2,
    options: [
      { id: '05-02-space-day', label: 'Space Day', kind: 'fun' },
      { id: '05-02-brothers-and-sisters-day', label: 'Brothers and Sisters Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 3,
    options: [
      { id: '05-03-two-different-colored-shoes-day', label: 'Two Different Colored Shoes Day', kind: 'fun' },
      { id: '05-03-sun-day', label: 'Sun Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 4,
    options: [
      { id: '05-04-star-wars-day', label: 'Star Wars Day', kind: 'fun' },
      { id: '05-04-firefighters-day', label: 'Firefighters\' Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 5,
    options: [
      { id: '05-05-cinco-de-mayo', label: 'Cinco de Mayo', kind: 'global' },
      { id: '05-05-astronaut-day', label: 'Astronaut Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 6,
    options: [
      { id: '05-06-nurses-day', label: 'Nurses Day', kind: 'fun' },
      { id: '05-06-beverage-day', label: 'Beverage Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 7,
    options: [
      { id: '05-07-national-train-day', label: 'National Train Day', kind: 'fun' },
      { id: '05-07-barrier-awareness-day', label: 'Barrier Awareness Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 8,
    options: [
      { id: '05-08-no-socks-day', label: 'No Socks Day', kind: 'fun' },
      { id: '05-08-red-cross-day', label: 'Red Cross Day', kind: 'civic' },
    ],
  },
  {
    month: 5,
    day: 9,
    options: [
      { id: '05-09-lost-sock-memorial-day', label: 'Lost Sock Memorial Day', kind: 'civic' },
      { id: '05-09-alphabet-day', label: 'Alphabet Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 10,
    options: [
      { id: '05-10-clean-up-your-room-day', label: 'Clean Up Your Room Day', kind: 'fun' },
      { id: '05-10-ocean-day', label: 'Ocean Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 11,
    options: [
      { id: '05-11-eat-what-you-want-day', label: 'Eat What You Want Day', kind: 'fun' },
      { id: '05-11-twilight-zone-day', label: 'Twilight Zone Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 12,
    options: [
      { id: '05-12-limerick-day', label: 'Limerick Day', kind: 'fun' },
      { id: '05-12-odometer-day', label: 'Odometer Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 13,
    options: [
      { id: '05-13-frog-jumping-day', label: 'Frog Jumping Day', kind: 'fun' },
      { id: '05-13-apple-pie-day', label: 'Apple Pie Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 14,
    options: [
      { id: '05-14-dance-like-a-chicken-day', label: 'Dance Like a Chicken Day', kind: 'fun' },
      { id: '05-14-decency-day', label: 'Decency Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 15,
    options: [
      { id: '05-15-chocolate-chip-day', label: 'Chocolate Chip Day', kind: 'fun' },
      { id: '05-15-endangered-species-day', label: 'Endangered Species Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 16,
    options: [
      { id: '05-16-love-a-tree-day', label: 'Love a Tree Day', kind: 'fun' },
      { id: '05-16-sea-monkey-day', label: 'Sea Monkey Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 17,
    options: [
      { id: '05-17-pack-rat-day', label: 'Pack Rat Day', kind: 'fun' },
      { id: '05-17-walnut-day', label: 'Walnut Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 18,
    options: [
      { id: '05-18-international-museum-day', label: 'International Museum Day', kind: 'global' },
      { id: '05-18-no-dirty-dishes-day', label: 'No Dirty Dishes Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 19,
    options: [
      { id: '05-19-may-ray-day', label: 'May Ray Day', kind: 'fun' },
      { id: '05-19-plant-a-vegetable-garden-day', label: 'Plant a Vegetable Garden Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 20,
    options: [
      { id: '05-20-world-bee-day', label: 'World Bee Day', kind: 'global' },
      { id: '05-20-rescue-dog-day', label: 'Rescue Dog Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 21,
    options: [
      { id: '05-21-talk-like-yoda-day', label: 'Talk Like Yoda Day', kind: 'fun' },
      { id: '05-21-memo-day', label: 'Memo Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 22,
    options: [
      { id: '05-22-buy-a-musical-instrument-day', label: 'Buy a Musical Instrument Day', kind: 'fun' },
      { id: '05-22-vanilla-pudding-day', label: 'Vanilla Pudding Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 23,
    options: [
      { id: '05-23-world-turtle-day', label: 'World Turtle Day', kind: 'global' },
      { id: '05-23-lucky-penny-day', label: 'Lucky Penny Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 24,
    options: [
      { id: '05-24-scavenger-hunt-day', label: 'Scavenger Hunt Day', kind: 'fun' },
      { id: '05-24-brother-s-day', label: 'Brother\'s Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 25,
    options: [
      { id: '05-25-towel-day', label: 'Towel Day', kind: 'fun' },
      { id: '05-25-tap-dance-day', label: 'Tap Dance Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 26,
    options: [
      { id: '05-26-paper-airplane-day', label: 'Paper Airplane Day', kind: 'fun' },
      { id: '05-26-blueberry-cheesecake-day', label: 'Blueberry Cheesecake Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 27,
    options: [
      { id: '05-27-sun-screen-day', label: 'Sun Screen Day', kind: 'fun' },
      { id: '05-27-cellophane-tape-day', label: 'Cellophane Tape Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 28,
    options: [
      { id: '05-28-hamburger-day', label: 'Hamburger Day', kind: 'fun' },
      { id: '05-28-slugs-return-from-capistrano-day', label: 'Slugs Return From Capistrano Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 29,
    options: [
      { id: '05-29-paperclip-day', label: 'Paperclip Day', kind: 'fun' },
      { id: '05-29-learn-about-composting-day', label: 'Learn About Composting Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 30,
    options: [
      { id: '05-30-water-a-flower-day', label: 'Water a Flower Day', kind: 'fun' },
      { id: '05-30-creativity-day', label: 'Creativity Day', kind: 'fun' },
    ],
  },
  {
    month: 5,
    day: 31,
    options: [
      { id: '05-31-smile-day', label: 'Smile Day', kind: 'fun' },
      { id: '05-31-macaroon-day', label: 'Macaroon Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 1,
    options: [
      { id: '06-01-say-something-nice-day', label: 'Say Something Nice Day', kind: 'fun' },
      { id: '06-01-heimlich-maneuver-day', label: 'Heimlich Maneuver Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 2,
    options: [
      { id: '06-02-national-rocky-road-day', label: 'National Rocky Road Day', kind: 'fun' },
      { id: '06-02-leave-the-office-early-day', label: 'Leave the Office Early Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 3,
    options: [
      { id: '06-03-world-bicycle-day', label: 'World Bicycle Day', kind: 'global' },
      { id: '06-03-egg-day', label: 'Egg Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 4,
    options: [
      { id: '06-04-hug-your-cat-day', label: 'Hug Your Cat Day', kind: 'fun' },
      { id: '06-04-national-cheese-day', label: 'National Cheese Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 5,
    options: [
      { id: '06-05-world-environment-day', label: 'World Environment Day', kind: 'global' },
      { id: '06-05-gingerbread-day', label: 'Gingerbread Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 6,
    options: [
      { id: '06-06-national-yo-yo-day', label: 'National Yo-Yo Day', kind: 'fun' },
      { id: '06-06-drive-in-movie-day', label: 'Drive-In Movie Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 7,
    options: [
      { id: '06-07-chocolate-ice-cream-day', label: 'Chocolate Ice Cream Day', kind: 'fun' },
      { id: '06-07-vcr-day', label: 'VCR Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 8,
    options: [
      { id: '06-08-world-oceans-day', label: 'World Oceans Day', kind: 'global' },
      { id: '06-08-best-friends-day', label: 'Best Friends Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 9,
    options: [
      { id: '06-09-donald-duck-day', label: 'Donald Duck Day', kind: 'fun' },
      { id: '06-09-strawberry-rhubarb-pie-day', label: 'Strawberry Rhubarb Pie Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 10,
    options: [
      { id: '06-10-ballpoint-pen-day', label: 'Ballpoint Pen Day', kind: 'fun' },
      { id: '06-10-iced-tea-day', label: 'Iced Tea Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 11,
    options: [
      { id: '06-11-corn-on-the-cob-day', label: 'Corn on the Cob Day', kind: 'fun' },
      { id: '06-11-king-kamehameha-day', label: 'King Kamehameha Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 12,
    options: [
      { id: '06-12-red-rose-day', label: 'Red Rose Day', kind: 'fun' },
      { id: '06-12-peanut-butter-cookie-day', label: 'Peanut Butter Cookie Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 13,
    options: [
      { id: '06-13-sewing-machine-day', label: 'Sewing Machine Day', kind: 'fun' },
      { id: '06-13-weed-your-garden-day', label: 'Weed Your Garden Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 14,
    options: [
      { id: '06-14-flag-day', label: 'Flag Day', kind: 'civic' },
      { id: '06-14-national-strawberry-shortcake-day', label: 'National Strawberry Shortcake Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 15,
    options: [
      { id: '06-15-nature-photography-day', label: 'Nature Photography Day', kind: 'fun' },
      { id: '06-15-smile-power-day', label: 'Smile Power Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 16,
    options: [
      { id: '06-16-fresh-veggies-day', label: 'Fresh Veggies Day', kind: 'fun' },
      { id: '06-16-fudge-day', label: 'Fudge Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 17,
    options: [
      { id: '06-17-eat-your-vegetables-day', label: 'Eat Your Vegetables Day', kind: 'fun' },
      { id: '06-17-stewart-little-day', label: 'Stewart Little Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 18,
    options: [
      { id: '06-18-international-picnic-day', label: 'International Picnic Day', kind: 'global' },
      { id: '06-18-go-fishing-day', label: 'Go Fishing Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 19,
    options: [
      { id: '06-19-juneteenth', label: 'Juneteenth', kind: 'global' },
      { id: '06-19-world-sauntering-day', label: 'World Sauntering Day', kind: 'global' },
    ],
  },
  {
    month: 6,
    day: 20,
    options: [
      { id: '06-20-american-eagle-day', label: 'American Eagle Day', kind: 'fun' },
      { id: '06-20-vanilla-milkshake-day', label: 'Vanilla Milkshake Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 21,
    options: [
      { id: '06-21-summer-solstice-first-day-of-summer', label: 'Summer Solstice (First Day of Summer)', kind: 'fun' },
      { id: '06-21-world-music-day', label: 'World Music Day', kind: 'global' },
    ],
  },
  {
    month: 6,
    day: 22,
    options: [
      { id: '06-22-onion-day', label: 'Onion Day', kind: 'fun' },
      { id: '06-22-chocolate-eclair-day', label: 'Chocolate Eclair Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 23,
    options: [
      { id: '06-23-pink-day', label: 'Pink Day', kind: 'fun' },
      { id: '06-23-let-it-go-day', label: 'Let It Go Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 24,
    options: [
      { id: '06-24-take-your-dog-to-work-day', label: 'Take Your Dog to Work Day', kind: 'fun' },
      { id: '06-24-u-f-o-day', label: 'U.F.O Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 25,
    options: [
      { id: '06-25-strawberry-parfait-day', label: 'Strawberry Parfait Day', kind: 'fun' },
      { id: '06-25-catfish-day', label: 'Catfish Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 26,
    options: [
      { id: '06-26-chocolate-pudding-day', label: 'Chocolate Pudding Day', kind: 'fun' },
      { id: '06-26-beautify-your-desk-day', label: 'Beautify Your Desk Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 27,
    options: [
      { id: '06-27-national-sunglasses-day', label: 'National Sunglasses Day', kind: 'fun' },
      { id: '06-27-pineapple-day', label: 'Pineapple Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 28,
    options: [
      { id: '06-28-tau-day', label: 'Tau Day', kind: 'fun' },
      { id: '06-28-insurance-nerd-day', label: 'Insurance Nerd Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 29,
    options: [
      { id: '06-29-waffle-iron-day', label: 'Waffle Iron Day', kind: 'fun' },
      { id: '06-29-camera-day', label: 'Camera Day', kind: 'fun' },
    ],
  },
  {
    month: 6,
    day: 30,
    options: [
      { id: '06-30-meteor-watch-day', label: 'Meteor Watch Day', kind: 'fun' },
      { id: '06-30-social-media-day', label: 'Social Media Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 1,
    options: [
      { id: '07-01-canada-day', label: 'Canada Day', kind: 'global' },
      { id: '07-01-international-joke-day', label: 'International Joke Day', kind: 'global' },
    ],
  },
  {
    month: 7,
    day: 2,
    options: [
      { id: '07-02-world-ufo-day', label: 'World UFO Day', kind: 'global' },
      { id: '07-02-national-i-forgot-day', label: 'National I Forgot Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 3,
    options: [
      { id: '07-03-stay-out-of-the-sun-day', label: 'Stay Out of the Sun Day', kind: 'fun' },
      { id: '07-03-chocolate-wafer-day', label: 'Chocolate Wafer Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 4,
    options: [
      { id: '07-04-independence-day', label: 'Independence Day', kind: 'civic' },
      { id: '07-04-caesar-salad-day', label: 'Caesar Salad Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 5,
    options: [
      { id: '07-05-national-graham-cracker-day', label: 'National Graham Cracker Day', kind: 'fun' },
      { id: '07-05-apple-turnover-day', label: 'Apple Turnover Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 6,
    options: [
      { id: '07-06-national-hand-roll-day', label: 'National Hand Roll Day', kind: 'fun' },
      { id: '07-06-fried-chicken-day', label: 'Fried Chicken Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 7,
    options: [
      { id: '07-07-world-chocolate-day', label: 'World Chocolate Day', kind: 'global' },
      { id: '07-07-tell-the-truth-day', label: 'Tell the Truth Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 8,
    options: [
      { id: '07-08-video-games-day', label: 'Video Games Day', kind: 'fun' },
      { id: '07-08-chocolate-with-almonds-day', label: 'Chocolate with Almonds Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 9,
    options: [
      { id: '07-09-sugar-cookie-day', label: 'Sugar Cookie Day', kind: 'fun' },
      { id: '07-09-cow-appreciation-day', label: 'Cow Appreciation Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 10,
    options: [
      { id: '07-10-national-french-fry-day', label: 'National French Fry Day', kind: 'fun' },
      { id: '07-10-pick-blueberries-day', label: 'Pick Blueberries Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 11,
    options: [
      { id: '07-11-world-population-day', label: 'World Population Day', kind: 'global' },
      { id: '07-11-cheer-up-the-lonely-day', label: 'Cheer Up the Lonely Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 12,
    options: [
      { id: '07-12-different-colored-eyes-day', label: 'Different Colored Eyes Day', kind: 'fun' },
      { id: '07-12-simplicity-day', label: 'Simplicity Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 13,
    options: [
      { id: '07-13-french-fry-day', label: 'French Fry Day', kind: 'fun' },
      { id: '07-13-embrace-your-geekness-day', label: 'Embrace Your Geekness Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 14,
    options: [
      { id: '07-14-bastille-day', label: 'Bastille Day', kind: 'global' },
      { id: '07-14-shark-awareness-day', label: 'Shark Awareness Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 15,
    options: [
      { id: '07-15-gummi-worm-day', label: 'Gummi Worm Day', kind: 'fun' },
      { id: '07-15-give-something-away-day', label: 'Give Something Away Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 16,
    options: [
      { id: '07-16-fresh-spinach-day', label: 'Fresh Spinach Day', kind: 'fun' },
      { id: '07-16-corn-fritters-day', label: 'Corn Fritters Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 17,
    options: [
      { id: '07-17-world-emoji-day', label: 'World Emoji Day', kind: 'global' },
      { id: '07-17-peach-ice-cream-day', label: 'Peach Ice Cream Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 18,
    options: [
      { id: '07-18-world-listening-day', label: 'World Listening Day', kind: 'global' },
      { id: '07-18-caviar-day', label: 'Caviar Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 19,
    options: [
      { id: '07-19-national-play-day', label: 'National Play Day', kind: 'fun' },
      { id: '07-19-ice-cream-soda-day', label: 'Ice Cream Soda Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 20,
    options: [
      { id: '07-20-moon-day', label: 'Moon Day', kind: 'fun' },
      { id: '07-20-lollipop-day', label: 'Lollipop Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 21,
    options: [
      { id: '07-21-junk-food-day', label: 'Junk Food Day', kind: 'fun' },
      { id: '07-21-be-someone-day', label: 'Be Someone Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 22,
    options: [
      { id: '07-22-hammock-day', label: 'Hammock Day', kind: 'fun' },
      { id: '07-22-pi-approximation-day', label: 'Pi Approximation Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 23,
    options: [
      { id: '07-23-vanilla-ice-cream-day', label: 'Vanilla Ice Cream Day', kind: 'fun' },
      { id: '07-23-gorgeous-grandma-day', label: 'Gorgeous Grandma Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 24,
    options: [
      { id: '07-24-amelia-earhart-day', label: 'Amelia Earhart Day', kind: 'fun' },
      { id: '07-24-national-cousins-day', label: 'National Cousins Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 25,
    options: [
      { id: '07-25-merry-go-round-day', label: 'Merry-Go-Round Day', kind: 'fun' },
      { id: '07-25-hot-fudge-sundae-day', label: 'Hot Fudge Sundae Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 26,
    options: [
      { id: '07-26-aunt-and-uncle-day', label: 'Aunt and Uncle Day', kind: 'fun' },
      { id: '07-26-nothing-day', label: 'Nothing Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 27,
    options: [
      { id: '07-27-houseplant-for-a-walk-day', label: 'Houseplant for a Walk Day', kind: 'fun' },
      { id: '07-27-scotch-tape-day', label: 'Scotch Tape Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 28,
    options: [
      { id: '07-28-milk-chocolate-day', label: 'Milk Chocolate Day', kind: 'fun' },
      { id: '07-28-world-nature-conservation-day', label: 'World Nature Conservation Day', kind: 'global' },
    ],
  },
  {
    month: 7,
    day: 29,
    options: [
      { id: '07-29-lasagna-day', label: 'Lasagna Day', kind: 'fun' },
      { id: '07-29-lipstick-day', label: 'Lipstick Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 30,
    options: [
      { id: '07-30-international-friendship-day', label: 'International Friendship Day', kind: 'global' },
      { id: '07-30-cheesecake-day', label: 'Cheesecake Day', kind: 'fun' },
    ],
  },
  {
    month: 7,
    day: 31,
    options: [
      { id: '07-31-mutt-day', label: 'Mutt Day', kind: 'fun' },
      { id: '07-31-avocado-day', label: 'Avocado Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 1,
    options: [
      { id: '08-01-spider-man-day', label: 'Spider-Man Day', kind: 'fun' },
      { id: '08-01-respect-for-parents-day', label: 'Respect for Parents Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 2,
    options: [
      { id: '08-02-ice-cream-sandwich-day', label: 'Ice Cream Sandwich Day', kind: 'fun' },
      { id: '08-02-coloring-book-day', label: 'Coloring Book Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 3,
    options: [
      { id: '08-03-watermelon-day', label: 'Watermelon Day', kind: 'fun' },
      { id: '08-03-sandcastle-day', label: 'Sandcastle Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 4,
    options: [
      { id: '08-04-chocolate-chip-cookie-day', label: 'Chocolate Chip Cookie Day', kind: 'fun' },
      { id: '08-04-coast-guard-day', label: 'Coast Guard Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 5,
    options: [
      { id: '08-05-work-like-a-dog-day', label: 'Work Like a Dog Day', kind: 'fun' },
      { id: '08-05-international-traffic-light-day', label: 'International Traffic Light Day', kind: 'global' },
    ],
  },
  {
    month: 8,
    day: 6,
    options: [
      { id: '08-06-root-beer-float-day', label: 'Root Beer Float Day', kind: 'fun' },
      { id: '08-06-wiggle-your-toes-day', label: 'Wiggle Your Toes Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 7,
    options: [
      { id: '08-07-lighthouse-day', label: 'Lighthouse Day', kind: 'fun' },
      { id: '08-07-sea-serpent-day', label: 'Sea Serpent Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 8,
    options: [
      { id: '08-08-international-cat-day', label: 'International Cat Day', kind: 'global' },
      { id: '08-08-infinity-day', label: 'Infinity Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 9,
    options: [
      { id: '08-09-book-lovers-day', label: 'Book Lovers Day', kind: 'fun' },
      { id: '08-09-indigenous-peoples-day', label: 'Indigenous Peoples\' Day', kind: 'civic' },
    ],
  },
  {
    month: 8,
    day: 10,
    options: [
      { id: '08-10-s-mores-day', label: 'S\'mores Day', kind: 'fun' },
      { id: '08-10-world-lion-day', label: 'World Lion Day', kind: 'global' },
    ],
  },
  {
    month: 8,
    day: 11,
    options: [
      { id: '08-11-son-and-daughter-day', label: 'Son and Daughter Day', kind: 'fun' },
      { id: '08-11-play-in-the-sand-day', label: 'Play in the Sand Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 12,
    options: [
      { id: '08-12-world-elephant-day', label: 'World Elephant Day', kind: 'global' },
      { id: '08-12-middle-child-day', label: 'Middle Child Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 13,
    options: [
      { id: '08-13-left-handers-day', label: 'Left-Handers Day', kind: 'fun' },
      { id: '08-13-bowling-day', label: 'Bowling Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 14,
    options: [
      { id: '08-14-creamsicle-day', label: 'Creamsicle Day', kind: 'fun' },
      { id: '08-14-lizard-day', label: 'Lizard Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 15,
    options: [
      { id: '08-15-relaxation-day', label: 'Relaxation Day', kind: 'fun' },
      { id: '08-15-lemon-meringue-pie-day', label: 'Lemon Meringue Pie Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 16,
    options: [
      { id: '08-16-tell-a-joke-day', label: 'Tell a Joke Day', kind: 'fun' },
      { id: '08-16-roller-coaster-day', label: 'Roller Coaster Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 17,
    options: [
      { id: '08-17-black-cat-appreciation-day', label: 'Black Cat Appreciation Day', kind: 'fun' },
      { id: '08-17-thrift-shop-day', label: 'Thrift Shop Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 18,
    options: [
      { id: '08-18-fajita-day', label: 'Fajita Day', kind: 'fun' },
      { id: '08-18-bad-poetry-day', label: 'Bad Poetry Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 19,
    options: [
      { id: '08-19-world-photography-day', label: 'World Photography Day', kind: 'global' },
      { id: '08-19-aviation-day', label: 'Aviation Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 20,
    options: [
      { id: '08-20-world-mosquito-day', label: 'World Mosquito Day', kind: 'global' },
      { id: '08-20-lemonade-day', label: 'Lemonade Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 21,
    options: [
      { id: '08-21-senior-citizens-day', label: 'Senior Citizens Day', kind: 'fun' },
      { id: '08-21-poet-s-day', label: 'Poet\'s Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 22,
    options: [
      { id: '08-22-be-an-angel-day', label: 'Be an Angel Day', kind: 'fun' },
      { id: '08-22-bao-day', label: 'Bao Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 23,
    options: [
      { id: '08-23-ride-the-wind-day', label: 'Ride the Wind Day', kind: 'fun' },
      { id: '08-23-sponge-cake-day', label: 'Sponge Cake Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 24,
    options: [
      { id: '08-24-pluto-demoted-day', label: 'Pluto Demoted Day', kind: 'fun' },
      { id: '08-24-pluto-peach-pie-day', label: 'Pluto Peach Pie Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 25,
    options: [
      { id: '08-25-banana-split-day', label: 'Banana Split Day', kind: 'fun' },
      { id: '08-25-kiss-and-make-up-day', label: 'Kiss and Make Up Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 26,
    options: [
      { id: '08-26-national-dog-day', label: 'National Dog Day', kind: 'fun' },
      { id: '08-26-cherry-popsicle-day', label: 'Cherry Popsicle Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 27,
    options: [
      { id: '08-27-just-because-day', label: 'Just Because Day', kind: 'fun' },
      { id: '08-27-rock-paper-scissors-day', label: 'Rock Paper Scissors Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 28,
    options: [
      { id: '08-28-bow-tie-day', label: 'Bow Tie Day', kind: 'fun' },
      { id: '08-28-cherry-turnover-day', label: 'Cherry Turnover Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 29,
    options: [
      { id: '08-29-lemon-juice-day', label: 'Lemon Juice Day', kind: 'fun' },
      { id: '08-29-chop-suey-day', label: 'Chop Suey Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 30,
    options: [
      { id: '08-30-frankenstein-day', label: 'Frankenstein Day', kind: 'fun' },
      { id: '08-30-slinky-day', label: 'Slinky Day', kind: 'fun' },
    ],
  },
  {
    month: 8,
    day: 31,
    options: [
      { id: '08-31-trail-mix-day', label: 'Trail Mix Day', kind: 'fun' },
      { id: '08-31-eat-outside-day', label: 'Eat Outside Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 1,
    options: [
      { id: '09-01-letter-writing-day', label: 'Letter Writing Day', kind: 'fun' },
      { id: '09-01-emma-m-nutt-day', label: 'Emma M. Nutt Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 2,
    options: [
      { id: '09-02-blueberry-popsicle-day', label: 'Blueberry Popsicle Day', kind: 'fun' },
      { id: '09-02-v-j-day', label: 'V-J Day', kind: 'civic' },
    ],
  },
  {
    month: 9,
    day: 3,
    options: [
      { id: '09-03-skyscraper-day', label: 'Skyscraper Day', kind: 'fun' },
      { id: '09-03-welsh-rarebit-day', label: 'Welsh Rarebit Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 4,
    options: [
      { id: '09-04-macadamia-nut-day', label: 'Macadamia Nut Day', kind: 'fun' },
      { id: '09-04-eat-an-extra-dessert-day', label: 'Eat an Extra Dessert Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 5,
    options: [
      { id: '09-05-cheese-pizza-day', label: 'Cheese Pizza Day', kind: 'fun' },
      { id: '09-05-be-late-for-something-day', label: 'Be Late for Something Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 6,
    options: [
      { id: '09-06-read-a-book-day', label: 'Read a Book Day', kind: 'fun' },
      { id: '09-06-fight-procrastination-day', label: 'Fight Procrastination Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 7,
    options: [
      { id: '09-07-salami-day', label: 'Salami Day', kind: 'fun' },
      { id: '09-07-buy-a-book-day', label: 'Buy a Book Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 8,
    options: [
      { id: '09-08-international-literacy-day', label: 'International Literacy Day', kind: 'global' },
      { id: '09-08-ampersand-day', label: 'Ampersand Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 9,
    options: [
      { id: '09-09-teddy-bear-day', label: 'Teddy Bear Day', kind: 'fun' },
      { id: '09-09-sudoku-day', label: 'Sudoku Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 10,
    options: [
      { id: '09-10-swap-ideas-day', label: 'Swap Ideas Day', kind: 'fun' },
      { id: '09-10-tv-dinner-day', label: 'TV Dinner Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 11,
    options: [
      { id: '09-11-make-your-bed-day', label: 'Make Your Bed Day', kind: 'fun' },
      { id: '09-11-patriot-day', label: 'Patriot Day', kind: 'civic' },
    ],
  },
  {
    month: 9,
    day: 12,
    options: [
      { id: '09-12-chocolate-milkshake-day', label: 'Chocolate Milkshake Day', kind: 'fun' },
      { id: '09-12-day-of-encouragement', label: 'Day of Encouragement', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 13,
    options: [
      { id: '09-13-positive-thinking-day', label: 'Positive Thinking Day', kind: 'fun' },
      { id: '09-13-roald-dahl-day', label: 'Roald Dahl Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 14,
    options: [
      { id: '09-14-coloring-day', label: 'Coloring Day', kind: 'fun' },
      { id: '09-14-cream-filled-donut-day', label: 'Cream-Filled Donut Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 15,
    options: [
      { id: '09-15-make-a-hat-day', label: 'Make a Hat Day', kind: 'fun' },
      { id: '09-15-international-dot-day', label: 'International Dot Day', kind: 'global' },
    ],
  },
  {
    month: 9,
    day: 16,
    options: [
      { id: '09-16-play-doh-day', label: 'Play-Doh Day', kind: 'fun' },
      { id: '09-16-guacamole-day', label: 'Guacamole Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 17,
    options: [
      { id: '09-17-constitution-day', label: 'Constitution Day', kind: 'civic' },
      { id: '09-17-apple-dumpling-day', label: 'Apple Dumpling Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 18,
    options: [
      { id: '09-18-cheeseburger-day', label: 'Cheeseburger Day', kind: 'fun' },
      { id: '09-18-respect-day', label: 'Respect Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 19,
    options: [
      { id: '09-19-talk-like-a-pirate-day', label: 'Talk Like a Pirate Day', kind: 'fun' },
      { id: '09-19-butterscotch-pudding-day', label: 'Butterscotch Pudding Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 20,
    options: [
      { id: '09-20-pepperoni-pizza-day', label: 'Pepperoni Pizza Day', kind: 'fun' },
      { id: '09-20-string-cheese-day', label: 'String Cheese Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 21,
    options: [
      { id: '09-21-miniature-golf-day', label: 'Miniature Golf Day', kind: 'fun' },
      { id: '09-21-international-day', label: 'International Day', kind: 'global' },
    ],
  },
  {
    month: 9,
    day: 22,
    options: [
      { id: '09-22-elephant-appreciation-day', label: 'Elephant Appreciation Day', kind: 'fun' },
      { id: '09-22-ice-cream-cone-day', label: 'Ice Cream Cone Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 23,
    options: [
      { id: '09-23-first-day-of-fall-equinox', label: 'First Day of Fall (Equinox)', kind: 'fun' },
      { id: '09-23-checkers-day', label: 'Checkers Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 24,
    options: [
      { id: '09-24-punctuation-day', label: 'Punctuation Day', kind: 'fun' },
      { id: '09-24-cherries-jubilee-day', label: 'Cherries Jubilee Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 25,
    options: [
      { id: '09-25-comic-book-day', label: 'Comic Book Day', kind: 'fun' },
      { id: '09-25-cooking-day', label: 'Cooking Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 26,
    options: [
      { id: '09-26-dumpling-day', label: 'Dumpling Day', kind: 'fun' },
      { id: '09-26-pancake-day', label: 'Pancake Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 27,
    options: [
      { id: '09-27-world-tourism-day', label: 'World Tourism Day', kind: 'global' },
      { id: '09-27-crush-a-can-day', label: 'Crush a Can Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 28,
    options: [
      { id: '09-28-good-neighbor-day', label: 'Good Neighbor Day', kind: 'fun' },
      { id: '09-28-strawberry-cream-pie-day', label: 'Strawberry Cream Pie Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 29,
    options: [
      { id: '09-29-world-heart-day', label: 'World Heart Day', kind: 'global' },
      { id: '09-29-oatmeal-nut-waffles-day', label: 'Oatmeal Nut Waffles Day', kind: 'fun' },
    ],
  },
  {
    month: 9,
    day: 30,
    options: [
      { id: '09-30-chewing-gum-day', label: 'Chewing Gum Day', kind: 'fun' },
      { id: '09-30-podcast-day', label: 'Podcast Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 1,
    options: [
      { id: '10-01-homemade-cookies-day', label: 'Homemade Cookies Day', kind: 'fun' },
      { id: '10-01-international-music-day', label: 'International Music Day', kind: 'global' },
    ],
  },
  {
    month: 10,
    day: 2,
    options: [
      { id: '10-02-name-your-car-day', label: 'Name Your Car Day', kind: 'fun' },
      { id: '10-02-farm-animals-day', label: 'Farm Animals Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 3,
    options: [
      { id: '10-03-techies-day', label: 'Techies Day', kind: 'fun' },
      { id: '10-03-butterfly-and-hummingbird-day', label: 'Butterfly and Hummingbird Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 4,
    options: [
      { id: '10-04-world-animal-day', label: 'World Animal Day', kind: 'global' },
      { id: '10-04-taco-day', label: 'Taco Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 5,
    options: [
      { id: '10-05-world-teachers-day', label: 'World Teachers\' Day', kind: 'global' },
      { id: '10-05-do-something-nice-day', label: 'Do Something Nice Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 6,
    options: [
      { id: '10-06-mad-hatter-day', label: 'Mad Hatter Day', kind: 'fun' },
      { id: '10-06-noodle-day', label: 'Noodle Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 7,
    options: [
      { id: '10-07-bathtub-day', label: 'Bathtub Day', kind: 'fun' },
      { id: '10-07-frappe-day', label: 'Frappe Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 8,
    options: [
      { id: '10-08-octopus-day', label: 'Octopus Day', kind: 'fun' },
      { id: '10-08-pierogi-day', label: 'Pierogi Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 9,
    options: [
      { id: '10-09-fire-prevention-day', label: 'Fire Prevention Day', kind: 'fun' },
      { id: '10-09-curious-events-day', label: 'Curious Events Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 10,
    options: [
      { id: '10-10-angel-food-cake-day', label: 'Angel Food Cake Day', kind: 'fun' },
      { id: '10-10-metric-day', label: 'Metric Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 11,
    options: [
      { id: '10-11-it-s-my-party-day', label: 'It\'s My Party Day', kind: 'fun' },
      { id: '10-11-sausage-pizza-day', label: 'Sausage Pizza Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 12,
    options: [
      { id: '10-12-farmers-day', label: 'Farmers Day', kind: 'fun' },
      { id: '10-12-pumpkin-pie-day', label: 'Pumpkin Pie Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 13,
    options: [
      { id: '10-13-train-your-brain-day', label: 'Train Your Brain Day', kind: 'fun' },
      { id: '10-13-yorkshire-pudding-day', label: 'Yorkshire Pudding Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 14,
    options: [
      { id: '10-14-dessert-day', label: 'Dessert Day', kind: 'fun' },
      { id: '10-14-be-bald-and-free-day', label: 'Be Bald and Free Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 15,
    options: [
      { id: '10-15-global-handwashing-day', label: 'Global Handwashing Day', kind: 'global' },
      { id: '10-15-pug-day', label: 'Pug Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 16,
    options: [
      { id: '10-16-dictionary-day', label: 'Dictionary Day', kind: 'fun' },
      { id: '10-16-world-food-day', label: 'World Food Day', kind: 'global' },
    ],
  },
  {
    month: 10,
    day: 17,
    options: [
      { id: '10-17-pasta-day', label: 'Pasta Day', kind: 'fun' },
      { id: '10-17-wear-something-gaudy-day', label: 'Wear Something Gaudy Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 18,
    options: [
      { id: '10-18-chocolate-cupcake-day', label: 'Chocolate Cupcake Day', kind: 'fun' },
      { id: '10-18-toy-camera-day', label: 'Toy Camera Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 19,
    options: [
      { id: '10-19-new-friends-day', label: 'New Friends Day', kind: 'fun' },
      { id: '10-19-seafood-bisque-day', label: 'Seafood Bisque Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 20,
    options: [
      { id: '10-20-sloth-day', label: 'Sloth Day', kind: 'fun' },
      { id: '10-20-information-overload-day', label: 'Information Overload Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 21,
    options: [
      { id: '10-21-reptile-awareness-day', label: 'Reptile Awareness Day', kind: 'fun' },
      { id: '10-21-apple-day', label: 'Apple Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 22,
    options: [
      { id: '10-22-nut-day', label: 'Nut Day', kind: 'fun' },
      { id: '10-22-color-day', label: 'Color Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 23,
    options: [
      { id: '10-23-mole-day', label: 'Mole Day', kind: 'fun' },
      { id: '10-23-croc-day', label: 'Croc Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 24,
    options: [
      { id: '10-24-united-nations-day', label: 'United Nations Day', kind: 'global' },
      { id: '10-24-bologna-day', label: 'Bologna Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 25,
    options: [
      { id: '10-25-art-day', label: 'Art Day', kind: 'fun' },
      { id: '10-25-sourest-day', label: 'Sourest Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 26,
    options: [
      { id: '10-26-pumpkin-day', label: 'Pumpkin Day', kind: 'fun' },
      { id: '10-26-howl-at-the-moon-day', label: 'Howl at the Moon Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 27,
    options: [
      { id: '10-27-black-cat-day', label: 'Black Cat Day', kind: 'fun' },
      { id: '10-27-tell-a-story-day', label: 'Tell a Story Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 28,
    options: [
      { id: '10-28-plush-animal-lover-s-day', label: 'Plush Animal Lover\'s Day', kind: 'fun' },
      { id: '10-28-chocolate-day', label: 'Chocolate Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 29,
    options: [
      { id: '10-29-oatmeal-day', label: 'Oatmeal Day', kind: 'fun' },
      { id: '10-29-cat-day', label: 'Cat Day', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 30,
    options: [
      { id: '10-30-candy-corn-day', label: 'Candy Corn Day', kind: 'fun' },
      { id: '10-30-haunted-refrigerator-night', label: 'Haunted Refrigerator Night', kind: 'fun' },
    ],
  },
  {
    month: 10,
    day: 31,
    options: [
      { id: '10-31-halloween', label: 'Halloween', kind: 'fun' },
      { id: '10-31-magic-day', label: 'Magic Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 1,
    options: [
      { id: '11-01-authors-day', label: 'Authors\' Day', kind: 'fun' },
      { id: '11-01-brush-your-teeth-day', label: 'Brush Your Teeth Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 2,
    options: [
      { id: '11-02-deviled-egg-day', label: 'Deviled Egg Day', kind: 'fun' },
      { id: '11-02-look-for-circles-day', label: 'Look for Circles Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 3,
    options: [
      { id: '11-03-sandwich-day', label: 'Sandwich Day', kind: 'fun' },
      { id: '11-03-jellyfish-day', label: 'Jellyfish Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 4,
    options: [
      { id: '11-04-candy-day', label: 'Candy Day', kind: 'fun' },
      { id: '11-04-king-tut-day', label: 'King Tut Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 5,
    options: [
      { id: '11-05-doughnut-day', label: 'Doughnut Day', kind: 'fun' },
      { id: '11-05-redhead-day', label: 'Redhead Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 6,
    options: [
      { id: '11-06-nachos-day', label: 'Nachos Day', kind: 'fun' },
      { id: '11-06-saxophone-day', label: 'Saxophone Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 7,
    options: [
      { id: '11-07-hug-a-bear-day', label: 'Hug a Bear Day', kind: 'fun' },
      { id: '11-07-bittersweet-chocolate-day', label: 'Bittersweet Chocolate Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 8,
    options: [
      { id: '11-08-stem-day', label: 'STEM Day', kind: 'fun' },
      { id: '11-08-tongue-twister-day', label: 'Tongue Twister Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 9,
    options: [
      { id: '11-09-go-to-an-art-museum-day', label: 'Go to an Art Museum Day', kind: 'fun' },
      { id: '11-09-fried-chicken-sandwich-day', label: 'Fried Chicken Sandwich Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 10,
    options: [
      { id: '11-10-vanilla-cupcake-day', label: 'Vanilla Cupcake Day', kind: 'fun' },
      { id: '11-10-forget-me-not-day', label: 'Forget-Me-Not Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 11,
    options: [
      { id: '11-11-veterans-day', label: 'Veterans Day', kind: 'civic' },
      { id: '11-11-origami-day', label: 'Origami Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 12,
    options: [
      { id: '11-12-chicken-soup-for-the-soul-day', label: 'Chicken Soup for the Soul Day', kind: 'fun' },
      { id: '11-12-pizza-with-the-works-day', label: 'Pizza with the Works Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 13,
    options: [
      { id: '11-13-world-kindness-day', label: 'World Kindness Day', kind: 'global' },
      { id: '11-13-cardigan-day', label: 'Cardigan Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 14,
    options: [
      { id: '11-14-pickle-day', label: 'Pickle Day', kind: 'fun' },
      { id: '11-14-spicy-guacamole-day', label: 'Spicy Guacamole Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 15,
    options: [
      { id: '11-15-clean-out-your-refrigerator-day', label: 'Clean Out Your Refrigerator Day', kind: 'fun' },
      { id: '11-15-america-recycles-day', label: 'America Recycles Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 16,
    options: [
      { id: '11-16-fast-food-day', label: 'Fast Food Day', kind: 'fun' },
      { id: '11-16-button-day', label: 'Button Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 17,
    options: [
      { id: '11-17-take-a-hike-day', label: 'Take a Hike Day', kind: 'fun' },
      { id: '11-17-homemade-bread-day', label: 'Homemade Bread Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 18,
    options: [
      { id: '11-18-mickey-mouse-day', label: 'Mickey Mouse Day', kind: 'fun' },
      { id: '11-18-princess-day', label: 'Princess Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 19,
    options: [
      { id: '11-19-play-monopoly-day', label: 'Play Monopoly Day', kind: 'fun' },
      { id: '11-19-camp-day', label: 'Camp Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 20,
    options: [
      { id: '11-20-universal-children-s-day', label: 'Universal Children\'s Day', kind: 'fun' },
      { id: '11-20-absurdity-day', label: 'Absurdity Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 21,
    options: [
      { id: '11-21-world-television-day', label: 'World Television Day', kind: 'global' },
      { id: '11-21-gingerbread-cookie-day', label: 'Gingerbread Cookie Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 22,
    options: [
      { id: '11-22-go-for-a-ride-day', label: 'Go for a Ride Day', kind: 'fun' },
      { id: '11-22-cranberry-relish-day', label: 'Cranberry Relish Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 23,
    options: [
      { id: '11-23-fibonacci-day', label: 'Fibonacci Day', kind: 'fun' },
      { id: '11-23-eat-a-cranberry-day', label: 'Eat a Cranberry Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 24,
    options: [
      { id: '11-24-celebrate-your-unique-talent-day', label: 'Celebrate Your Unique Talent Day', kind: 'fun' },
      { id: '11-24-sardines-day', label: 'Sardines Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 25,
    options: [
      { id: '11-25-parfait-day', label: 'Parfait Day', kind: 'fun' },
      { id: '11-25-play-day', label: 'Play Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 26,
    options: [
      { id: '11-26-cake-day', label: 'Cake Day', kind: 'fun' },
      { id: '11-26-good-grief-day', label: 'Good Grief Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 27,
    options: [
      { id: '11-27-pins-and-needles-day', label: 'Pins and Needles Day', kind: 'fun' },
      { id: '11-27-turtle-adoption-day', label: 'Turtle Adoption Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 28,
    options: [
      { id: '11-28-french-toast-day', label: 'French Toast Day', kind: 'fun' },
      { id: '11-28-red-planet-day', label: 'Red Planet Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 29,
    options: [
      { id: '11-29-square-dance-day', label: 'Square Dance Day', kind: 'fun' },
      { id: '11-29-lemon-cream-pie-day', label: 'Lemon Cream Pie Day', kind: 'fun' },
    ],
  },
  {
    month: 11,
    day: 30,
    options: [
      { id: '11-30-mason-jar-day', label: 'Mason Jar Day', kind: 'fun' },
      { id: '11-30-computer-security-day', label: 'Computer Security Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 1,
    options: [
      { id: '12-01-eat-a-red-apple-day', label: 'Eat a Red Apple Day', kind: 'fun' },
      { id: '12-01-antarctica-day', label: 'Antarctica Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 2,
    options: [
      { id: '12-02-mutt-day', label: 'Mutt Day', kind: 'fun' },
      { id: '12-02-fritters-day', label: 'Fritters Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 3,
    options: [
      { id: '12-03-make-a-gift-day', label: 'Make a Gift Day', kind: 'fun' },
      { id: '12-03-roof-over-your-head-day', label: 'Roof Over Your Head Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 4,
    options: [
      { id: '12-04-cookie-day', label: 'Cookie Day', kind: 'fun' },
      { id: '12-04-dice-day', label: 'Dice Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 5,
    options: [
      { id: '12-05-ninja-day', label: 'Ninja Day', kind: 'fun' },
      { id: '12-05-bathtub-party-day', label: 'Bathtub Party Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 6,
    options: [
      { id: '12-06-microwave-oven-day', label: 'Microwave Oven Day', kind: 'fun' },
      { id: '12-06-put-on-your-own-shoes-day', label: 'Put on Your Own Shoes Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 7,
    options: [
      { id: '12-07-cotton-candy-day', label: 'Cotton Candy Day', kind: 'fun' },
      { id: '12-07-letter-writing-day', label: 'Letter Writing Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 8,
    options: [
      { id: '12-08-time-traveler-day', label: 'Time Traveler Day', kind: 'fun' },
      { id: '12-08-brownie-day', label: 'Brownie Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 9,
    options: [
      { id: '12-09-pastry-day', label: 'Pastry Day', kind: 'fun' },
      { id: '12-09-christmas-card-day', label: 'Christmas Card Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 10,
    options: [
      { id: '12-10-dewey-decimal-system-day', label: 'Dewey Decimal System Day', kind: 'fun' },
      { id: '12-10-human-rights-day', label: 'Human Rights Day', kind: 'civic' },
    ],
  },
  {
    month: 12,
    day: 11,
    options: [
      { id: '12-11-international-mountain-day', label: 'International Mountain Day', kind: 'global' },
      { id: '12-11-app-day', label: 'App Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 12,
    options: [
      { id: '12-12-gingerbread-house-day', label: 'Gingerbread House Day', kind: 'fun' },
      { id: '12-12-poinsettia-day', label: 'Poinsettia Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 13,
    options: [
      { id: '12-13-violin-day', label: 'Violin Day', kind: 'fun' },
      { id: '12-13-ice-cream-day', label: 'Ice Cream Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 14,
    options: [
      { id: '12-14-monkey-day', label: 'Monkey Day', kind: 'fun' },
      { id: '12-14-roast-chestnuts-day', label: 'Roast Chestnuts Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 15,
    options: [
      { id: '12-15-cupcake-day', label: 'Cupcake Day', kind: 'fun' },
      { id: '12-15-tea-day', label: 'Tea Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 16,
    options: [
      { id: '12-16-chocolate-covered-anything-day', label: 'Chocolate Covered Anything Day', kind: 'fun' },
      { id: '12-16-ugly-sweater-day', label: 'Ugly Sweater Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 17,
    options: [
      { id: '12-17-wright-brothers-day', label: 'Wright Brothers Day', kind: 'civic' },
      { id: '12-17-maple-syrup-day', label: 'Maple Syrup Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 18,
    options: [
      { id: '12-18-bake-cookies-day', label: 'Bake Cookies Day', kind: 'fun' },
      { id: '12-18-twin-day', label: 'Twin Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 19,
    options: [
      { id: '12-19-oatmeal-muffin-day', label: 'Oatmeal Muffin Day', kind: 'fun' },
      { id: '12-19-look-for-an-evergreen-day', label: 'Look for an Evergreen Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 20,
    options: [
      { id: '12-20-go-caroling-day', label: 'Go Caroling Day', kind: 'fun' },
      { id: '12-20-games-day', label: 'Games Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 21,
    options: [
      { id: '12-21-winter-solstice-first-day-of-winter', label: 'Winter Solstice (First Day of Winter)', kind: 'fun' },
      { id: '12-21-crossword-puzzle-day', label: 'Crossword Puzzle Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 22,
    options: [
      { id: '12-22-cookie-exchange-day', label: 'Cookie Exchange Day', kind: 'fun' },
      { id: '12-22-thermometer-day', label: 'Thermometer Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 23,
    options: [
      { id: '12-23-roots-day', label: 'Roots Day', kind: 'fun' },
      { id: '12-23-christmas-movie-day', label: 'Christmas Movie Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 24,
    options: [
      { id: '12-24-christmas-eve', label: 'Christmas Eve', kind: 'fun' },
      { id: '12-24-eggnog-day', label: 'Eggnog Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 25,
    options: [
      { id: '12-25-christmas-day', label: 'Christmas Day', kind: 'fun' },
      { id: '12-25-pumpkin-pie-day', label: 'Pumpkin Pie Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 26,
    options: [
      { id: '12-26-boxing-day', label: 'Boxing Day', kind: 'fun' },
      { id: '12-26-candy-cane-day', label: 'Candy Cane Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 27,
    options: [
      { id: '12-27-make-cut-out-snowflakes-day', label: 'Make Cut-Out Snowflakes Day', kind: 'fun' },
      { id: '12-27-visit-the-zoo-day', label: 'Visit the Zoo Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 28,
    options: [
      { id: '12-28-card-playing-day', label: 'Card Playing Day', kind: 'fun' },
      { id: '12-28-slapjack-chocolate-candy-day', label: 'Slapjack Chocolate Candy Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 29,
    options: [
      { id: '12-29-tick-tock-day', label: 'Tick Tock Day', kind: 'fun' },
      { id: '12-29-pepper-pot-day', label: 'Pepper Pot Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 30,
    options: [
      { id: '12-30-bacon-day', label: 'Bacon Day', kind: 'fun' },
      { id: '12-30-baking-soda-day', label: 'Baking Soda Day', kind: 'fun' },
    ],
  },
  {
    month: 12,
    day: 31,
    options: [
      { id: '12-31-new-year-s-eve', label: 'New Year\'s Eve', kind: 'fun' },
      { id: '12-31-make-up-your-mind-day', label: 'Make Up Your Mind Day', kind: 'fun' },
    ],
  },
];

function funDayIsoForYear(year, month, day) {
  if (month === 2 && day === 29) {
    const leap =
      (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    if (!leap) return null;
  }
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return toIsoDate(d);
}

/**
 * Expand Fun Days into calendar occurrences for a date range.
 * Each option becomes its own row so teachers can choose later.
 *
 * @param {{ rangeStart: string, rangeEnd: string, kinds?: FunDayKind[] }} args
 */
export function expandFunDays({ rangeStart, rangeEnd, kinds } = {}) {
  if (!parseIsoDate(rangeStart) || !parseIsoDate(rangeEnd) || rangeStart > rangeEnd) {
    return [];
  }
  const kindSet = Array.isArray(kinds) && kinds.length ? new Set(kinds) : null;
  const startY = parseIsoDate(rangeStart).getFullYear();
  const endY = parseIsoDate(rangeEnd).getFullYear();
  const rows = [];

  for (let year = startY; year <= endY; year += 1) {
    for (const entry of FUN_DAYS) {
      const iso = funDayIsoForYear(year, entry.month, entry.day);
      if (!iso || iso < rangeStart || iso > rangeEnd) continue;
      for (const opt of entry.options) {
        if (kindSet && !kindSet.has(opt.kind)) continue;
        rows.push({
          id: `funday-${year}-${opt.id}`,
          date: iso,
          title: opt.label,
          kind: opt.kind,
          optionId: opt.id,
          color: FUN_DAY_COLOR,
          className: 'Fun Days',
          source: 'fun-day',
        });
      }
    }
  }

  return rows.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate) return byDate;
    return String(a.title).localeCompare(String(b.title));
  });
}

/** Options listed for a single ISO date (month/day match). */
export function funDayOptionsOn(iso) {
  const d = parseIsoDate(iso);
  if (!d) return [];
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const entry = FUN_DAYS.find((e) => e.month === month && e.day === day);
  return entry ? entry.options.map((o) => ({ ...o })) : [];
}

