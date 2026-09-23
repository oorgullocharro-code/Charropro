import { readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

// Package the existing browser-neutral authorities verbatim, never a second implementation.
const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export function synchronizeSharedAuthorities(rootInput = DEFAULT_ROOT, options = {}) {
  const root = resolve(rootInput);
  const destination = resolve(root, 'functions/reconciliationShared');
  const check = options.check === true;
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
  // The worker and the browser must share both the V3 builder and the durable
  // outbox state machine. Keeping both entries here makes drift a packaging
  // failure instead of a runtime authorization difference.
  visit(resolve(root, 'js/public/publicProjection.js'));
  visit(resolve(root, 'js/core/publicProjectionOutbox.js'));
  emit('package.json', JSON.stringify({ type: 'module', private: true }, null, 2) + '\n');
  emit('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
  return Object.freeze({ check, files: Object.freeze(Object.keys(manifest).sort()) });
}

if (isDirectExecution()) {
  const check = process.argv.includes('--check');
  const result = synchronizeSharedAuthorities(DEFAULT_ROOT, { check });
  console.log(`RECONCILIATION_SHARED=${check ? 'VERIFIED' : 'PACKAGED'} FILES=${result.files.length}`);
}

function isDirectExecution() {
  if (!process.argv[1]) return false;
  return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));
}
