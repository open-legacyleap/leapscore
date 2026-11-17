## Why

The site carries two competing coverage stories. `/rubric` discloses how much of the rubric this release can grade, then hands the reader off to a separate top-level `/stacks` page for the other half of the same question — what a given stack actually exposes. One disclosure split across two destinations leaves a nav slot answering a question only a slice of visitors ask, and the handoff paragraph is the seam where the split shows.

## What Changes

- Retire `/stacks` as a top-level surface. Its content moves under the rubric at `/rubric/stacks`: the stack matrix, the advisory sentence, the framework split, the provenance block, and the "where the coverage stops" panel.
- `/rubric` replaces its stack handoff paragraph with a "Coverage by stack" section that states derived headline numbers from `STACK_MANIFEST` and links the sub-route. The matrix is rendered once, at `/rubric/stacks`.
- **BREAKING** (route): `/stacks` is no longer exported. It resolves through the site's not-found document. No forwarding document is added.
- The header loses its `Stacks` link and gains two utilities: `GitHub` (the public repository, from `lib/source-links.ts`) and `$0 Assessment` (`/assessment`, bare — no campaign parameter). All header links keep the plain muted treatment; no CTA styling.
- The header becomes two rows below `sm` (utilities in the brand row, reading links below) and stays one row at `sm+`, still inside the 56px sticky bar on desktop.
- The footer drops its `Stacks` link; the repository link stays there.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-shell`: the header roster is no longer "exactly 4 nav links (Samples, Stacks, Method, Rubric)". It becomes three reading links (Samples, Method, Rubric) plus two utilities (GitHub, $0 Assessment), with a stated two-row-below-`sm` rule; the repository link is no longer footer-only; no link may target `/stacks`.
- `stack-coverage-surface`: the contract matrix's single home moves from `/stacks` to `/rubric/stacks`; the rubric index must carry a derived summary and link instead of a bare handoff; the "rubric index hands off instead of duplicating" requirement is replaced; the retired `/stacks` path resolves to not-found rather than forwarding.
- `rubric-browser`: the rubric surface gains one sub-route (`/rubric/stacks`) reachable from the index, and the index's coverage disclosure is extended by the stack-coverage summary section.

## Impact

- **Site routes:** `app/rubric/stacks/page.tsx` added; `app/stacks/page.tsx` removed. `app/rubric/page.tsx` gains the summary section. No change to `app/rubric/[categoryId]` dynamic params — the static sibling segment wins.
- **Site chrome:** `components/site-header.tsx` (roster, two nav groups, responsive rows), `components/footer.tsx` (drop Stacks), `lib/rubric-links.ts` (own the new href), matrix extracted out of the deleted page into a component, `lib/stack-coverage.ts` path references.
- **Tests:** `lib/chrome-honesty.test.tsx` (header href arrays, inverted no-repository-in-header assertion, new no-`/stacks` guard), `lib/claim-honesty.test.tsx` and `lib/stack-coverage.test.ts` (import/path updates), `lib/rubric-routes.test.tsx` (index → sub-route link).
- **Docs:** root `AGENTS.md` site line, `apps/site/README.md` (Routes, Removed surfaces — its Routes list already omits `/stacks`), `docs/README.md`, `docs/stack-coverage.md`.
- **Unchanged:** `packages/contracts`, the scanner, the Action, emitted report artifacts, `assessment-destination` (a bare `/assessment` link is the spec's default-attribution case), and `apps/site/scripts/assert-export.ts` (no new forwarded path).
- **Backlinks:** internal docs are the only known `/stacks` references; nothing emitted or in `docs/marketing` links it. Any externally shared `/stacks` link will 404 — a static host offers no redirect, and this change deliberately does not add a forwarding document.
