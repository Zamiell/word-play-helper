import {
  assertDefined,
  assertNotNull,
  getElapsedSeconds,
  sumArray,
} from "complete-common";
import { makeDirectoryAsync, readFileAsync } from "complete-node";
import { Jimp } from "jimp";
import { Window } from "node-screenshots";
import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { LETTER_POINTS } from "./letterPoints.js";

interface Coordinate {
  x: number;
  y: number;
}

const WORD_PLAY_EXE_NAME = "Word Play.exe";
const IMAGES_DIR_NAME = "images";
const DICTIONARY_PATH = String.raw`D:\Games\PC\Word Play\1.04\ExportedProject\Assets\Resources\wordsfull.txt`;

const RUN_CONSTANTS = {
  extraTile1: false as boolean,
  extraTile2: false as boolean,
  extraTile3: false as boolean,
  fiveTilesFirstAndLast3x: false as boolean,
  ifFirstLetterEqualsLastLetter: true as boolean,
  ifSameLettersTogether: false as boolean,
  ifWordBeginsWithH: false as boolean,
  longWordBooster: false as boolean,
} as const;

await main();

async function main() {
  const startTime = Date.now();
  const uppercaseLetters = await getLettersFromWordPlay();
  const elapsedSeconds = getElapsedSeconds(startTime);
  console.log(`(${elapsedSeconds}s)`);
  console.log(uppercaseLetters);

  const possibleWords = await getPossibleWords(uppercaseLetters);
  printSortedWords(possibleWords);
}

/** @returns Array of uppercase letters. */
async function getLettersFromWordPlay(): Promise<readonly string[]> {
  const openAIKey = process.env["OPENAI_API_KEY"];
  if (openAIKey === undefined || openAIKey === "") {
    throw new Error("Failed to read the environment variable: OPENAI_API_KEY");
  }

  const openAI = new OpenAI({
    apiKey: openAIKey,
  });

  const wordPlayWindow = getWordPlayWindow();
  const capturedImage = await wordPlayWindow.captureImage();
  const imageBuffer = await capturedImage.toJpeg();

  const gapX = 155;
  const gapY = 155;
  const startX = 661 - gapX;
  const startY = 382;
  const boxWidth = 133;
  const boxHeight = 133;

  await makeDirectoryAsync(IMAGES_DIR_NAME);

  const coordinates = getValidSquareCoordinates();

  const lettersAndUndefined = await Promise.all(
    coordinates.map(async (coordinate) => {
      const { x: xCoordinate, y: yCoordinate } = coordinate;
      const x = startX + xCoordinate * gapX;
      const y = startY + yCoordinate * gapY;

      const image = await Jimp.read(imageBuffer);

      // Crop it to the size of the letter box.
      image.crop({
        x,
        y,
        w: boxWidth,
        h: boxHeight,
      });

      // Now, crop it again so that we only have the letter (without the point score).
      const scaleFactor = Math.sqrt(0.55); // 55%
      const newSize = Math.floor(boxWidth * scaleFactor);
      const offset = Math.floor((boxWidth - newSize) / 2);
      image.crop({
        x: offset,
        y: offset,
        w: newSize,
        h: newSize,
      });

      const imagePath = path.join(
        IMAGES_DIR_NAME,
        `${yCoordinate}-${xCoordinate}.jpg`,
      );

      await image.write(imagePath as never);

      return await getLettersFromImage(
        imagePath,
        openAI,
        xCoordinate,
        yCoordinate,
      );
    }),
  );

  const letters = lettersAndUndefined
    .filter((letter) => letter !== undefined)
    .flat();

  return letters;
}

function getWordPlayWindow(): Window {
  const windows = Window.all();

  const wordPlayWindows = windows.filter(
    (window) => window.appName === WORD_PLAY_EXE_NAME,
  );
  const wordPlayWindow = wordPlayWindows[0];

  if (wordPlayWindow === undefined) {
    throw new Error(
      `Failed to find a window corresponding to: ${WORD_PLAY_EXE_NAME}`,
    );
  }

  if (wordPlayWindows.length !== 1) {
    throw new Error(
      `More than one window corresponding to: ${WORD_PLAY_EXE_NAME}`,
    );
  }

  return wordPlayWindow;
}

function getValidSquareCoordinates(): readonly Coordinate[] {
  const coordinates: Coordinate[] = [];

  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 5; x++) {
      if (
        // Conditionally skip the extra tile squares.
        (x === 0 && y === 0 && !RUN_CONSTANTS.extraTile1)
        || (x === 0 && y === 1 && !RUN_CONSTANTS.extraTile2)
        || (x === 0 && y === 2 && !RUN_CONSTANTS.extraTile3)
        // Always skip the shuffle square.
        || (x === 0 && y === 3)
      ) {
        continue;
      }

      coordinates.push({ x, y });
    }
  }

  return coordinates;
}

/** @returns Array of lowercase letters. */
async function getLettersFromImage(
  imagePath: string,
  openAI: OpenAI,
  x: number,
  y: number,
): Promise<readonly string[] | undefined> {
  const base64Image = await fs.readFile(imagePath, {
    encoding: "base64",
  });

  const response = await openAI.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Tell me what letter or letters appear in the following image. If you cannot detect any letters, respond with an underscore.",
          },
          {
            type: "image_url",
            image_url: { url: `data:image/png;base64,${base64Image}` },
          },
        ],
      },
    ],
  });

  const choice = response.choices[0];
  assertDefined(
    choice,
    `Failed to get the result from OpenAI for square number: (${y}, ${x})`,
  );
  const { content } = choice.message;
  assertNotNull(
    content,
    `Failed to get the message content for square number: (${y}, ${x})`,
  );

  let letters = content.replaceAll(" ", "").toLowerCase();

  if (letters === "") {
    throw new Error(
      `Got an empty response from the API for square number: (${y}, ${x})`,
    );
  }

  if (letters === "_") {
    return undefined;
  }

  if (letters === "+") {
    // The API will sometimes turn "*" into "+" (for some reason).
    letters = "*";
  }

  if (letters.length === 2 && letters !== "qu") {
    throw new Error(
      `Got an unknown 2 letter sequence for square number: (${y}, ${x}) - ${letters}`,
    );
  }

  if (letters.length === 3 && letters !== "ing") {
    throw new Error(
      `Got an unknown 3 letter sequence for square number: (${y}, ${x}) - ${letters}`,
    );
  }

  if (letters.length > 3) {
    if (letters.startsWith("qu")) {
      // The API will sometimes turn "qu" into "quit" and other random words (for some reason).
      letters = "qu";
    } else {
      throw new Error(
        `Got an unknown response from the API for square number: (${y}, ${x}) - ${letters}`,
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-spread
  return [...letters];
}

async function getPossibleWords(
  uppercaseLetters: readonly string[],
): Promise<readonly string[]> {
  // Make a map of available letters.
  const letters = uppercaseLetters.map((letter) => letter.toLowerCase());
  const availableLetters = new Map<string, number>();
  for (const letter of letters) {
    availableLetters.set(letter, (availableLetters.get(letter) ?? 0) + 1);
  }

  // Given the letters that we have, print out a list of all of the valid words we can make,
  // starting with the longest and ending with the shortest.
  const wordsFile = await readFileAsync(DICTIONARY_PATH);
  const words = wordsFile.split("\n");

  return words.filter(
    (word) => word !== "" && canMakeWordWithLetters(word, availableLetters),
  );
}

function canMakeWordWithLetters(
  word: string,
  availableLetters: ReadonlyMap<string, number>,
): boolean {
  let wildcardsAvailable = availableLetters.get("*") ?? 0;

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

  return true;
}

function printSortedWords(words: readonly string[]) {
  // Word Play only accepts words of length 4 or longer.
  const bigWords = words.filter((word) => word.length >= 4);

  const wordsAndScores = bigWords.map((word) => ({
    word,
    score: getWordScore(word),
  }));

  const sorted = wordsAndScores.sort((a, b) => b.score - a.score);
  const wordLengths = words.map((word) => word.length);
  const maxWordLength = Math.max(...wordLengths);

  for (const { word, score } of sorted) {
    const paddedWord = word.padEnd(maxWordLength);
    console.log(`- ${paddedWord} - ${score}`);
  }
}

function getWordScore(word: string): number {
  const repeatingLetters = hasRepeatingLetters(word);

  // eslint-disable-next-line @typescript-eslint/no-misused-spread
  const letters = [...word];
  const lowercaseLetters = letters.map((letter) => letter.toLowerCase());

  const pointsArray = lowercaseLetters.map((letter, i) => {
    const points = LETTER_POINTS.get(letter);

    if (points === undefined || points === 0) {
      throw new Error(`Failed to get the points for letter: ${letter}`);
    }

    let multiplier = 1;
    if (
      RUN_CONSTANTS.fiveTilesFirstAndLast3x
      && word.length === 5
      && (i === 0 || i === 4)
    ) {
      multiplier *= 3;
    }

    return points * multiplier;
  });

  let points = sumArray(pointsArray);
  const longWordMultiplier = RUN_CONSTANTS.longWordBooster ? 2 : 1;
  if (word.length >= 5) {
    points += 5 * longWordMultiplier;
  }
  if (word.length >= 6) {
    points += 5 * longWordMultiplier;
  }
  if (word.length >= 7) {
    points += 5 * longWordMultiplier;
  }
  if (word.length >= 8) {
    points += 10 * longWordMultiplier;
  }
  if (word.length >= 9) {
    points += 10 * longWordMultiplier;
  }
  if (word.length >= 10) {
    points += 15 * longWordMultiplier;
  }
  if (word.length >= 11) {
    points += 15 * longWordMultiplier;
  }
  if (word.length >= 12) {
    points += 20 * longWordMultiplier;
  }
  if (word.length >= 13) {
    points += 20 * longWordMultiplier;
  }
  if (word.length >= 14) {
    points += 20 * longWordMultiplier;
  }
  if (word.length >= 15) {
    points += 25 * longWordMultiplier;
  }
  if (word.length >= 16) {
    points += 25 * longWordMultiplier;
  }
  if (word.length >= 17) {
    points += 25 * longWordMultiplier;
  }
  if (word.length >= 18) {
    points += 30 * longWordMultiplier;
  }
  if (word.length >= 19) {
    points += 40 * longWordMultiplier;
  }
  if (word.length >= 20) {
    points += 50 * longWordMultiplier;
  }
  if (RUN_CONSTANTS.ifWordBeginsWithH) {
    points += 20;
  }

  let multiplier = 1;
  if (
    RUN_CONSTANTS.ifFirstLetterEqualsLastLetter
    && word.at(0) === word.at(-1)
  ) {
    multiplier *= 2;
  }

  if (RUN_CONSTANTS.ifSameLettersTogether && repeatingLetters) {
    multiplier *= 1.5;
  }

  return points * multiplier;
}

function hasRepeatingLetters(word: string): boolean {
  for (let i = 0; i < word.length - 1; i++) {
    const currentLetter = word[i];
    const nextLetter = word[i + 1];

    if (currentLetter === nextLetter) {
      return true;
    }
  }

  return false;
}

/*
function drawRectangleBorder(
  image: Awaited<ReturnType<typeof Jimp.read>>,
  startX: number,
  startY: number,
  width: number,
  height: number,
) {
  const color = 0xff_00_00_ff;
  const endX = startX + width;
  const endY = startY + height;

  for (let x = startX; x < endX; x++) {
    for (let y = startY; y < endY; y++) {
      if (x === startX || x === endX - 1 || y === startY || y === endY - 1) {
        image.setPixelColor(color, x, y);
      }
    }
  }
}
*/
