import { GoogleGenAI } from "@google/genai";
import { assertDefined } from "complete-common";
import { makeDirectoryAsync } from "complete-node";
import { Jimp } from "jimp";
import { Window } from "node-screenshots";
import path from "node:path";
import { RUN_CONSTANTS } from "./runConstants.js";

interface Coordinate {
  x: number;
  y: number;
}

export interface CoordinateWithLetters {
  coordinate: Coordinate;
  letters: string;
}

const WORD_PLAY_EXE_NAME = "Word Play.exe";
const IMAGES_DIR_NAME = "images";

/** @returns Array of uppercase letters. */
export async function getLettersFromWordPlay(): Promise<
  readonly CoordinateWithLetters[]
> {
  const geminiAPIKey = process.env["GEMINI_API_KEY"];
  if (geminiAPIKey === undefined || geminiAPIKey === "") {
    throw new Error("Failed to read the environment variable: GEMINI_API_KEY");
  }

  const googleGenAI = new GoogleGenAI({ apiKey: geminiAPIKey });

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

  const coordinatesWithLetters = await Promise.all(
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

      const letters = await getLettersFromImage(
        imagePath,
        googleGenAI,
        xCoordinate,
        yCoordinate,
      );

      return {
        coordinate,
        letters,
      };
    }),
  );

  return coordinatesWithLetters;
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
        (x === 0 && y === 0 && !RUN_CONSTANTS.extraTileSlot1)
        || (x === 0 && y === 1 && !RUN_CONSTANTS.extraTileSlot2)
        || (x === 0 && y === 2 && !RUN_CONSTANTS.extraTileSlot3)
        // Always skip the shuffle square.
        || (x === 0 && y === 3)
        // Special rounds
        || (x === 1
          && y === 0
          && RUN_CONSTANTS.specialRounds.top4TilesAreLocked)
        || (x === 2
          && y === 0
          && RUN_CONSTANTS.specialRounds.top4TilesAreLocked)
        || (x === 3
          && y === 0
          && RUN_CONSTANTS.specialRounds.top4TilesAreLocked)
        || (x === 4
          && y === 0
          && RUN_CONSTANTS.specialRounds.top4TilesAreLocked)
      ) {
        continue;
      }

      coordinates.push({ x, y });
    }
  }

  return coordinates;
}

/**
 * @returns A string with the letters on the tile. Normally, this will be a single letter, but it
 *          can also be e.g. "ers" for a special tile.
 */
async function getLettersFromImage(
  imagePath: string,
  googleGenAI: GoogleGenAI,
  x: number,
  y: number,
): Promise<string> {
  const uploadResult = await googleGenAI.files.upload({
    file: imagePath,
  });

  const response = await googleGenAI.models.generateContent({
    model: "gemini-2.5-flash-lite-preview-06-17",
    contents: [
      "The image contains either one letter, two letters, three letters, or an asterisk. Reply with only the text in the image and nothing else.",
      {
        fileData: {
          fileUri: uploadResult.uri,
        },
      },
    ],
  });

  const content = response.text;
  assertDefined(
    content,
    `Failed to get the result from the API for square number: (${y}, ${x})`,
  );

  let letters = content
    // Remove ASCII characters.
    // eslint-disable-next-line no-control-regex
    .replaceAll(/[^\u0000-\u007F]/g, "")
    // Remove numbers.
    .replaceAll(/\d/g, "")
    // Remove spaces.
    .replaceAll(" ", "")
    // Remove ampersands.
    .replaceAll("&", "")
    // Remove commas.
    .replaceAll(",", "")
    // Remove periods.
    .replaceAll(".", "")
    .toLowerCase();

  if (letters === "") {
    throw new Error(
      `Got an empty response from the API for square number: (${y}, ${x})`,
    );
  }

  if (letters === "_") {
    return "";
  }

  if (letters === "+") {
    // The API will sometimes turn "*" into "+" (for some reason).
    letters = "*";
  }

  if (letters.length === 2 && letters !== "qu") {
    if (letters[1] === "*") {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      letters = letters[0]!;
    } else {
      throw new Error(
        `Got an unknown 2 letter sequence for square number: (${y}, ${x}) - ${letters}`,
      );
    }
  }

  if (letters.length === 3 && letters !== "ers" && letters !== "ing") {
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

  return letters;
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
