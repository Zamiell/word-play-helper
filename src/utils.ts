import { appendFile, writeFile } from "complete-node";
import path from "node:path";

const REPO_ROOT = path.join(import.meta.dirname, "..");
const OUTPUT_PATH = path.join(REPO_ROOT, "output.txt");

export function log(msg: string): void {
  console.log(msg);
  appendFile(OUTPUT_PATH, `${msg}\n`);
}

export function clearLog(): void {
  writeFile(OUTPUT_PATH, "");
}
