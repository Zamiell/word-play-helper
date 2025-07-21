import { ReadonlyMap } from "complete-common";

/** This is written to by the `LettersToTextFile` mod. */
export const CURRENT_LETTERS_PATH = String.raw`D:\SteamLibrary\steamapps\common\Word Play\current-letters.txt`;

/**
 * - 10 - q, z
 * - 8 - j, x
 * - 5 - k
 * - 4 - f, v, w, y
 * - 3 - c, m, p
 * - 2 - d, g
 */
export const LETTER_POINTS = new ReadonlyMap<string, number>([
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

export const NUMBER_WORDS = {
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
  11: "eleven",
  12: "twelve",
  13: "thirteen",
  14: "fourteen",
  15: "fifteen",
  16: "sixteen",
  17: "seventeen",
  18: "eighteen",
  19: "nineteen",
  20: "twenty",
} as const;
