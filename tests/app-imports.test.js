import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

test('app.js imports setDoc for the product seeding fallback', () => {
  assert.match(
    appSource,
    /import\s*\{[\s\S]*setDoc[\s\S]*\}\s*from\s*["']\.\/firebase-config\.js["']/m,
    'setDoc must be imported from firebase-config.js for the default product seeding path'
  );
});
