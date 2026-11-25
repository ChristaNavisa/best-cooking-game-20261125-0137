// Ember & Thyme — entrypoint: hands the game in.
// Copies game/ and screenshots/ from this repository into the output directory
// and writes /output/dossier.json with buildDossier from vendor/makefun-game.ts.
// Node 22 standard library only; runs twice and writes the same bytes both times.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');

if (!existsSync(gameDir)) throw new Error(`game/ not found at ${gameDir}`);
if (!existsSync(shotsDir)) throw new Error(`screenshots/ not found at ${shotsDir}`);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

cpSync(gameDir, join(outDir, 'game'), { recursive: true, dereference: false });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true, dereference: false });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});

writeFileSync(join(outDir, 'dossier.json'), dossier);

// Rebuild the dossier from what was just written and confirm it matches:
// a mismatch here means the copy step and the dossier disagree.
const check = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
if (!Buffer.from(dossier).equals(Buffer.from(check))) throw new Error('dossier mismatch on re-read');
console.log(`wrote ${outDir}/dossier.json (${dossier.length} bytes)`);
