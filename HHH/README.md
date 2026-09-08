# HHH

## Public GitHub Pages mirror

`node scripts/github-pages.mjs` builds the same HHH component as a self-contained
static page in `outputs/github-pages/HHH`. Publish only its generated manifest
files to repository `HHH/`; preserve the original repository root homepage. The
entry is `https://kennyscannotkillme.github.io/kennys.github.io/HHH/`. All runtime
assets and snapshots use relative same-origin URLs; no ChatGPT login or external
font/CDN is required. Mainland network reachability is not guaranteed by a build.

Every validated material update is authorized for automatic public publication.
Publish only the explicit sanitized research/activity snapshots, not private data.
New research targets all A-shares and after-cost outperformance versus STAR50;
historical STAR-only results retain their original universe and evidence level.

Work, made visible. / 让工作可见。

An icon-first bilingual work journal: frosted strata, expandable records, a quiet light/dark palette, keyboard access and reduced-motion support. Design advice by Claude Opus; implementation by Codex.

## Run

Node >=22.13 and pnpm. Install with `pnpm install --frozen-lockfile`, then `pnpm dev`. Static build: `pnpm build`; serve only `dist/client`, never the containing private project. Checks: `pnpm exec tsc --noEmit`, `node --test tests/activity.test.mjs`.

The pinned vinext CLI force-exits while native Windows handles are closing. `scripts/build.mjs` lets a successful build exit naturally on Windows; failures keep their original nonzero exit status.

## What a record means

`public/activity.json` is an explicitly curated, bilingual publication snapshot. `observed_at` is evidence/observation time, **not** a measured task start or finish. Status refers to that snapshot. There is no fake completion percentage, token counter or inferred worker heartbeat. Refresh checks for a new published snapshot every 20 seconds while the page is visible; it does not launch agents or turn a static host into a live process monitor.

For a new work unit, update only this allowlisted feed with actual milestones, run the small feed test, then republish. Do not copy raw agent logs, private paths, databases, credentials or account information. Local preferences store language, appearance and motion only. No analytics or ordering endpoints.

## Design references

[Apple Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/liquid-glass) informed material separation. [Linear's UI refresh](https://linear.app/changelog/2026-03-12-ui-refresh) informed restraint. The UI is original, not a copy of either product.

Public output intentionally excludes the original private trading application. Research queues shown here are not profitability or deployment claims.
