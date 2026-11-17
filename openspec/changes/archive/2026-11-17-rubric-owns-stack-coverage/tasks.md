## 1. Matrix moves under the rubric

- [x] 1.1 Add `stackCoverageSummary()` to `apps/site/lib/stack-coverage.ts` returning recognised-stack, package/census, advisory, and framework judged/named-only values, all derived from `STACK_MANIFEST`; verify a new case in `apps/site/lib/stack-coverage.test.ts` asserts each value against a derivation from `buildStackManifest()`.
- [x] 1.2 Extract the matrix, advisory sentence, provenance block, framework split, and limits panel from `apps/site/app/stacks/page.tsx` into `apps/site/components/stack-coverage.tsx` (server component, keeping the `data-stack` and `data-framework` markers); verify `renderToStaticMarkup` still emits one `data-stack` row per manifest stack.
- [x] 1.3 Add `stackCoverageHref()` to `apps/site/lib/rubric-links.ts`; verify `apps/site/lib/rubric-links.test.ts` asserts it returns `/rubric/stacks` and no component types the path literal.
- [x] 1.4 Add `apps/site/app/rubric/stacks/page.tsx` with its own metadata (`Stack coverage`), a breadcrumb back to `/rubric`, and the new component; verify `lib/rubric-routes.test.tsx` renders it directly and that it is not treated as a category page.
- [x] 1.5 Delete `apps/site/app/stacks/page.tsx`; verify `npm run lint --workspace @leapscore/site` (typecheck) passes and `grep -rn '"/stacks' apps/site/app apps/site/components apps/site/lib` returns no production hits.
- [x] 1.6 Replace the rubric index's stack handoff paragraph with the summary section: stack-agnostic preamble, `stackCoverageSummary()` values, `provenanceSentence()`, and the link from 1.3 — no stack or framework rows; verify `lib/rubric-routes.test.tsx` asserts the summary values and the link, and that the index markup carries no `data-stack`.

## 2. Header and footer

- [x] 2.1 Add `SOURCE_NAV_LABEL = "GitHub"` to `apps/site/lib/source-links.ts` and `ASSESSMENT_ROUTE = "/assessment"` to `apps/site/lib/assessment.ts`; verify the source-links single-module test still passes and `lib/assessment.test.ts` asserts the route constant matches the exported document path.
- [x] 2.2 Rewrite `apps/site/components/site-header.tsx` as two labelled nav groups (primary: Samples, Method, Rubric; utilities: `SOURCE_NAV_LABEL`, `ASSESSMENT_ROUTE`) with the two-row-below-`sm` arrangement and uniform muted styling; verify `renderToStaticMarkup` shows exactly five hrefs in reading-before-utilities order and both `aria-label`s.
- [x] 2.3 Drop the `Stacks` entry from `apps/site/components/footer.tsx` while keeping Samples, Method, Rubric, the contact address, and the repository link; verify footer markup contains no `/stacks` anchor.

## 3. Guard suite

- [x] 3.1 Update `apps/site/lib/chrome-honesty.test.tsx`: assert both nav href arrays exactly, exactly one repository anchor in the header, one `/assessment` anchor with no query string, no `Stacks` label, and no `/stacks` href in header or footer.
- [x] 3.2 Update `apps/site/lib/claim-honesty.test.tsx` to scan the moved route (`@/app/rubric/stacks/page`) and the new index section, and `apps/site/lib/stack-coverage.test.ts` for the new import path and the "no typed stack count" source read.
- [x] 3.3 Add the index↔sub-route link assertions and the "static sibling is not a category" case to `apps/site/lib/rubric-routes.test.tsx`.
- [x] 3.4 Run `npm test --workspace @leapscore/site` and confirm every suite passes with no skipped chrome or coverage case.

## 4. Documentation

- [x] 4.1 Update `apps/site/README.md`: add `/rubric/stacks` to Routes, add `/stacks` to Removed surfaces with the not-forwarded rationale, and note the `source-links`/`assessment` route constants in the architecture list.
- [x] 4.2 Update the site line in the root `AGENTS.md` so the presentation summary no longer names `/stacks` coverage; verify `grep -n "/stacks" AGENTS.md` returns nothing.
- [x] 4.3 Update `docs/README.md` and `docs/stack-coverage.md` so both name `/rubric/stacks` instead of `/stacks`; keep every stack identifier in the doc intact.
- [x] 4.4 Run `npm run check:documentation-structure` and `npm run check:rubric-consistency` and confirm both pass.

## 5. Verification

- [x] 5.1 Run `npm run check:stack-coverage` and confirm the committed stack manifest still matches a fresh generation.
- [x] 5.2 Run `npm run check:site-boundary` and `npm run build --workspace @leapscore/site`, then confirm `out/rubric/stacks/index.html` exists, `out/stacks/index.html` does not, and `assert-export` reports ok.
- [x] 5.3 Load the built export at 320px, 375px, and 768px widths and confirm the header renders two rows below `sm` and one row above it, with no clipped or horizontally scrolling item.
- [x] 5.4 Run `npm run release:gates` and confirm every check and workspace suite passes.
