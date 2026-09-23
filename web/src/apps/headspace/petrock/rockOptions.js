export const ROCK_OPTIONS = [
  {
    id: 'boulder',
    label: 'Boulder',
    blurb: 'Chunky and warm — a sturdy listener.',
    src: '/headspace/rocks/boulder.jpg',
  },
  {
    id: 'jagged',
    label: 'Jagged',
    blurb: 'Craggy gray stone with lots of character.',
    src: '/headspace/rocks/jagged.jpg',
  },
  {
    id: 'river',
    label: 'River',
    blurb: 'Smooth and banded — a calm pen pal.',
    src: '/headspace/rocks/river.jpg',
  },
];

export function rockById(rockId) {
  return ROCK_OPTIONS.find((r) => r.id === rockId) || ROCK_OPTIONS[0];
}
