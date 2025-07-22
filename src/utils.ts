import { writeFileAsync } from "complete-node";
import { OUTPUT_PATH } from "./constants.js";

let fileContents = "";

export function log(msg: string): void {
  fileContents += `${msg}\n`;
}

export function clearLog(): void {
  fileContents = "";
}

export async function writeLog(): Promise<void> {
  await writeFileAsync(OUTPUT_PATH, fileContents);
}
