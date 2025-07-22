export const RUN_CONSTANTS = {
  // Modifiers (score)
  if9Tiles: false as boolean, // +10
  ifWordBeginsWithScore: undefined as string | undefined, // +20
  ifWordEndsWith: undefined as string | undefined, // +20
  longWordBooster: false as boolean,

  // Modifiers (multipliers)
  finalScoreX: undefined as string | undefined,
  firstTile5xIfVowel: false as boolean, // 5x
  fiveTilesFirstAndLast3x: false as boolean, // 3x
  fourthTileScores3x: false as boolean, // 3x
  ifEveryLetterIsUnique: false as boolean, // 1.5x
  ifFirstAndLastAreVowels: false as boolean, // 2x
  ifFirstLetterEqualsLastLetter: false as boolean, // 2x
  ifFirstLetterIs: undefined as string | undefined, // 2x
  ifFirstLetterIsVowel: false as boolean, // 1.5x
  ifSameLettersTogether: false as boolean, // 1.5x
  ifTwoAdjacentVowels: false as boolean, // 1.5x
  ifVowelsGreaterThanConsonants: false as boolean, // 2x
  ifWordBeginsWithX2: undefined as string | undefined, // 2x
  ifWordHasNo: undefined as string | undefined, // 2x
  secondTileScores3x: false as boolean, // 3x

  // Modifiers (other)
  anythingCanStartWithRE: false as boolean,
  sEqualsZ: false as boolean,

  // Special rounds
  specialRounds: {
    firstTileIsLocked: undefined as string | undefined,
  },

  // Notifiers
  containsSequence: undefined as string | undefined,
  has2OrMore: undefined as string | undefined,
  increaseIfContainsNumber: false as boolean,
  startsWith: undefined as string | undefined,
  threeXSameLetter: false as boolean,

  // Other
  disableAsterisks: false as boolean,
} as const;
