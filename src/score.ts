import { assertDefined, ReadonlyMap, sumArray } from "complete-common";
import { RUN_CONSTANTS } from "./runConstants.js";

const LETTER_POINTS = new ReadonlyMap<string, number>([
  ["a", 1],
  ["b", 3],
  ["c", 3],
  ["d", 2],
  ["e", 1],
  ["f", 4],
  ["g", 2],
  ["h", 4],
  ["i", 1],
  ["j", 8],
  ["k", 5],
  ["l", 1],
  ["m", 3],
  ["n", 1],
  ["o", 1],
  ["p", 3],
  ["q", 10],
  ["r", 1],
  ["s", 1],
  ["t", 1],
  ["u", 1],
  ["v", 4],
  ["w", 4],
  ["x", 8],
  ["y", 4],
  ["z", 10],
]);

export function getWordScore(word: string): {
  wordScore: number;
  letterScores: readonly number[];
  totalLetterScores: number;
  wordScorePreMultiplier: number;
  wordMultiplier: number;
} {
  const repeatingLetters = hasRepeatingLetters(word);

  // eslint-disable-next-line @typescript-eslint/no-misused-spread
  const letters = [...word];
  const lowercaseLetters = letters.map((letter) => letter.toLowerCase());
  const firstLetter = word.at(0);
  assertDefined(firstLetter, `Failed to get the first letter of word: ${word}`);
  const lastLetter = word.at(-1);
  assertDefined(lastLetter, `Failed to get the last letter of word: ${word}`);

  const letterScores = lowercaseLetters.map((letter, i) =>
    getLetterScore(word, letter, i),
  );

  const totalLetterScores = sumArray(letterScores);

  let wordScorePreMultiplier = totalLetterScores;

  // Score (long word)
  const longWordMultiplier = RUN_CONSTANTS.longWordBooster ? 2 : 1;
  if (word.length >= 5) {
    wordScorePreMultiplier += 5 * longWordMultiplier;
  }
  if (word.length >= 6) {
    wordScorePreMultiplier += 5 * longWordMultiplier;
  }
  if (word.length >= 7) {
    wordScorePreMultiplier += 5 * longWordMultiplier;
  }
  if (word.length >= 8) {
    wordScorePreMultiplier += 10 * longWordMultiplier;
  }
  if (word.length >= 9) {
    wordScorePreMultiplier += 10 * longWordMultiplier;
  }
  if (word.length >= 10) {
    wordScorePreMultiplier += 15 * longWordMultiplier;
  }
  if (word.length >= 11) {
    wordScorePreMultiplier += 15 * longWordMultiplier;
  }
  if (word.length >= 12) {
    wordScorePreMultiplier += 20 * longWordMultiplier;
  }
  if (word.length >= 13) {
    wordScorePreMultiplier += 20 * longWordMultiplier;
  }
  if (word.length >= 14) {
    wordScorePreMultiplier += 20 * longWordMultiplier;
  }
  if (word.length >= 15) {
    wordScorePreMultiplier += 25 * longWordMultiplier;
  }
  if (word.length >= 16) {
    wordScorePreMultiplier += 25 * longWordMultiplier;
  }
  if (word.length >= 17) {
    wordScorePreMultiplier += 25 * longWordMultiplier;
  }
  if (word.length >= 18) {
    wordScorePreMultiplier += 30 * longWordMultiplier;
  }
  if (word.length >= 19) {
    wordScorePreMultiplier += 40 * longWordMultiplier;
  }
  if (word.length >= 20) {
    wordScorePreMultiplier += 50 * longWordMultiplier;
  }

  // Score (modifiers)
  if (RUN_CONSTANTS.if9Tiles && word.length === 9) {
    wordScorePreMultiplier += 10;
  }
  if (RUN_CONSTANTS.ifWordBeginsWithH && firstLetter === "h") {
    wordScorePreMultiplier += 20;
  }
  if (RUN_CONSTANTS.ifWordEndsWithR && lastLetter === "r") {
    wordScorePreMultiplier += 20;
  }

  // Multiplier
  let wordMultiplier = 1;
  if (
    RUN_CONSTANTS.ifFirstAndLastAreVowels
    && isVowel(firstLetter)
    && isVowel(lastLetter)
  ) {
    wordMultiplier *= 2;
  }
  if (
    RUN_CONSTANTS.ifFirstLetterEqualsLastLetter
    && firstLetter === lastLetter
  ) {
    wordMultiplier *= 2;
  }
  if (RUN_CONSTANTS.ifFirstLetterIs?.toLowerCase() === firstLetter) {
    wordMultiplier *= 2;
  }
  if (RUN_CONSTANTS.ifFirstLetterIsVowel && isVowel(firstLetter)) {
    wordMultiplier *= 1.5;
  }
  if (RUN_CONSTANTS.ifSameLettersTogether && repeatingLetters) {
    wordMultiplier *= 1.5;
  }

  if (RUN_CONSTANTS.finalScoreX !== undefined) {
    if (RUN_CONSTANTS.finalScoreX.length !== 1) {
      throw new Error(
        `Bad value for finalScoreX: ${RUN_CONSTANTS.finalScoreX}`,
      );
    }

    const numMatchingLetters = lowercaseLetters.filter(
      (letter) => letter === RUN_CONSTANTS.finalScoreX,
    ).length;
    if (numMatchingLetters > 0) {
      wordMultiplier *= numMatchingLetters;
    }
  }
  if (
    RUN_CONSTANTS.ifTwoAdjacentVowels
    && hasAdjacentVowels(lowercaseLetters)
  ) {
    wordMultiplier *= 1.5;
  }

  const wordScore = wordScorePreMultiplier * wordMultiplier;

  return {
    wordScore,
    letterScores,
    totalLetterScores,
    wordScorePreMultiplier,
    wordMultiplier,
  };
}

function getLetterScore(word: string, letter: string, i: number): number {
  const points = LETTER_POINTS.get(letter);

  if (points === undefined || points === 0) {
    throw new Error(`Failed to get the points for letter: ${letter}`);
  }

  let multiplier = 1;
  if (RUN_CONSTANTS.firstTile5xIfVowel && i === 0 && isVowel(letter)) {
    multiplier *= 5;
  }
  if (
    RUN_CONSTANTS.fiveTilesFirstAndLast3x
    && word.length === 5
    && (i === 0 || i === 4)
  ) {
    multiplier *= 3;
  }
  if (RUN_CONSTANTS.fourthTileScores3x && i === 3) {
    multiplier *= 3;
  }
  if (RUN_CONSTANTS.secondTileScores3x && i === 1) {
    multiplier *= 3;
  }

  return points * multiplier;
}

export function hasRepeatingLetters(word: string): boolean {
  for (let i = 0; i < word.length - 1; i++) {
    const currentLetter = word[i];
    const nextLetter = word[i + 1];

    if (currentLetter === nextLetter) {
      return true;
    }
  }

  return false;
}

function hasAdjacentVowels(letters: readonly string[]) {
  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];
    const nextLetter = letters[i + 1];
    if (
      letter !== undefined
      && nextLetter !== undefined
      && isVowel(letter)
      && isVowel(nextLetter)
    ) {
      return true;
    }
  }

  return false;
}

function isVowel(letter: string): boolean {
  return (
    letter === "a"
    || letter === "e"
    || letter === "i"
    || letter === "o"
    || letter === "u"
  );
}
