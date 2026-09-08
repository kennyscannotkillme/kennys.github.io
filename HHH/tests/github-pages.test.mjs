import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const root = new URL('../outputs/github-pages/HHH/', import.meta.url);
await test('Pages build uses relative self-hosted assets and the HHH title', () => {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  assert.match(html, /<title>HHH<\/title>/);
  const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]);
  assert.ok(assets.length >= 3);
  for (const asset of assets) {
    assert.ok(asset.startsWith('./'));
    assert.ok(existsSync(new URL(asset, root)));
  }
});
await test('Pages exports the current exact sanitized snapshots', () => {
  for (const file of ['research.json', 'activity.json']) {
    assert.equal(readFileSync(new URL(file, root), 'utf8'), readFileSync(new URL('../public/' + file, import.meta.url), 'utf8'));
  }
});
