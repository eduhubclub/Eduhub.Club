import adaLovelace from '../../assets/students/historical/ada-lovelace.jpg';
import anneSullivan from '../../assets/students/historical/anne-sullivan.jpg';
import augustine from '../../assets/students/historical/augustine.jpg';
import avicenna from '../../assets/students/historical/avicenna.jpg';
import bookerTWashington from '../../assets/students/historical/booker-t-washington.jpg';
import confucius from '../../assets/students/historical/confucius.jpg';
import edithCowan from '../../assets/students/historical/edith-cowan.jpg';
import florenceNightingale from '../../assets/students/historical/florence-nightingale.jpg';
import frederickDouglass from '../../assets/students/historical/frederick-douglass.jpg';
import friedrichFroebel from '../../assets/students/historical/friedrich-froebel.jpg';
import harrietTubman from '../../assets/students/historical/harriet-tubman.jpg';
import helenKeller from '../../assets/students/historical/helen-keller.jpg';
import hypatia from '../../assets/students/historical/hypatia.jpg';
import louisPasteur from '../../assets/students/historical/louis-pasteur.jpg';
import mariaMontessori from '../../assets/students/historical/maria-montessori.jpg';
import marieCurie from '../../assets/students/historical/marie-curie.jpg';
import murasakiShikibu from '../../assets/students/historical/murasaki-shikibu.jpg';
import pestalozzi from '../../assets/students/historical/pestalozzi.jpg';
import sarmiento from '../../assets/students/historical/sarmiento.jpg';
import sequoyah from '../../assets/students/historical/sequoyah.jpg';
import socrates from '../../assets/students/historical/socrates.jpg';
import sorJuana from '../../assets/students/historical/sor-juana.jpg';
import tagore from '../../assets/students/historical/tagore.jpg';
import zenobia from '../../assets/students/historical/zenobia.jpg';

/**
 * Demo Class cast: kindness / education-focused historical figures with
 * public-domain portraits. Order matches DEMO_STUDENTS indices.
 * Gender balance: 12 female / 12 male.
 *
 * `birthMonthDay` is MM/DD — real day when known; commemorative or unique
 * placeholder when history is uncertain (so the demo calendar doesn’t stack).
 */
export const HISTORICAL_PORTRAITS = [
  {
    id: 'booker-t-washington',
    name: 'Booker T. Washington',
    gender: 'Male',
    nickname: 'Booker',
    continent: 'North America',
    role: 'Educator',
    birthMonthDay: '04/05', // 1856
    imageUrl: bookerTWashington,
  },
  {
    id: 'harriet-tubman',
    name: 'Harriet Tubman',
    gender: 'Female',
    nickname: '',
    continent: 'North America',
    role: 'Freedom fighter',
    birthMonthDay: '03/10', // exact unknown; common commemorative day
    imageUrl: harrietTubman,
  },
  {
    id: 'frederick-douglass',
    name: 'Frederick Douglass',
    gender: 'Male',
    nickname: '',
    continent: 'North America',
    role: 'Orator & abolitionist',
    birthMonthDay: '02/14', // exact unknown; day he chose to observe
    imageUrl: frederickDouglass,
  },
  {
    id: 'sequoyah',
    name: 'Sequoyah',
    gender: 'Male',
    nickname: '',
    continent: 'North America',
    role: 'Linguist & teacher',
    birthMonthDay: '01/17', // exact unknown; unique demo day
    imageUrl: sequoyah,
  },
  {
    id: 'helen-keller',
    name: 'Helen Keller',
    gender: 'Female',
    nickname: '',
    continent: 'North America',
    role: 'Advocate & author',
    birthMonthDay: '06/27', // 1880
    imageUrl: helenKeller,
  },
  {
    id: 'anne-sullivan',
    name: 'Anne Sullivan',
    gender: 'Female',
    nickname: '',
    continent: 'North America',
    role: 'Teacher',
    birthMonthDay: '04/14', // 1866
    imageUrl: anneSullivan,
  },
  {
    id: 'florence-nightingale',
    name: 'Florence Nightingale',
    gender: 'Female',
    nickname: '',
    continent: 'Europe',
    role: 'Nurse & reformer',
    birthMonthDay: '05/12', // 1820
    imageUrl: florenceNightingale,
  },
  {
    id: 'ada-lovelace',
    name: 'Ada Lovelace',
    gender: 'Female',
    nickname: 'Ada',
    continent: 'Europe',
    role: 'Mathematician',
    birthMonthDay: '12/10', // 1815
    imageUrl: adaLovelace,
  },
  {
    id: 'marie-curie',
    name: 'Marie Curie',
    gender: 'Female',
    nickname: '',
    continent: 'Europe',
    role: 'Scientist',
    birthMonthDay: '11/07', // 1867
    imageUrl: marieCurie,
  },
  {
    id: 'socrates',
    name: 'Socrates',
    gender: 'Male',
    nickname: '',
    continent: 'Europe',
    role: 'Teacher & philosopher',
    birthMonthDay: '06/15', // exact unknown; unique demo day
    imageUrl: socrates,
  },
  {
    id: 'friedrich-froebel',
    name: 'Friedrich Fröbel',
    gender: 'Male',
    nickname: '',
    continent: 'Europe',
    role: 'Kindergarten founder',
    birthMonthDay: '04/21', // 1782
    imageUrl: friedrichFroebel,
  },
  {
    id: 'pestalozzi',
    name: 'Johann Pestalozzi',
    gender: 'Male',
    nickname: '',
    continent: 'Europe',
    role: 'Educator',
    birthMonthDay: '01/12', // 1746
    imageUrl: pestalozzi,
  },
  {
    id: 'hypatia',
    name: 'Hypatia',
    gender: 'Female',
    nickname: '',
    continent: 'Africa',
    role: 'Teacher & mathematician',
    birthMonthDay: '03/08', // exact unknown; unique demo day
    imageUrl: hypatia,
  },
  {
    id: 'augustine',
    name: 'Augustine of Hippo',
    gender: 'Male',
    nickname: '',
    continent: 'Africa',
    role: 'Teacher & writer',
    birthMonthDay: '11/13', // 354
    imageUrl: augustine,
  },
  {
    id: 'zenobia',
    name: 'Queen Zenobia',
    gender: 'Female',
    nickname: 'Zenobia',
    continent: 'Asia',
    role: 'Patron of learning',
    birthMonthDay: '10/05', // exact unknown; unique demo day
    imageUrl: zenobia,
  },
  {
    id: 'confucius',
    name: 'Kong Qiu',
    gender: 'Male',
    nickname: 'Confucius',
    continent: 'Asia',
    role: 'Teacher & philosopher',
    birthMonthDay: '09/28', // traditional observance
    imageUrl: confucius,
  },
  {
    id: 'avicenna',
    name: 'Ibn Sina',
    gender: 'Male',
    nickname: 'Avicenna',
    continent: 'Asia',
    role: 'Physician & teacher',
    birthMonthDay: '08/16', // ~Aug 980; day approximate
    imageUrl: avicenna,
  },
  {
    id: 'tagore',
    name: 'Rabindranath Tagore',
    gender: 'Male',
    nickname: 'Tagore',
    continent: 'Asia',
    role: 'Poet & educator',
    birthMonthDay: '05/07', // 1861
    imageUrl: tagore,
  },
  {
    id: 'murasaki-shikibu',
    name: 'Murasaki Shikibu',
    gender: 'Female',
    nickname: '',
    continent: 'Asia',
    role: 'Author & court tutor',
    birthMonthDay: '07/11', // exact unknown; unique demo day
    imageUrl: murasakiShikibu,
  },
  {
    id: 'sarmiento',
    name: 'Domingo Sarmiento',
    gender: 'Male',
    nickname: '',
    continent: 'South America',
    role: 'Educator & president',
    birthMonthDay: '02/15', // 1811
    imageUrl: sarmiento,
  },
  {
    id: 'sor-juana',
    name: 'Sor Juana Inés de la Cruz',
    gender: 'Female',
    nickname: 'Sor Juana',
    continent: 'North America',
    role: 'Scholar & writer',
    birthMonthDay: '11/12', // 1648
    imageUrl: sorJuana,
  },
  {
    id: 'maria-montessori',
    name: 'Maria Montessori',
    gender: 'Female',
    nickname: '',
    continent: 'Europe',
    role: 'Educator',
    birthMonthDay: '08/31', // 1870
    imageUrl: mariaMontessori,
  },
  {
    id: 'edith-cowan',
    name: 'Edith Cowan',
    gender: 'Female',
    nickname: '',
    continent: 'Oceania',
    role: 'Educator & reformer',
    birthMonthDay: '08/02', // 1861
    imageUrl: edithCowan,
  },
  {
    id: 'louis-pasteur',
    name: 'Louis Pasteur',
    gender: 'Male',
    nickname: '',
    continent: 'Europe',
    role: 'Scientist & teacher',
    birthMonthDay: '12/27', // 1822
    imageUrl: louisPasteur,
  },
];

export function historicalPortraitAt(index) {
  const n = HISTORICAL_PORTRAITS.length;
  if (n === 0) return null;
  return HISTORICAL_PORTRAITS[((index % n) + n) % n];
}
