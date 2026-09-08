// Render the SAME HHH component as a static SPA. No server, external CDN or API key.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
const root = fileURLToPath(new URL('..', import.meta.url));
const output = resolve(root, 'outputs/github-pages');
const publicOutput = resolve(output, 'HHH');
await build({
  configFile: false, root: resolve(root, 'github-pages'), base: './',
  publicDir: resolve(root, 'public'), plugins: [react()],
  resolve: { alias: { '@': root } },
  css: { postcss: { plugins: [tailwindcss()] } },
  build: { outDir: publicOutput, emptyOutDir: true, sourcemap: false },
});
await mkdir(output, { recursive: true });
await writeFile(resolve(output, '.nojekyll'), '');
// Source maps and internal build manifests are not public deployment inputs.
const files = [];
async function visit(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name.endsWith('.map') || e.name.startsWith('vinext-client')) continue;
    const path = resolve(dir, e.name);
    if (e.isDirectory()) await visit(path);
    else files.push({ path: relative(output, path).replaceAll('\\', '/'), bytes: (await readFile(path)).length });
  }
}
await visit(publicOutput);
await writeFile(resolve(output, 'manifest.json'), JSON.stringify({ files }, null, 2));
console.log(JSON.stringify({ github_pages_files: files.length, output }));
