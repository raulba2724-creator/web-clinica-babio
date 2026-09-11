import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dueSchedules } from './publication-schedule.mjs';
const root = new URL('../', import.meta.url);
const stateFile = new URL('content/publication-state.json', root);
const state = JSON.parse(await readFile(stateFile, 'utf8'));
const folder = new URL('content/posts/', root);
const posts = await Promise.all((await readdir(folder)).filter(f => f.endsWith('.json')).map(async f => ({...JSON.parse(await readFile(new URL(f, folder), 'utf8')), slug:f.slice(0,-5)})));
const due = dueSchedules(posts, state);
if (Object.keys(due).length) {
  await writeFile(stateFile, JSON.stringify({...state, ...due}, null, 2)+'\n');
  console.log(`Publicaciones vencidas: ${Object.keys(due).join(', ')}`);
} else console.log('No hay publicaciones pendientes de activar.');
