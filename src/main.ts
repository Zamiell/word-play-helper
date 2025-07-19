import { getElapsedSeconds } from "complete-common";
import { readFileAsync } from "complete-node";
import type { CoordinatesWithLetters } from "./getLettersFromWordPlay.js";
import { getLettersFromWordPlay } from "./getLettersFromWordPlay.js";
import { RUN_CONSTANTS } from "./runConstants.js";
import { getWordScore, hasRepeatingLetters } from "./score.js";

const DICTIONARY_PATH = String.raw`D:\Games\PC\Word Play\1.04\ExportedProject\Assets\Resources\wordsfull.txt`;

await main();

async function main() {
  const startTime = Date.now();
  const coordinatesWithLetters = await getLettersFromWordPlay();
  const elapsedSeconds = getElapsedSeconds(startTime);
  console.log(`(${elapsedSeconds}s)`);
  printGrid(coordinatesWithLetters);

  for (const [key, value] of Object.entries(RUN_CONSTANTS.specialRounds)) {
    if (value !== undefined && value !== false) {
      console.log(`SPECIAL ROUND: ${key}`);
    }
  }

  const availableLetters = coordinatesWithLetters.flatMap(
    (coordinateWithLetters) => coordinateWithLetters.letters,
  );
  console.log("availableLetters:", availableLetters);

  const possibleWords = await getPossibleWords(availableLetters);
  printSortedWords(possibleWords);
}

function printGrid(coordinatesWithLetters: CoordinatesWithLetters) {
  // Get the maximum bounds of the grid.
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const { coordinate } of coordinatesWithLetters) {
    minX = Math.min(minX, coordinate.x);
    maxX = Math.max(maxX, coordinate.x);
    minY = Math.min(minY, coordinate.y);
    maxY = Math.max(maxY, coordinate.y);
  }

  // Create a map for quick lookup.
  const gridMap = new Map<string, string>();
  for (const { coordinate, letters } of coordinatesWithLetters) {
    gridMap.set(`${coordinate.x},${coordinate.y}`, letters.join(""));
  }

  // Build and output the grid.
  console.log();
  for (let y = minY; y <= maxY; y++) {
    let row = "";
    for (let x = minX; x <= maxX; x++) {
      const letters = gridMap.get(`${x},${y}`);
      // eslint-disable-next-line unicorn/prefer-ternary
      if (letters !== undefined && letters !== "") {
        row += `${letters} `;
      } else {
        row += "  "; // Two spaces for empty coordinate
      }
    }
    console.log(row.trimEnd());
  }
  console.log();
}

async function getPossibleWords(
  unknownCaseLetters: readonly string[],
): Promise<readonly string[]> {
  // Make a map of available letters.
  const letters = unknownCaseLetters.map((letter) => letter.toLowerCase());
  const availableLetters = new Map<string, number>();
  for (const letter of letters) {
    availableLetters.set(letter, (availableLetters.get(letter) ?? 0) + 1);
  }

  // Notifications
  if (RUN_CONSTANTS.has2OrMore !== undefined) {
    for (const [letter, count] of availableLetters) {
      if (letter === RUN_CONSTANTS.has2OrMore && count >= 2) {
        console.log(`(2+ "${letter}" detected)`);
      }
    }
  }
  if (RUN_CONSTANTS.threeXSameLetter) {
    for (const [letter, count] of availableLetters) {
      if (count >= 3) {
        console.log(`(3+ "${letter}" detected)`);
      }
    }
  }

  // Given the letters that we have, print out a list of all of the valid words we can make,
  // starting with the longest and ending with the shortest.
  const wordsFile = await readFileAsync(DICTIONARY_PATH);
  const words = wordsFile.split("\n");

  const possibleWords = words.filter(
    (word) => word !== "" && canMakeWordWithLetters(word, availableLetters),
  );

  // Notifications
  if (RUN_CONSTANTS.containsSequence !== undefined) {
    const letterSequence = RUN_CONSTANTS.containsSequence;
    if (
      possibleWords.some((word) => word.toLowerCase().includes(letterSequence))
    ) {
      console.log(`(words that contain "${letterSequence}" detected)`);
    }
  }
  if (RUN_CONSTANTS.startsWith !== undefined) {
    const prefix = RUN_CONSTANTS.startsWith;
    if (possibleWords.some((word) => word.toLowerCase().startsWith(prefix))) {
      console.log(`(words that start with "${prefix}" detected)`);
    }
  }

  return possibleWords;
}

function canMakeWordWithLetters(
  word: string,
  availableLettersReadonly: ReadonlyMap<string, number>,
): boolean {
  const availableLetters = new Map(availableLettersReadonly);

  let wildcardsAvailable = availableLetters.get("*") ?? 0;

  if (RUN_CONSTANTS.specialRounds.firstTileIsLocked !== undefined) {
    const value =
      availableLetters.get(RUN_CONSTANTS.specialRounds.firstTileIsLocked) ?? 0;
    availableLetters.set(
      RUN_CONSTANTS.specialRounds.firstTileIsLocked,
      value + 1,
    );
  }

  const wordLetterCount = new Map<string, number>();

  for (const letter of word.toLowerCase()) {
    wordLetterCount.set(letter, (wordLetterCount.get(letter) ?? 0) + 1);
  }

  for (const [letter, count] of wordLetterCount) {
    const availableCount = availableLetters.get(letter) ?? 0;
    if (availableCount < count) {
      const deficit = count - availableCount;
      wildcardsAvailable -= deficit;

      if (wildcardsAvailable < 0) {
        return false;
      }
    }
  }

  if (
    RUN_CONSTANTS.specialRounds.firstTileIsLocked !== undefined
    && RUN_CONSTANTS.specialRounds.firstTileIsLocked !== word[0]?.toLowerCase()
  ) {
    return false;
  }

  return true;
}

function printSortedWords(words: readonly string[]) {
  // Word Play only accepts words of length 4 or longer.
  const bigWords = words.filter((word) => word.length >= 4);

  if (bigWords.length === 0) {
    console.log("No found combinations found!");
    return;
  }

  const wordsAndScores = bigWords.map((word) => ({
    word,
    score: getWordScore(word),
  }));

  const sorted = wordsAndScores.sort(
    (a, b) => b.score.wordScore - a.score.wordScore,
  );
  const wordLengths = words.map((word) => word.length);
  const maxWordLength = Math.max(...wordLengths);

  for (const { word, score } of sorted) {
    const paddedWord = word.padEnd(maxWordLength);
    const suffix = getPrintSuffix(word);
    console.log(
      `- ${paddedWord} - ${score.wordScore} (${word.length}) [${score.letterScores}] ${score.wordScorePreMultiplier}x${score.wordMultiplier}${suffix}`,
    );
  }
}

function getPrintSuffix(word: string) {
  let suffix = "";

  const repeatingLetters = hasRepeatingLetters(word);

  if (repeatingLetters) {
    suffix = " - letter pair";
  }

  return suffix;
}
