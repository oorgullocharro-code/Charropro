import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

// Package the existing browser-neutral authorities verbatim, never a second implementation.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const destination = resolve(root, 'functions/reconciliationShared');
const check = process.argv.includes('--check');
const manifest = {};
function emit(name, content) {
  const target = resolve(destination, name);
  if (check) {
    if (readFileSync(target, 'utf8') !== content) throw new Error(`shared-authority-drift:${name}`);
  } else {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
}
function visit(file) {
  const name = relative(resolve(root, 'js'), file);
  if (name.startsWith('..')) throw new Error('shared-import-outside-js');
  if (manifest[name]) return;
  const source = readFileSync(file, 'utf8');
  manifest[name] = createHash('sha256').update(source).digest('hex');
  emit(name, source);
  for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) {
    if (!match[1].startsWith('.')) throw new Error('shared-external-dependency');
    visit(resolve(dirname(file), match[1].split('?')[0]));
  }
}
visit(resolve(root, 'js/public/publicProjection.js'));
emit('package.json', JSON.stringify({ type: 'module', private: true }, null, 2) + '\n');
emit('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`RECONCILIATION_SHARED=${check ? 'VERIFIED' : 'PACKAGED'} FILES=${Object.keys(manifest).length}`);
