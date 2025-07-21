import { arrayRemoveAllInPlace, assertDefined } from "complete-common";
import { readFileAsync, touchAsync } from "complete-node";
import fs from "node:fs";
import {
  CURRENT_LETTERS_PATH,
  DICTIONARY_PATH,
  NUMBER_WORDS,
} from "./constants.js";
import { RUN_CONSTANTS } from "./runConstants.js";
import { getWordScore, hasRepeatingLetters } from "./score.js";
import { clearLog, log, writeLog } from "./utils.js";

let currentLetters = "";

await main();

async function main() {
  process.on("SIGINT", () => {
    watcher.close();
    process.exit();
  });

  console.log(`Watching for changes on file: ${CURRENT_LETTERS_PATH}`);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const watcher = fs.watch(CURRENT_LETTERS_PATH, onCurrentLettersFileChanged);

  await touchAsync(CURRENT_LETTERS_PATH);
}

async function onCurrentLettersFileChanged() {
  const newCurrentLetters = await readFileAsync(CURRENT_LETTERS_PATH);
  if (newCurrentLetters === "" || newCurrentLetters === currentLetters) {
    return;
  }
  currentLetters = newCurrentLetters;
  await onLettersChanged();
}

async function onLettersChanged() {
  clearLog();

  const unsortedLetters = parseCurrentLetters();
  const letters = unsortedLetters.toSorted();
  if (RUN_CONSTANTS.disableAsterisks) {
    arrayRemoveAllInPlace(letters, "*");
  }
  log(`Letters: ${letters.join(", ")}\n`);

  let isSpecialRound = false;
  for (const [key, value] of Object.entries(RUN_CONSTANTS.specialRounds)) {
    if (value !== undefined && value !== false) {
      isSpecialRound = true;
      log(`----- SPECIAL ROUND: ${key} -----`);
    }
  }
  if (isSpecialRound) {
    log("");
  }

  const possibleWords = await getPossibleWords(letters);
  logSortedWords(possibleWords);

  await writeLog();
}

/**
 * A current letters string is like:
 *
 * ```text
 * TS0000
 * IG0000
 * AS0000
 * RS0000
 * RS0000
 * IS0000
 * AS0000
 * RS0000
 * ES0000
 * WS0000
 * OS0000
 * VS0000
 * AS0000
 * WS0000
 * IS0000
 * IS0000
 * ```
 */
function parseCurrentLetters(): readonly string[] {
  const letters = currentLetters.split("\n");

  return letters.map((letter) => {
    const firstCharacter = letter[0];
    assertDefined(
      firstCharacter,
      `Failed to get the first character of a letter from: ${currentLetters}`,
    );

    return firstCharacter;
  });
}

async function getPossibleWords(
  unknownCaseLetters: readonly string[],
): Promise<readonly string[]> {
  // Separate single letters from sequences.
  const singleLetters: string[] = [];
  const requiredSequences: string[] = [];

  for (const item of unknownCaseLetters) {
    if (item.length === 1) {
      singleLetters.push(item.toLowerCase());
    } else {
      requiredSequences.push(item.toLowerCase());
    }
  }

  // Make a map of available single letters only.
  const availableLetters = new Map<string, number>();
  for (const letter of singleLetters) {
    availableLetters.set(letter, (availableLetters.get(letter) ?? 0) + 1);
  }

  // Notifications
  if (RUN_CONSTANTS.has2OrMore !== undefined) {
    for (const [letter, count] of availableLetters) {
      if (letter === RUN_CONSTANTS.has2OrMore && count >= 2) {
        log(`(2+ "${letter}" detected)`);
      }
    }
  }
  if (RUN_CONSTANTS.threeXSameLetter) {
    for (const [letter, count] of availableLetters) {
      if (count >= 3) {
        log(`(3+ "${letter}" detected)`);
      }
    }
  }

  // Given the letters that we have, print out a list of all of the valid words we can make,
  // starting with the longest and ending with the shortest.
  const wordsFile = await readFileAsync(DICTIONARY_PATH);
  const words = wordsFile.split("\n");

  const allWords: string[] = [];
  for (const word of words) {
    allWords.push(word);

    if (RUN_CONSTANTS.anythingCanStartWithRE) {
      allWords.push(`RE${word}`);
    }
  }

  const possibleWords = allWords.filter(
    (word) =>
      word !== ""
      && canMakeWordWithLetters(word, availableLetters, requiredSequences),
  );

  // Notifications
  if (RUN_CONSTANTS.containsSequence !== undefined) {
    const letterSequence = RUN_CONSTANTS.containsSequence;
    if (
      possibleWords.some((word) => word.toLowerCase().includes(letterSequence))
    ) {
      log(`(words that contain "${letterSequence}" detected)`);
    }
  }
  if (RUN_CONSTANTS.increaseIfContainsNumber) {
    for (let i = 20; i >= 1; i--) {
      const numberWord = NUMBER_WORDS[i as never];
      if (
        possibleWords.some((word) => word.toLowerCase().includes(numberWord))
      ) {
        log(`(found number word: ${numberWord})`);
      }
    }
  }
  if (RUN_CONSTANTS.startsWith !== undefined) {
    const prefix = RUN_CONSTANTS.startsWith;
    if (possibleWords.some((word) => word.toLowerCase().startsWith(prefix))) {
      log(`(words that start with "${prefix}" detected)`);
    }
  }

  return possibleWords;
}

function canMakeWordWithLetters(
  word: string,
  availableLettersReadonly: ReadonlyMap<string, number>,
  availableSequences: readonly string[] = [],
): boolean {
  const availableLetters = new Map(availableLettersReadonly);
  const wordLower = word.toLowerCase();

  // Try to use sequences to match parts of the word.
  const unusedSequences = [...availableSequences];
  let modifiedWord = wordLower;

  for (let i = 0; i < unusedSequences.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const sequence = unusedSequences[i]!;
    if (modifiedWord.includes(sequence)) {
      // Use this sequence by removing it from the word.
      modifiedWord = modifiedWord.replace(sequence, "");
      unusedSequences.splice(i, 1);
      i--; // Adjust index after removal.
    }
  }

  // Now check if we can make the remaining letters.
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

  for (const letter of modifiedWord) {
    wordLetterCount.set(letter, (wordLetterCount.get(letter) ?? 0) + 1);
  }

  if (RUN_CONSTANTS.sEqualsZ) {
    // Pool the available "s" and "z" tiles together.
    const totalAvailableSZ =
      (availableLetters.get("s") ?? 0) + (availableLetters.get("z") ?? 0);

    // Pool the required "s" and "z" letters for the word.
    const totalRequiredSZ =
      (wordLetterCount.get("s") ?? 0) + (wordLetterCount.get("z") ?? 0);

    // Check if the combined pool is sufficient.
    if (totalAvailableSZ < totalRequiredSZ) {
      const deficit = totalRequiredSZ - totalAvailableSZ;
      wildcardsAvailable -= deficit;

      if (wildcardsAvailable < 0) {
        return false; // Not enough s, z, or wildcards.
      }
    }

    // Remove "s" and "z" from the word count map so they are not checked again in the loop below.
    wordLetterCount.delete("s");
    wordLetterCount.delete("z");
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

function logSortedWords(words: readonly string[]) {
  // Word Play only accepts words of length 4 or longer.
  const bigWords = words.filter((word) => word.length >= 4);

  if (bigWords.length === 0) {
    log("No found combinations found!");
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
    const suffix = getLineSuffix(word);
    log(
      `- ${paddedWord} - ${score.wordScore} (${word.length}) [${score.letterScores}] ${score.wordScorePreMultiplier}*${score.wordMultiplier}${suffix}`,
    );
  }
}

function getLineSuffix(word: string) {
  let suffix = "";

  const repeatingLetters = hasRepeatingLetters(word);

  if (repeatingLetters) {
    suffix = " - letter pair";
  }

  return suffix;
}
