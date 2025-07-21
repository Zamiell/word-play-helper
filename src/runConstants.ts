export const RUN_CONSTANTS = {
  // Modifiers (score)
  if9Tiles: false as boolean,
  ifWordBeginsWithScore: undefined as string | undefined,

  // Modifiers (multipliers)
  finalScoreX: undefined as string | undefined,
  firstTile5xIfVowel: false as boolean,
  fiveTilesFirstAndLast3x: false as boolean,
  fourthTileScores3x: false as boolean,
  ifFirstAndLastAreVowels: false as boolean,
  ifFirstLetterEqualsLastLetter: false as boolean,
  ifFirstLetterIs: undefined as string | undefined,
  ifFirstLetterIsVowel: false as boolean,
  ifSameLettersTogether: false as boolean,
  ifTwoAdjacentVowels: false as boolean,
  ifVowelsGreaterThanConsonants: false as boolean,
  ifWordBeginsWithX2: undefined as string | undefined,
  ifWordEndsWith: undefined as string | undefined, // +20 score
  ifWordHasNo: undefined as string | undefined,
  longWordBooster: false as boolean,
  secondTileScores3x: false as boolean,

  // Modifiers (other)
  anythingCanStartWithRE: false as boolean,
  extraTileSlot1: false as boolean,
  extraTileSlot2: false as boolean,
  extraTileSlot3: false as boolean,
  sEqualsZ: false as boolean,

  // Special rounds
  specialRounds: {
    firstTileIsLocked: undefined as string | undefined,
    top4TilesAreLocked: false as boolean,
  },

  // Notifiers
  containsSequence: undefined as string | undefined,
  has2OrMore: undefined as string | undefined,
  increaseIfContainsNumber: false as boolean,
  startsWith: undefined as string | undefined,
  threeXSameLetter: false as boolean,
} as const;
