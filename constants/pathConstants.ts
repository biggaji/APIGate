import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { promisify } from 'node:util';

export const PATH_CONSTANTS = {
  __filename: fileURLToPath(import.meta.url),
  __dirname: path.dirname(__filename),
  rootDir: process.cwd(),
  readFile: promisify(fs.readFile),
  writeFile: promisify(fs.writeFile),
};
