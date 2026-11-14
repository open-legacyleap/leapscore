## Why

The scanner recognises ten stacks — eight package ecosystems plus census-only VB6 and Delphi — but no public surface says so. The site never names a language; its only committed sample is Java; the four-stack capability matrix survives in `docs/roadmap/structural-legacy-coverage.md`, which is explicitly planning-only. A visitor from a WebForms or VB6 estate cannot learn that this product sees them, while the JS/Python visitor reads a site that appears written only for them.

The gap is larger than a missing page. "Covered" is four different claims with four different sources of truth — recognition (`ecosystem.ts`, `stackcensus.ts`), dependency parsing (`deps.ts`), offline evidence (`snapshots/eol.json`, `snapshots/advisories.json`), and grading (`detectors/*.ts`) — and the engine's own disclosure is uneven: advisories cover 4 of 8 package ecosystems (SEC-01 says so per scan), census-only stacks have no dependency surface at all, and identity names 21 frameworks while the EOL table judges a different set of 22 (16 overlap). Publishing a single "supported stacks" list would overclaim on all three counts.

## What Changes

- **New generated dataset** `apps/site/lib/generated/stacks.ts`, built at prebuild time from the vendored snapshots, the scanner's ecosystem/census tables, the identity framework signatures, and the scanner package version. Membership and counts are derived; the generator fails loudly when a snapshot runtime or a framework signature has no declared stack mapping, so a refresh or a new stack cannot drift silently.
- **New route `/stacks`** presenting the capability matrix: one row per recognised stack across recognition, dependency parsing, offline evidence, and grading, with a disclosure column naming advisory gaps, census-only limits, and the 31-of-102 detector denominator. Dataset versions and dates render from the manifest, never from hand-typed copy.
- **New section on `/rubric`** stating why the rubric is stack-agnostic (46 of the 82 indicator files that declare an ecosystem say "agnostic") and handing off to `/stacks` — one sentence, one link, no second copy of the matrix.
- **Header nav grows from three links to four** (Samples, Stacks, Method, Rubric), with the footer nav and the two pinned nav assertions updated. **BREAKING** for the `site-shell` header requirement, which fixes the count at exactly three.
- **New authored document** `docs/stack-coverage.md` holding the qualitative capability matrix and the rules for what "covered" means, with counts and dataset versions left to the generated view. Registered in `docs/README.md` and the root `AGENTS.md` site-surface line.
- **Two additive engine exports** (`ecosystem.ts` `PATTERNS`, `stackcensus.ts` extension sets) so the generator reads data rather than parsing prose or regex-matching source. No behaviour change.
- **New guards**: a test proving the manifest matches the snapshots and tables, the page matches the manifest, the doc names every manifest stack, and the page passes the banned-claim vocabulary scan.

## Capabilities

### New Capabilities

- `stack-coverage-surface`: the generated stack-coverage manifest (inputs, derived fields, loud-failure rules), the `/stacks` matrix and disclosure requirements, the `/rubric` handoff section, the authored doc, and the honesty constraints binding all of them (dataset-version provenance, no unqualified support claim, census-only disclosure).

### Modified Capabilities

- `site-shell`: the header nav requirement changes from exactly three links (Samples, Method, Rubric) to exactly four (Samples, Stacks, Method, Rubric). No other chrome requirement changes; the footer's own link set is not spec-governed, so gaining a Stacks link there is implementation only.

`launch-surface` is unchanged: its coverage-vocabulary requirement already binds any public coverage number (version, date, denominator), and no requirement in it enumerates pages — the page-specific honesty rules live in `stack-coverage-surface` instead of being split across two specs.

## Impact

- **New:** `apps/site/app/stacks/page.tsx`; `apps/site/scripts/build-stack-manifest.ts`; `apps/site/lib/generated/stacks.ts` (committed, generated); `apps/site/lib/stack-coverage.ts` (derived sentences over the manifest); `apps/site/lib/stack-coverage.test.ts`; `docs/stack-coverage.md`.
- **Modified:** `apps/site/components/site-header.tsx`, `apps/site/components/footer.tsx`, `apps/site/app/rubric/page.tsx`, `apps/site/package.json` (`prebuild`), `apps/site/lib/chrome-honesty.test.tsx` (both pinned nav assertions), `apps/scanner/src/scan/ecosystem.ts` and `stackcensus.ts` (exports only), `docs/README.md`, root `AGENTS.md`.
- **Unchanged:** scan behaviour, scoring, the rubric catalog, every generated rubric view (`rubric.json`, `rubric.ts`, `sheets/*`), the report envelope and fingerprint inputs, and the boundary checks (`check:site-boundary` exempts `apps/site/scripts/`; no new `node:fs` use reaches the served graph).
- **Risk:** the generated manifest becomes a second consumer of scanner-internal constants. Keeping it to two existing exports (no new module) avoids creating a stack catalogue that competes with `ecosystem.ts`; if a third consumer appears later, promoting the tables into a shared catalogue is its own change.
