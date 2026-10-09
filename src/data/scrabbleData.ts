export type LetterMultiplier = '1x' | 'DL' | 'TL' | 'BLANK';
export type WordMultiplier = 1 | 2 | 3 | 4 | 9;

export interface TileConfig {
  letter: string;
  basePoints: number;
  countInBag: number;
}

export const SCRABBLE_TILES: Record<string, TileConfig> = {
  A: { letter: 'A', basePoints: 1, countInBag: 9 },
  B: { letter: 'B', basePoints: 3, countInBag: 2 },
  C: { letter: 'C', basePoints: 3, countInBag: 2 },
  D: { letter: 'D', basePoints: 2, countInBag: 4 },
  E: { letter: 'E', basePoints: 1, countInBag: 12 },
  F: { letter: 'F', basePoints: 4, countInBag: 2 },
  G: { letter: 'G', basePoints: 2, countInBag: 3 },
  H: { letter: 'H', basePoints: 4, countInBag: 2 },
  I: { letter: 'I', basePoints: 1, countInBag: 9 },
  J: { letter: 'J', basePoints: 8, countInBag: 1 },
  K: { letter: 'K', basePoints: 5, countInBag: 1 },
  L: { letter: 'L', basePoints: 1, countInBag: 4 },
  M: { letter: 'M', basePoints: 3, countInBag: 2 },
  N: { letter: 'N', basePoints: 1, countInBag: 6 },
  O: { letter: 'O', basePoints: 1, countInBag: 8 },
  P: { letter: 'P', basePoints: 3, countInBag: 2 },
  Q: { letter: 'Q', basePoints: 10, countInBag: 1 },
  R: { letter: 'R', basePoints: 1, countInBag: 6 },
  S: { letter: 'S', basePoints: 1, countInBag: 4 },
  T: { letter: 'T', basePoints: 1, countInBag: 6 },
  U: { letter: 'U', basePoints: 1, countInBag: 4 },
  V: { letter: 'V', basePoints: 4, countInBag: 2 },
  W: { letter: 'W', basePoints: 4, countInBag: 2 },
  X: { letter: 'X', basePoints: 8, countInBag: 1 },
  Y: { letter: 'Y', basePoints: 4, countInBag: 2 },
  Z: { letter: 'Z', basePoints: 10, countInBag: 1 },
  '?': { letter: '?', basePoints: 0, countInBag: 2 },
};

export function getLetterBasePoints(char: string): number {
  const upper = char.toUpperCase();
  return SCRABBLE_TILES[upper]?.basePoints ?? 0;
}

export function getEffectiveTilePoints(char: string, multiplier: LetterMultiplier): number {
  if (multiplier === 'BLANK') return 0;
  const base = getLetterBasePoints(char);
  if (multiplier === 'DL') return base * 2;
  if (multiplier === 'TL') return base * 3;
  return base;
}

export function calculateWordScore(
  word: string,
  letterMultipliers: LetterMultiplier[],
  wordMultiplier: WordMultiplier,
  isBingo: boolean,
  crossWordsTotal: number = 0
): {
  baseLetterSum: number;
  multipliedWordScore: number;
  bingoBonus: number;
  crossWordsScore: number;
  totalScore: number;
} {
  const clean = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (!clean) {
    return {
      baseLetterSum: 0,
      multipliedWordScore: 0,
      bingoBonus: isBingo ? 50 : 0,
      crossWordsScore: crossWordsTotal,
      totalScore: (isBingo ? 50 : 0) + crossWordsTotal,
    };
  }

  let letterSum = 0;
  for (let i = 0; i < clean.length; i++) {
    const mult = letterMultipliers[i] || '1x';
    letterSum += getEffectiveTilePoints(clean[i], mult);
  }

  const multipliedWordScore = letterSum * wordMultiplier;
  const bingoBonus = isBingo ? 50 : 0;
  const totalScore = multipliedWordScore + bingoBonus + crossWordsTotal;

  return {
    baseLetterSum: letterSum,
    multipliedWordScore,
    bingoBonus,
    crossWordsScore: crossWordsTotal,
    totalScore,
  };
}

export interface SpecialLexiconEntry {
  word: string;
  category: 'two-letter' | 'q-without-u' | 'power-tiles' | 'vowel-dump';
  partOfSpeech: string;
  definition: string;
}

// Official North American & International Tournament Scrabble Reference Lexicon
export const TOURNAMENT_LEXICON: Record<string, SpecialLexiconEntry> = {
  AA: { word: 'AA', category: 'two-letter', partOfSpeech: 'noun', definition: 'Rough, cindery basaltic lava formed by volcanic flows.' },
  AB: { word: 'AB', category: 'two-letter', partOfSpeech: 'noun', definition: 'An abdominal muscle.' },
  AD: { word: 'AD', category: 'two-letter', partOfSpeech: 'noun', definition: 'A public advertisement.' },
  AE: { word: 'AE', category: 'two-letter', partOfSpeech: 'adjective', definition: 'Scottish dialect word meaning one.' },
  AG: { word: 'AG', category: 'two-letter', partOfSpeech: 'adjective', definition: 'Pertaining to agriculture.' },
  AH: { word: 'AH', category: 'two-letter', partOfSpeech: 'interjection', definition: 'Used to express delight, relief, or realization.' },
  AI: { word: 'AI', category: 'two-letter', partOfSpeech: 'noun', definition: 'A three-toed sloth native to South America.' },
  AL: { word: 'AL', category: 'two-letter', partOfSpeech: 'noun', definition: 'An East Indian mulberry tree yielding dye.' },
  AM: { word: 'AM', category: 'two-letter', partOfSpeech: 'verb', definition: 'First-person singular present of be.' },
  AN: { word: 'AN', category: 'two-letter', partOfSpeech: 'article', definition: 'Indefinite article used before vowel sounds.' },
  AR: { word: 'AR', category: 'two-letter', partOfSpeech: 'noun', definition: 'The phonetic name of the letter R.' },
  AS: { word: 'AS', category: 'two-letter', partOfSpeech: 'adverb', definition: 'To the same degree or amount.' },
  AT: { word: 'AT', category: 'two-letter', partOfSpeech: 'preposition', definition: 'Expressing location or arrival in a particular place.' },
  AW: { word: 'AW', category: 'two-letter', partOfSpeech: 'interjection', definition: 'Expressing mild protest, entreaty, or sympathy.' },
  AX: { word: 'AX', category: 'two-letter', partOfSpeech: 'noun', definition: 'A chopping tool with a heavy bladed head.' },
  AY: { word: 'AY', category: 'two-letter', partOfSpeech: 'adverb', definition: 'An affirmative vote or assent; always.' },
  BA: { word: 'BA', category: 'two-letter', partOfSpeech: 'noun', definition: 'In ancient Egyptian religion, the eternal soul.' },
  BE: { word: 'BE', category: 'two-letter', partOfSpeech: 'verb', definition: 'To exist or live.' },
  BI: { word: 'BI', category: 'two-letter', partOfSpeech: 'noun', definition: 'A bisexual person.' },
  BO: { word: 'BO', category: 'two-letter', partOfSpeech: 'noun', definition: 'Informal term for a friend or pal.' },
  BY: { word: 'BY', category: 'two-letter', partOfSpeech: 'preposition', definition: 'Near or beside; a pass in certain games.' },
  DA: { word: 'DA', category: 'two-letter', partOfSpeech: 'noun', definition: 'Informal British/Irish term for father.' },
  DE: { word: 'DE', category: 'two-letter', partOfSpeech: 'preposition', definition: 'Of or from, as used in names.' },
  DO: { word: 'DO', category: 'two-letter', partOfSpeech: 'noun', definition: 'The first tone of the diatonic musical scale.' },
  ED: { word: 'ED', category: 'two-letter', partOfSpeech: 'noun', definition: 'Education.' },
  EF: { word: 'EF', category: 'two-letter', partOfSpeech: 'noun', definition: 'The letter F.' },
  EH: { word: 'EH', category: 'two-letter', partOfSpeech: 'interjection', definition: 'Used to represent a question or ask for confirmation.' },
  EL: { word: 'EL', category: 'two-letter', partOfSpeech: 'noun', definition: 'An elevated railway or the letter L.' },
  EM: { word: 'EM', category: 'two-letter', partOfSpeech: 'noun', definition: 'A typographical unit of measurement equal to the point size.' },
  EN: { word: 'EN', category: 'two-letter', partOfSpeech: 'noun', definition: 'A typographical unit half the width of an em.' },
  ER: { word: 'ER', category: 'two-letter', partOfSpeech: 'interjection', definition: 'Expressing hesitation.' },
  ES: { word: 'ES', category: 'two-letter', partOfSpeech: 'noun', definition: 'The letter S.' },
  ET: { word: 'ET', category: 'two-letter', partOfSpeech: 'verb', definition: 'Dialect past tense of eat.' },
  EW: { word: 'EW', category: 'two-letter', partOfSpeech: 'interjection', definition: 'Used to express disgust.' },
  EX: { word: 'EX', category: 'two-letter', partOfSpeech: 'noun', definition: 'The letter X, or a former spouse/partner.' },
  FA: { word: 'FA', category: 'two-letter', partOfSpeech: 'noun', definition: 'The fourth note of the diatonic musical scale.' },
  FE: { word: 'FE', category: 'two-letter', partOfSpeech: 'noun', definition: 'A Hebrew letter.' },
  GI: { word: 'GI', category: 'two-letter', partOfSpeech: 'noun', definition: 'A white kimono-style uniform worn in martial arts.' },
  GO: { word: 'GO', category: 'two-letter', partOfSpeech: 'verb', definition: 'To move or travel; a Japanese board game.' },
  HA: { word: 'HA', category: 'two-letter', partOfSpeech: 'noun', definition: 'An exclamation of surprise or laughter.' },
  HE: { word: 'HE', category: 'two-letter', partOfSpeech: 'pronoun', definition: 'Third-person singular masculine pronoun.' },
  HI: { word: 'HI', category: 'two-letter', partOfSpeech: 'interjection', definition: 'Used as a friendly greeting.' },
  HM: { word: 'HM', category: 'two-letter', partOfSpeech: 'interjection', definition: 'Used to express thoughtful consideration.' },
  HO: { word: 'HO', category: 'two-letter', partOfSpeech: 'interjection', definition: 'Calling attention to something.' },
  ID: { word: 'ID', category: 'two-letter', partOfSpeech: 'noun', definition: 'The instinctual part of the mind in psychoanalysis.' },
  IF: { word: 'IF', category: 'two-letter', partOfSpeech: 'conjunction', definition: 'On the condition or supposition that.' },
  IN: { word: 'IN', category: 'two-letter', partOfSpeech: 'preposition', definition: 'Enclosed or surrounded by.' },
  IS: { word: 'IS', category: 'two-letter', partOfSpeech: 'verb', definition: 'Third-person singular present of be.' },
  IT: { word: 'IT', category: 'two-letter', partOfSpeech: 'pronoun', definition: 'Used to refer to a thing previously mentioned.' },
  JO: { word: 'JO', category: 'two-letter', partOfSpeech: 'noun', definition: 'A Scottish word for a sweetheart or darling.' },
  KA: { word: 'KA', category: 'two-letter', partOfSpeech: 'noun', definition: 'In ancient Egypt, the spiritual life force of an individual.' },
  KI: { word: 'KI', category: 'two-letter', partOfSpeech: 'noun', definition: 'Vital life force in Japanese philosophy and martial arts.' },
  LA: { word: 'LA', category: 'two-letter', partOfSpeech: 'noun', definition: 'The sixth tone of the diatonic musical scale.' },
  LI: { word: 'LI', category: 'two-letter', partOfSpeech: 'noun', definition: 'A traditional Chinese unit of distance.' },
  LO: { word: 'LO', category: 'two-letter', partOfSpeech: 'interjection', definition: 'Used to draw attention to an interesting sight.' },
  MA: { word: 'MA', category: 'two-letter', partOfSpeech: 'noun', definition: 'Mother.' },
  ME: { word: 'ME', category: 'two-letter', partOfSpeech: 'pronoun', definition: 'Used by a speaker to refer to himself or herself.' },
  MI: { word: 'MI', category: 'two-letter', partOfSpeech: 'noun', definition: 'The third note of the diatonic scale.' },
  MM: { word: 'MM', category: 'two-letter', partOfSpeech: 'interjection', definition: 'Expressing satisfaction or agreement.' },
  MO: { word: 'MO', category: 'two-letter', partOfSpeech: 'noun', definition: 'A short moment.' },
  MU: { word: 'MU', category: 'two-letter', partOfSpeech: 'noun', definition: 'The twelfth letter of the Greek alphabet.' },
  MY: { word: 'MY', category: 'two-letter', partOfSpeech: 'determiner', definition: 'Belonging to or associated with the speaker.' },
  NA: { word: 'NA', category: 'two-letter', partOfSpeech: 'adverb', definition: 'No; not.' },
  NE: { word: 'NE', category: 'two-letter', partOfSpeech: 'adjective', definition: 'Born with the name of.' },
  NO: { word: 'NO', category: 'two-letter', partOfSpeech: 'noun', definition: 'A negative answer or vote.' },
  NU: { word: 'NU', category: 'two-letter', partOfSpeech: 'noun', definition: 'The thirteenth letter of the Greek alphabet.' },
  OD: { word: 'OD', category: 'two-letter', partOfSpeech: 'noun', definition: 'A hypothetical natural force once thought to pervade nature.' },
  OE: { word: 'OE', category: 'two-letter', partOfSpeech: 'noun', definition: 'A whirlwind off the Faroe Islands.' },
  OF: { word: 'OF', category: 'two-letter', partOfSpeech: 'preposition', definition: 'Expressing the relationship between a part and a whole.' },
  OH: { word: 'OH', category: 'two-letter', partOfSpeech: 'interjection', definition: 'Expressing surprise or realization.' },
  OI: { word: 'OI', category: 'two-letter', partOfSpeech: 'interjection', definition: 'Used to attract someone’s attention.' },
  OK: { word: 'OK', category: 'two-letter', partOfSpeech: 'adjective', definition: 'Satisfactory or permissible; all right.' },
  OM: { word: 'OM', category: 'two-letter', partOfSpeech: 'noun', definition: 'A mystic syllable considered sacred in Hinduism and Buddhism.' },
  ON: { word: 'ON', category: 'two-letter', partOfSpeech: 'preposition', definition: 'Physically in contact with and supported by a surface.' },
  OP: { word: 'OP', category: 'two-letter', partOfSpeech: 'noun', definition: 'A style of abstract art (Op Art) or an operation.' },
  OR: { word: 'OR', category: 'two-letter', partOfSpeech: 'conjunction', definition: 'Used to link alternatives.' },
  OS: { word: 'OS', category: 'two-letter', partOfSpeech: 'noun', definition: 'An anatomical bone or mouth-like opening.' },
  OW: { word: 'OW', category: 'two-letter', partOfSpeech: 'interjection', definition: 'Expressing sudden physical pain.' },
  OX: { word: 'OX', category: 'two-letter', partOfSpeech: 'noun', definition: 'A domesticated bovine draft animal.' },
  OY: { word: 'OY', category: 'two-letter', partOfSpeech: 'interjection', definition: 'Expressing dismay, pain, or exasperation.' },
  PA: { word: 'PA', category: 'two-letter', partOfSpeech: 'noun', definition: 'Father.' },
  PE: { word: 'PE', category: 'two-letter', partOfSpeech: 'noun', definition: 'The seventeenth letter of the Hebrew alphabet.' },
  PI: { word: 'PI', category: 'two-letter', partOfSpeech: 'noun', definition: 'The sixteenth letter of the Greek alphabet; ratio of circumference to diameter.' },
  PO: { word: 'PO', category: 'two-letter', partOfSpeech: 'noun', definition: 'A chamber pot.' },
  QI: { word: 'QI', category: 'q-without-u', partOfSpeech: 'noun', definition: 'Circulating life energy in traditional Chinese philosophy and medicine.' },
  RE: { word: 'RE', category: 'two-letter', partOfSpeech: 'noun', definition: 'The second note of the diatonic musical scale.' },
  SH: { word: 'SH', category: 'two-letter', partOfSpeech: 'interjection', definition: 'Used to call for silence.' },
  SI: { word: 'SI', category: 'two-letter', partOfSpeech: 'noun', definition: 'The seventh tone of the diatonic scale (ti).' },
  SO: { word: 'SO', category: 'two-letter', partOfSpeech: 'adverb', definition: 'To such a great extent.' },
  TA: { word: 'TA', category: 'two-letter', partOfSpeech: 'noun', definition: 'Informal British expression of thanks.' },
  TE: { word: 'TE', category: 'two-letter', partOfSpeech: 'noun', definition: 'Variant of ti, the seventh tone of the musical scale.' },
  TI: { word: 'TI', category: 'two-letter', partOfSpeech: 'noun', definition: 'A Polynesian shrub or the seventh note of the scale.' },
  TO: { word: 'TO', category: 'two-letter', partOfSpeech: 'preposition', definition: 'Expressing motion in the direction of.' },
  UH: { word: 'UH', category: 'two-letter', partOfSpeech: 'interjection', definition: 'Expressing hesitation.' },
  UM: { word: 'UM', category: 'two-letter', partOfSpeech: 'interjection', definition: 'Expressing hesitation or doubt.' },
  UN: { word: 'UN', category: 'two-letter', partOfSpeech: 'pronoun', definition: 'Informal dialect for one.' },
  UP: { word: 'UP', category: 'two-letter', partOfSpeech: 'adverb', definition: 'Toward a higher place or position.' },
  US: { word: 'US', category: 'two-letter', partOfSpeech: 'pronoun', definition: 'Objective case of we.' },
  UT: { word: 'UT', category: 'two-letter', partOfSpeech: 'noun', definition: 'The medieval musical syllable now replaced by do.' },
  WE: { word: 'WE', category: 'two-letter', partOfSpeech: 'pronoun', definition: 'Used by a speaker to refer to himself or herself and others.' },
  WO: { word: 'WO', category: 'two-letter', partOfSpeech: 'noun', definition: 'Variant spelling of woe.' },
  XI: { word: 'XI', category: 'two-letter', partOfSpeech: 'noun', definition: 'The fourteenth letter of the Greek alphabet.' },
  XU: { word: 'XU', category: 'two-letter', partOfSpeech: 'noun', definition: 'A monetary unit of Vietnam equal to one hundredth of a dong.' },
  YA: { word: 'YA', category: 'two-letter', partOfSpeech: 'pronoun', definition: 'Nonstandard spelling of you.' },
  YE: { word: 'YE', category: 'two-letter', partOfSpeech: 'pronoun', definition: 'Plural form of thou; you.' },
  YO: { word: 'YO', category: 'two-letter', partOfSpeech: 'interjection', definition: 'Used to greet someone or call attention.' },
  ZA: { word: 'ZA', category: 'two-letter', partOfSpeech: 'noun', definition: 'Colloquial short form for pizza.' },

  // Q Without U Words
  QIS: { word: 'QIS', category: 'q-without-u', partOfSpeech: 'noun', definition: 'Plural of qi (vital life forces).' },
  QAT: { word: 'QAT', category: 'q-without-u', partOfSpeech: 'noun', definition: 'An Arabian shrub whose leaves are chewed as a stimulant.' },
  QATS: { word: 'QATS', category: 'q-without-u', partOfSpeech: 'noun', definition: 'Plural of qat.' },
  QADI: { word: 'QADI', category: 'q-without-u', partOfSpeech: 'noun', definition: 'An Islamic judge presiding over a Sharia court.' },
  QAID: { word: 'QAID', category: 'q-without-u', partOfSpeech: 'noun', definition: 'A Muslim tribal chief or senior official.' },
  QANAT: { word: 'QANAT', category: 'q-without-u', partOfSpeech: 'noun', definition: 'A gently sloping underground channel for irrigation.' },
  QOPH: { word: 'QOPH', category: 'q-without-u', partOfSpeech: 'noun', definition: 'The nineteenth letter of the Hebrew alphabet.' },
  QABALA: { word: 'QABALA', category: 'q-without-u', partOfSpeech: 'noun', definition: 'Ancient Jewish mystical tradition (Kabbalah).' },
  QINDAR: { word: 'QINDAR', category: 'q-without-u', partOfSpeech: 'noun', definition: 'A fractional monetary unit of Albania.' },
  QINTAR: { word: 'QINTAR', category: 'q-without-u', partOfSpeech: 'noun', definition: 'Alternate spelling of qindar.' },
  QWERTY: { word: 'QWERTY', category: 'q-without-u', partOfSpeech: 'noun', definition: 'The standard English-language typewriter or computer keyboard layout.' },
  TRANQ: { word: 'TRANQ', category: 'q-without-u', partOfSpeech: 'noun', definition: 'A tranquilizer or sedative drug.' },
  CINQ: { word: 'CINQ', category: 'q-without-u', partOfSpeech: 'noun', definition: 'The number five on dice or playing cards.' },
  FAQIR: { word: 'FAQIR', category: 'q-without-u', partOfSpeech: 'noun', definition: 'A Muslim or Hindu religious ascetic or monk.' },
  TALAQ: { word: 'TALAQ', category: 'q-without-u', partOfSpeech: 'noun', definition: 'An Islamic divorce effected by the husband’s pronouncement.' },
  UMIAQ: { word: 'UMIAQ', category: 'q-without-u', partOfSpeech: 'noun', definition: 'An open Inuit boat made of animal skins stretched over a wooden frame.' },
  SUQ: { word: 'SUQ', category: 'q-without-u', partOfSpeech: 'noun', definition: 'An open-air marketplace or bazaar in Middle Eastern cities.' },
  SHEQEL: { word: 'SHEQEL', category: 'q-without-u', partOfSpeech: 'noun', definition: 'The basic monetary unit of modern Israel.' },

  // Power Tiles (Z, X, J, K)
  ZAX: { word: 'ZAX', category: 'power-tiles', partOfSpeech: 'noun', definition: 'A heavy hand tool used for cutting and punching roofing slates.' },
  ZEK: { word: 'ZEK', category: 'power-tiles', partOfSpeech: 'noun', definition: 'An inmate in a Soviet forced labor camp.' },
  ZOA: { word: 'ZOA', category: 'power-tiles', partOfSpeech: 'noun', definition: 'Plural of zoon, a colonial organism.' },
  ZOIC: { word: 'ZOIC', category: 'power-tiles', partOfSpeech: 'adjective', definition: 'Relating to animals or containing fossilized life.' },
  JUXT: { word: 'JUXT', category: 'power-tiles', partOfSpeech: 'verb', definition: 'Archaic form of joust.' },
  JINN: { word: 'JINN', category: 'power-tiles', partOfSpeech: 'noun', definition: 'Supernatural spirit in Arabian and Islamic mythology.' },
  JEUX: { word: 'JEUX', category: 'power-tiles', partOfSpeech: 'noun', definition: 'Plural of jeu (games or playful works).' },
  XIS: { word: 'XIS', category: 'power-tiles', partOfSpeech: 'noun', definition: 'Plural of xi, the fourteenth letter of the Greek alphabet.' },
  XYST: { word: 'XYST', category: 'power-tiles', partOfSpeech: 'noun', definition: 'In classical architecture, a covered portico used by athletes for exercise.' },
  KEX: { word: 'KEX', category: 'power-tiles', partOfSpeech: 'noun', definition: 'The dry, hollow stalk of cow parsnip or hemlock.' },
  QUARTZ: { word: 'QUARTZ', category: 'power-tiles', partOfSpeech: 'noun', definition: 'A hard white or colorless mineral consisting of silicon dioxide.' },
  OXYGEN: { word: 'OXYGEN', category: 'power-tiles', partOfSpeech: 'noun', definition: 'A colorless, odorless reactive gas essential for respiration.' },
  ZEPHYR: { word: 'ZEPHYR', category: 'power-tiles', partOfSpeech: 'noun', definition: 'A soft, gentle breeze.' },

  // Vowel Dumps
  ADIEU: { word: 'ADIEU', category: 'vowel-dump', partOfSpeech: 'noun', definition: 'A farewell or goodbye.' },
  AUDIO: { word: 'AUDIO', category: 'vowel-dump', partOfSpeech: 'noun', definition: 'Sound, especially when recorded, transmitted, or reproduced.' },
  AUREI: { word: 'AUREI', category: 'vowel-dump', partOfSpeech: 'noun', definition: 'Plural of aureus, an ancient Roman gold coin.' },
  EUOI: { word: 'EUOI', category: 'vowel-dump', partOfSpeech: 'interjection', definition: 'A cry of impassioned rapture in ancient Bacchic rites.' },
  EAU: { word: 'EAU', category: 'vowel-dump', partOfSpeech: 'noun', definition: 'Water, used in names of perfumes and toilet waters.' },
  EAUX: { word: 'EAUX', category: 'vowel-dump', partOfSpeech: 'noun', definition: 'Plural of eau (perfumed waters).' },
  AULOI: { word: 'AULOI', category: 'vowel-dump', partOfSpeech: 'noun', definition: 'Plural of aulos, an ancient Greek double-reed wind instrument.' },
  OURIE: { word: 'OURIE', category: 'vowel-dump', partOfSpeech: 'adjective', definition: 'Scottish word meaning chilly, bleak, or shivering.' },
  MIAOU: { word: 'MIAOU', category: 'vowel-dump', partOfSpeech: 'noun', definition: 'Variant spelling of meow, the cry of a cat.' },
  LOUIE: { word: 'LOUIE', category: 'vowel-dump', partOfSpeech: 'noun', definition: 'Informal military slang for a lieutenant.' },
};

// Built-in core English & Scrabble lexicon for instant offline verification
const CORE_SCRABBLE_WORDS: Record<string, { pos: string; def: string }> = {
  SCRABBLE: { pos: 'verb', def: 'To scratch or grope around with the fingers; to play the word game Scrabble.' },
  VORTEX: { pos: 'noun', def: 'A whirling mass of fluid or air, especially a whirlpool or whirlwind.' },
  BRAZIER: { pos: 'noun', def: 'A portable heater holding lighted coals; a worker in brass.' },
  LEXICON: { pos: 'noun', def: 'The vocabulary of a person, language, or branch of knowledge.' },
  CHALLENGE: { pos: 'noun', def: 'A call to prove or justify the validity of a played word.' },
  BINGO: { pos: 'noun', def: 'A bonus of 50 points awarded for playing all seven tiles from the rack in a single turn.' },
  BONUS: { pos: 'noun', def: 'An extra amount of points added to a base score.' },
  PLAYER: { pos: 'noun', def: 'A person taking part in a sport or board game.' },
  SCORE: { pos: 'noun', def: 'The number of points achieved in a game or match.' },
  SCORES: { pos: 'noun', def: 'Plural of score; points recorded in a game.' },
  BOARD: { pos: 'noun', def: 'A flat piece of wood or rigid material used for playing a game.' },
  TILES: { pos: 'noun', def: 'Small flat lettered pieces used in word games.' },
  TILE: { pos: 'noun', def: 'A flat square piece inscribed with a letter and point value.' },
  BLANK: { pos: 'noun', def: 'An unmarked game tile worth zero points that may represent any letter.' },
  RACK: { pos: 'noun', def: 'A wooden or plastic stand used to hold a player’s letter tiles.' },
  WORD: { pos: 'noun', def: 'A single distinct meaningful element of speech or writing.' },
  WORDS: { pos: 'noun', def: 'Plural of word; lexical units placed on the board.' },
  LETTER: { pos: 'noun', def: 'A character representing one or more of the sounds used in speech.' },
  POINTS: { pos: 'noun', def: 'Units of scoring awarded in a game.' },
  POINT: { pos: 'noun', def: 'A single unit of scoring in a game.' },
  DOUBLE: { pos: 'adjective', def: 'Consisting of two equal parts; twice as much in value.' },
  TRIPLE: { pos: 'adjective', def: 'Three times as large or as many in value.' },
  WINNER: { pos: 'noun', def: 'A person or contestant that wins a match.' },
  LEADER: { pos: 'noun', def: 'The player currently holding the highest score.' },
  ROUND: { pos: 'noun', def: 'A sequence of turns in which each player participates once.' },
  TURN: { pos: 'noun', def: 'An opportunity or obligation to play in sequence.' },
  TURNS: { pos: 'noun', def: 'Plural of turn; successive plays in a match.' },
  VALID: { pos: 'adjective', def: 'Acceptable and officially permitted according to tournament rules.' },
  JUDGE: { pos: 'noun', def: 'An official authority that decides the validity of a play.' },
  QUIZ: { pos: 'noun', def: 'A test of knowledge, especially a brief informal test.' },
  JAZZ: { pos: 'noun', def: 'A type of music of African American origin characterized by improvisation and syncopation.' },
  FIZZ: { pos: 'verb', def: 'To make a buzzing or hissing sound, as of effervescent liquid.' },
  BUZZ: { pos: 'noun', def: 'A low, continuous humming or murmuring sound.' },
  FUZZ: { pos: 'noun', def: 'A frizzy mass of hair or fiber.' },
  JINX: { pos: 'noun', def: 'A person or thing that brings bad luck.' },
  ONYX: { pos: 'noun', def: 'A semiprecious variety of agate with different colors in layers.' },
  LYNX: { pos: 'noun', def: 'A wildcat with yellowish-brown fur, a short tail, and tufted ears.' },
  APEX: { pos: 'noun', def: 'The top or highest part of something, especially one forming a point.' },
  IBEX: { pos: 'noun', def: 'A wild mountain goat with long, thick ridged horns.' },
  FLUX: { pos: 'noun', def: 'Continuous change, passage, or movement.' },
  CRUX: { pos: 'noun', def: 'The decisive or most important point at issue.' },
  HOAX: { pos: 'noun', def: 'A humorous or malicious deception.' },
  COAX: { pos: 'verb', def: 'To gently and persistently persuade someone to do something.' },
  ZEBRA: { pos: 'noun', def: 'An African wild horse with black-and-white stripes.' },
  ZENITH: { pos: 'noun', def: 'The time at which something is most powerful or successful; highest point.' },
  ZODIAC: { pos: 'noun', def: 'A belt of the heavens within about 8 degrees either side of the ecliptic.' },
  ZYGOTE: { pos: 'noun', def: 'A diploid cell resulting from the fusion of two haploid gametes.' },
  QUEST: { pos: 'noun', def: 'A long or arduous search for something.' },
  QUERY: { pos: 'noun', def: 'A question, especially one addressed to an official or organization.' },
  QUICK: { pos: 'adjective', def: 'Moving fast or doing something in a short time.' },
  QUIET: { pos: 'adjective', def: 'Making little or no noise.' },
  QUILT: { pos: 'noun', def: 'A warm bed covering made of padding enclosed between layers of fabric.' },
  QUIRK: { pos: 'noun', def: 'A peculiar behavioral habit or unexpected twist.' },
  QUOTE: { pos: 'verb', def: 'To repeat or copy out words from a text or speech.' },
  SQUID: { pos: 'noun', def: 'An elongated, fast-swimming cephalopod mollusk with ten arms.' },
  SQUAD: { pos: 'noun', def: 'A small group of people having a particular task.' },
  EQUAL: { pos: 'adjective', def: 'Being the same in quantity, size, degree, or value.' },
  PIQUE: { pos: 'noun', def: 'A feeling of irritation or resentment resulting from a slight.' },
  TORQUE: { pos: 'noun', def: 'A twisting force that tends to cause rotation.' },
  PLAQUE: { pos: 'noun', def: 'An ornamental tablet, typically of metal, porcelain, or wood.' },
  UNIQUE: { pos: 'adjective', def: 'Being the only one of its kind; unlike anything else.' },
  HELLO: { pos: 'interjection', def: 'Used as a greeting or to begin a conversation.' },
  WORLD: { pos: 'noun', def: 'The earth, together with all of its countries and peoples.' },
  APPLE: { pos: 'noun', def: 'The round fruit of a tree of the rose family.' },
  HOUSE: { pos: 'noun', def: 'A building for human habitation.' },
  WATER: { pos: 'noun', def: 'A colorless, transparent, odorless liquid that forms the seas, lakes, and rivers.' },
  EARTH: { pos: 'noun', def: 'The planet on which we live; the substance of the land surface.' },
  LIGHT: { pos: 'noun', def: 'The natural agent that stimulates sight and makes things visible.' },
  NIGHT: { pos: 'noun', def: 'The period of darkness in each twenty-four hours.' },
  MUSIC: { pos: 'noun', def: 'Vocal or instrumental sounds combined to produce beauty of form and harmony.' },
  PAPER: { pos: 'noun', def: 'Material manufactured in thin sheets from the pulp of wood or other fibrous substances.' },
  TABLE: { pos: 'noun', def: 'A piece of furniture with a flat top and one or more legs.' },
  CHAIR: { pos: 'noun', def: 'A separate seat for one person, typically with a back and four legs.' },
  PLANT: { pos: 'noun', def: 'A living organism of the kind exemplified by trees, shrubs, herbs, and grasses.' },
  BREAD: { pos: 'noun', def: 'Food made of flour, water, and yeast mixed together and baked.' },
  STONE: { pos: 'noun', def: 'Hard solid nonmetallic mineral matter of which rock is made.' },
  RIVER: { pos: 'noun', def: 'A large natural stream of water flowing in a channel to the sea or a lake.' },
  OCEAN: { pos: 'noun', def: 'A very large expanse of sea.' },
  CLOUD: { pos: 'noun', def: 'A visible mass of condensed watery vapor floating in the atmosphere.' },
  STORM: { pos: 'noun', def: 'A violent disturbance of the atmosphere with strong winds and usually rain or snow.' },
  FLAME: { pos: 'noun', def: 'A hot glowing body of ignited gas that is generated by something on fire.' },
  DREAM: { pos: 'noun', def: 'A series of thoughts, images, and sensations occurring in a person’s mind during sleep.' },
  HEART: { pos: 'noun', def: 'A hollow muscular organ that pumps the blood through the circulatory system.' },
  SMILE: { pos: 'noun', def: 'A pleased, kind, or amused facial expression.' },
  TRAIN: { pos: 'noun', def: 'A series of railroad cars moved as a unit by a locomotive.' },
  CLOCK: { pos: 'noun', def: 'A mechanical or electrical device for measuring time.' },
  MAGIC: { pos: 'noun', def: 'The power of apparently influencing the course of events by using mysterious forces.' },
  POWER: { pos: 'noun', def: 'The ability or capacity to do something or act in a particular way.' },
  BRAVE: { pos: 'adjective', def: 'Ready to face and endure danger or pain; showing courage.' },
  SMART: { pos: 'adjective', def: 'Having or showing a quick-witted intelligence.' },
  HAPPY: { pos: 'adjective', def: 'Feeling or showing pleasure or contentment.' },
  GREAT: { pos: 'adjective', def: 'Of an extent, amount, or intensity considerably above the normal or average.' },
  FIRST: { pos: 'adjective', def: 'Coming before all others in time or order.' },
  CAT: { pos: 'noun', def: 'A small domesticated carnivorous mammal with soft fur.' },
  DOG: { pos: 'noun', def: 'A domesticated carnivorous mammal that typically has a long snout and barking voice.' },
  SUN: { pos: 'noun', def: 'The star around which the earth orbits.' },
  STAR: { pos: 'noun', def: 'A fixed luminous point in the night sky.' },
  TREE: { pos: 'noun', def: 'A woody perennial plant, typically having a single stem or trunk.' },
  BOOK: { pos: 'noun', def: 'A written or printed work consisting of pages glued or sewn together.' },
  TIME: { pos: 'noun', def: 'The indefinite continued progress of existence and events.' },
  GAME: { pos: 'noun', def: 'A form of play or sport, especially a competitive one played according to rules.' },
  PLAY: { pos: 'verb', def: 'To take part in a game or make a move on the board.' },
  TEST: { pos: 'noun', def: 'A procedure intended to establish the quality, performance, or reliability of something.' },
  GOLD: { pos: 'noun', def: 'A yellow precious metal, the chemical element of atomic number 79.' },
  RUBY: { pos: 'noun', def: 'A precious stone consisting of corundum in color varieties varying from deep crimson to pale rose.' },
  JADE: { pos: 'noun', def: 'A hard, typically green stone used for ornaments and implements.' },
  OPAL: { pos: 'noun', def: 'A gemstone consisting of a form of hydrated silica, typically semitransparent with iridescent colors.' },
  ZINC: { pos: 'noun', def: 'The chemical element of atomic number 30, a silvery-white metal.' },
  WAX: { pos: 'noun', def: 'A sticky yellowish moldable substance secreted by honeybees.' },
  TAX: { pos: 'noun', def: 'A compulsory contribution to state revenue.' },
  BOX: { pos: 'noun', def: 'A container with a flat base and sides, typically square or rectangular.' },
  FOX: { pos: 'noun', def: 'A carnivorous mammal of the dog family with a pointed muzzle and bushy tail.' },
  FIX: { pos: 'verb', def: 'To fasten something securely in a particular place or position; to repair.' },
  MIX: { pos: 'verb', def: 'To combine or put together to form one substance or mass.' },
  SIX: { pos: 'number', def: 'Equivalent to the product of two and three; one more than five.' },
  HEX: { pos: 'noun', def: 'A magic spell; a curse.' },
  VEX: { pos: 'verb', def: 'To make someone feel annoyed, frustrated, or worried.' },
  ZOO: { pos: 'noun', def: 'An establishment which maintains a collection of wild animals.' },
  ZAP: { pos: 'verb', def: 'To destroy or obliterate; to move suddenly and rapidly.' },
  ZEN: { pos: 'noun', def: 'A Japanese school of Mahayana Buddhism emphasizing the value of meditation and intuition.' },
  ZIP: { pos: 'verb', def: 'To fasten with a zipper; to move at high speed.' },
  ZONE: { pos: 'noun', def: 'An area or stretch of land having a particular characteristic, purpose, or use.' },
  ZERO: { pos: 'number', def: 'No quantity or number; naught.' },
  ZEST: { pos: 'noun', def: 'Great enthusiasm and energy; the outer colored peel of citrus fruit.' },
  ZOOM: { pos: 'verb', def: 'To move or travel very quickly.' },
  ZEAL: { pos: 'noun', def: 'Great energy or enthusiasm in pursuit of a cause or an objective.' },
};

export interface DictionaryVerificationResult {
  word: string;
  isValid: boolean;
  basePoints: number;
  partOfSpeech: string;
  phonetic?: string;
  definitions: string[];
  source: 'Tournament Lexicon (TWL/CSW)' | 'Oxford/Free Dictionary' | 'Lexical Database';
  specialNote?: string;
}

const verificationCache = new Map<string, DictionaryVerificationResult>();

export async function verifyScrabbleWord(rawWord: string): Promise<DictionaryVerificationResult> {
  const word = rawWord.trim().toUpperCase().replace(/[^A-Z]/g, '');

  if (!word) {
    return {
      word: '',
      isValid: false,
      basePoints: 0,
      partOfSpeech: '',
      definitions: [],
      source: 'Tournament Lexicon (TWL/CSW)',
    };
  }

  if (verificationCache.has(word)) {
    return verificationCache.get(word)!;
  }

  const basePoints = word
    .split('')
    .reduce((acc, letter) => acc + getLetterBasePoints(letter), 0);

  // Single-letter words ("A", "I") are never valid on a Scrabble board (minimum 2 letters)
  if (word.length < 2) {
    const res: DictionaryVerificationResult = {
      word,
      isValid: false,
      basePoints,
      partOfSpeech: 'invalid length',
      definitions: ['Scrabble rules require played words to contain at least 2 letters.'],
      source: 'Tournament Lexicon (TWL/CSW)',
    };
    verificationCache.set(word, res);
    return res;
  }

  // 1. Check built-in Tournament Lexicon first (instant & authoritative for 2-letter and Q-without-U words)
  if (TOURNAMENT_LEXICON[word]) {
    const entry = TOURNAMENT_LEXICON[word];
    const res: DictionaryVerificationResult = {
      word,
      isValid: true,
      basePoints,
      partOfSpeech: entry.partOfSpeech,
      definitions: [entry.definition],
      source: 'Tournament Lexicon (TWL/CSW)',
      specialNote:
        entry.category === 'two-letter'
          ? 'Official 2-Letter Tournament Word'
          : entry.category === 'q-without-u'
          ? 'Official Q-without-U Tournament Word'
          : entry.category === 'vowel-dump'
          ? 'High-Efficiency Vowel Dump Word'
          : 'High-Value Power Tile Word',
    };
    verificationCache.set(word, res);
    return res;
  }

  // If it's a 2-letter word NOT in TOURNAMENT_LEXICON, it is strictly invalid in Scrabble!
  // (Because TOURNAMENT_LEXICON contains all 107 valid 2-letter words)
  if (word.length === 2) {
    const res: DictionaryVerificationResult = {
      word,
      isValid: false,
      basePoints,
      partOfSpeech: 'unrecognized 2-letter sequence',
      definitions: [
        `"${word}" is not among the 107 official 2-letter words permitted in tournament Scrabble.`,
      ],
      source: 'Tournament Lexicon (TWL/CSW)',
    };
    verificationCache.set(word, res);
    return res;
  }

  // 1b. Check built-in core Scrabble words dictionary
  if (CORE_SCRABBLE_WORDS[word]) {
    const core = CORE_SCRABBLE_WORDS[word];
    const res: DictionaryVerificationResult = {
      word,
      isValid: true,
      basePoints,
      partOfSpeech: core.pos,
      definitions: [core.def],
      source: 'Tournament Lexicon (TWL/CSW)',
    };
    verificationCache.set(word, res);
    return res;
  }

  // 2. Query Free Dictionary API
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`
    );
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const firstEntry = data[0];
        const phonetic = firstEntry.phonetic || firstEntry.phonetics?.find((p: { text?: string }) => p.text)?.text;
        const firstMeaning = firstEntry.meanings?.[0];
        const partOfSpeech = firstMeaning?.partOfSpeech || 'word';
        const definitions: string[] = [];

        for (const meaning of firstEntry.meanings || []) {
          for (const def of meaning.definitions || []) {
            if (def.definition && definitions.length < 3) {
              definitions.push(def.definition);
            }
          }
        }

        const res: DictionaryVerificationResult = {
          word,
          isValid: true,
          basePoints,
          partOfSpeech,
          phonetic,
          definitions:
            definitions.length > 0
              ? definitions
              : ['Valid English dictionary word eligible for Scrabble play.'],
          source: 'Oxford/Free Dictionary',
        };
        verificationCache.set(word, res);
        return res;
      }
    }
  } catch {
    // Fall through to Datamuse lexical lookup
  }

  // 3. Fallback to Datamuse Lexical API (handles inflected plurals, verb conjugations, and obscure words)
  try {
    const dmResponse = await fetch(
      `https://api.datamuse.com/words?sp=${word.toLowerCase()}&md=dp&max=1`
    );
    if (dmResponse.ok) {
      const dmData = await dmResponse.json();
      if (
        Array.isArray(dmData) &&
        dmData.length > 0 &&
        dmData[0].word?.toUpperCase() === word &&
        Array.isArray(dmData[0].defs) &&
        dmData[0].defs.length > 0
      ) {
        const rawDefs: string[] = dmData[0].defs.slice(0, 3);
        const parsedDefs = rawDefs.map((d) => {
          const parts = d.split('\t');
          return parts.length > 1 ? parts[1] : d;
        });
        const firstTab = rawDefs[0].split('\t')[0];
        const posMap: Record<string, string> = {
          n: 'noun',
          v: 'verb',
          adj: 'adjective',
          adv: 'adverb',
        };

        const res: DictionaryVerificationResult = {
          word,
          isValid: true,
          basePoints,
          partOfSpeech: posMap[firstTab] || 'word',
          definitions: parsedDefs,
          source: 'Lexical Database',
        };
        verificationCache.set(word, res);
        return res;
      }
    }
  } catch {
    // Ignore network error
  }

  const invalidRes: DictionaryVerificationResult = {
    word,
    isValid: false,
    basePoints,
    partOfSpeech: 'not found',
    definitions: [
      `"${word}" was not found in the Scrabble dictionary. Abbreviations, proper nouns, hyphenated words, and apostrophes are not permitted.`,
    ],
    source: 'Tournament Lexicon (TWL/CSW)',
  };
  verificationCache.set(word, invalidRes);
  return invalidRes;
}

// Gentle Web Audio API Synthesizer for Tabletop Tactile Feedback
export function playTabletopSound(type: 'tile' | 'valid' | 'invalid' | 'score') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'tile') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.045);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'valid') {
      [523.25, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.08, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.17);
      });
    } else if (type === 'invalid') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.16);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'score') {
      [440, 554.37, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.09, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.22);
      });
    }
  } catch {
    // AudioContext blocked or unsupported
  }
}
