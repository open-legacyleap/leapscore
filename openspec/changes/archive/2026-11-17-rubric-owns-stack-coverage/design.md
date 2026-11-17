## Context

See `proposal.md` — Why. Constraints that shape the approach:

- **The matrix already has one generator.** `apps/site/scripts/build-stack-manifest.ts` → `lib/generated/stacks.ts` is the only source of stack membership and counts, guarded by `npm run check:stack-coverage` (byte equality against a fresh generation). The move must not add a second writer or a hand-typed number.
- **The matrix is derived sentences over that manifest.** `lib/stack-coverage.ts` already exposes `advisoryCoverage()`, `frameworkSplit()`, `detectorCoverage()`, `censusDisclosure()`, `provenanceSentence()`; the page in `app/stacks/page.tsx` renders them plus four local cell components.
- **The index is a static page with one client island.** `app/rubric/page.tsx` renders server-side; `RubricSearch` is the only client component. A server-rendered summary section does not touch that island.
- **Route mechanics.** `app/rubric/[categoryId]/page.tsx` sets `dynamicParams = false` and generates params `01…10`. A static sibling `app/rubric/stacks/page.tsx` wins over the dynamic segment, so no category-prefix change and no new generated params.
- **The chrome is pinned twice.** `lib/chrome-honesty.test.tsx` asserts the header href array exactly (two tests), asserts the header carries no repository URL, and asserts `SOURCE_URL`'s literal appears in exactly one source module.
- **Static hosting serves no redirects.** Retired paths are either forwarding documents (`/methodology`, `/product`, listed in `assert-export.ts`) or the not-found document (`/live`, `/reports`, …).
- **No brand icons in the installed icon set.** `lucide-react` 1.73 carries no GitHub mark, so the repository affordance is a text link.
- **Assessment attribution defaults.** `assessmentAttribution()` falls back to `ASSESSMENT_CAMPAIGN` (`cli-scan-v1`) when no `utm_campaign` is present, which is the spec's "default attribution when none is supplied" case.

## Goals / Non-Goals

**Goals:**

- One document owns the capability matrix, and the rubric index states the headline without restating rows.
- The header carries the repository and the assessment destination without becoming a menu, a sheet, or a CTA bar.
- The retired `/stacks` path behaves like an intentionally retired route, not a half-moved one.
- Every number on the new index section is computed from the generated manifest by one helper.

**Non-Goals:**

- A stack filter on the rubric browser. It needs indicator-level stack metadata, which is a rubric schema change (the original stack-coverage-surface change deferred it; still deferred).
- Any change to the scanner, `packages/contracts`, the report emitters, or the Action.
- A forwarding document for `/stacks`, or a footer `$0 Assessment` link.
- Any client-side disclosure, tab, or menu in the header or the rubric index.

## Decisions

**D1 — The matrix lives at `/rubric/stacks`, not as an index section.**
An expanded section pushes the category table and the search below a 5-column matrix plus a 21-row framework split; a collapsed one hides the answer from the reader who came for it. A nested route keeps a citable URL, keeps the index scannable, and still reads as rubric-owned (URL, breadcrumb, index summary).
*Alternatives:* section on the index (page becomes three tables deep); `<details>` disclosure (coverage becomes a click no one knows to make); keeping `/stacks` and only changing the nav label (leaves the two-destination split intact).

**D2 — The index carries a summary, never rows.**
The stack-agnostic thesis becomes the section's preamble, followed by derived headline values and one link. The matrix, the framework table, and the per-stack rows exist only in the sub-route document. This keeps D4 of the original change's intent — one dataset, no duplicated table — while relocating the second rendering under the rubric.
*Alternative:* render a compact two-row preview on the index — a second rendering to keep in sync for no reader benefit.

**D3 — One summary helper computes every index number.**
Add `stackCoverageSummary()` to `lib/stack-coverage.ts` returning the values the section states (recognised stacks, package vs census split, advisory coverage, framework judged split). The section renders those values and the existing `provenanceSentence()`; it types nothing. A test compares the rendered summary against values derived from `buildStackManifest()`, the same way the current surface is guarded.
*Alternative:* compose the sentence in the page — untestable apart from markup matching, and the second place a count can be written.

**D4 — The index summary does not restate the detector denominator.**
The index already states it through `coverageClaim()` ("31 of 102 … engine 1.0.2 …"), and the sub-route states its own with the local-scan split. Naming the route choice here: the same-page duplication that a merge would have created does not arise, so neither sentence is deleted. The stack surface's sentence stays where the local/remote split matters.
*Alternative:* fold both into one sentence on the index — loses the local-scan split on the page that explains coverage per stack.

**D5 — `/stacks` is retired to not-found, with no forwarding document.**
Chosen deliberately: the page was never emitted into reports, the Action, or marketing copy, and the only references are internal docs (updated in this change). A forwarding document would keep a dead URL alive in the sitemap of the export for a surface nobody links.
*Alternative:* `ForwardingRedirect` to `/rubric/stacks` (the `/methodology` pattern) — the right call if a public link had shipped; it did not.

**D6 — Two navigation groups, not one list with CSS reordering.**
`<nav aria-label="Primary">` holds Samples, Method, Rubric; `<nav aria-label="Utilities">` holds GitHub and $0 Assessment. Below `sm` the header renders the brand row (brand + utilities) and the reading row (primary); at `sm` and above both groups sit in the single 56px row. DOM order is reading-before-utilities at every width, so focus order matches visual order and the chrome tests can assert two deterministic arrays instead of scraping one.

**D7 — Plain links, no CTA treatment.**
`$0 Assessment` uses the same muted text treatment as the rest, per the requested treatment. The home page keeps the only bordered control ("See illustrative samples"), so the header does not compete with the install command as the primary action.
*Alternative:* a bordered CTA — rejected as a posture change the request did not ask for.

**D8 — The repository link imports `lib/source-links.ts`; the assessment link imports a route constant.**
`SOURCE_URL` must stay declared in exactly one module (existing test). `$0 Assessment` points at the internal `/assessment` document, not `ASSESSMENT_BASE_URL` — that absolute URL is the producer-side destination baked into reports, and on a Pages staging base path an absolute link would leave the deployment. Add `ASSESSMENT_ROUTE = "/assessment"` next to the existing assessment helpers so the chrome types no route literal.
*Alternative:* reuse `ASSESSMENT_BASE_URL` in the header — correct on the custom domain, wrong on every other base path, and it couples chrome to a contract constant that exists for offline artifacts.

**D9 — The repository link is labelled `GitHub`, the assessment link `$0 Assessment`.**
Both are short enough for the narrow row, and both name their destination. The label `GitHub` is added to `lib/source-links.ts` beside `SOURCE_LABEL` so the site still has one module naming the repository.
*Alternative:* an authored GitHub glyph — the installed icon set has none, and a hand-drawn brand mark is new asset surface for no legibility gain.

**D10 — The matrix markup moves into a component.**
`app/rubric/stacks/page.tsx` becomes a thin route (metadata, breadcrumb, the component); the four cell renderers and the table move to `components/stack-coverage.tsx`. This keeps the index structurally unable to re-render rows and gives the moved tests one import to update.
*Alternative:* leave the markup inline in the route — works, but the next surface that wants a stack row copies it.

**D11 — Rubric URL composition stays in `lib/rubric-links.ts`.**
Add `stackCoverageHref()` there; the index and the sub-route's breadcrumb import it. The module's contract ("the only place that composes rubric URLs") holds, and `next/link` applies the base path.

**D12 — Test changes are assertions, not relaxations.**
`chrome-honesty` keeps its shape: two arrays asserted exactly (`["/samples","/method","/rubric"]`, `[SOURCE_URL,"/assessment"]`), plus new guards that no surface links `/stacks`, that the header carries exactly one repository anchor and one assessment anchor, and that the assessment href has no query string. `stack-coverage.test.ts` and `claim-honesty.test.tsx` move their page import. `rubric-routes.test.tsx` gains the index↔sub-route link assertion and the "static sibling is not a category" assertion.

## Risks / Trade-offs

- [An externally shared `/stacks` link now 404s] → Accepted and recorded in `apps/site/README.md` "Removed surfaces"; no emitted artifact or marketing copy links it. Reversible only by adding a forwarding document, which this change deliberately does not do.
- [Two-row header eats viewport on mobile] → Header becomes `min-h-14` + row gap below `sm`, ~88px sticky. Verify at 320px and 375px; if it reads heavy, the fallback is the same markup with a tighter second row (`text-xs`, reduced vertical padding), not a menu.
- [The chrome test scrapes the wrong `<nav>`] → Two navs carry distinct `aria-label`s; tests select by label rather than first-match.
- [Summary numbers drift from the sub-route] → Both derive from one manifest through `stackCoverageSummary()` and the existing helpers; `check:stack-coverage` still fails on a stale committed manifest.
- [The index section becomes marketing copy] → The summary states derived values and the manifest's provenance; the claim-honesty scan extends to the index section and the new route, so a future-support promise or an unqualified full-coverage claim fails the suite.
- [The header's assessment link is counted as `cli-scan-v1`] → This is the spec's default-attribution case, not a defect; noted here so the funnel numbers are read correctly. Tagging a campaign would be its own decision and would change `assessment-destination`.

## Migration Plan

Presentation-only; no persisted data, no schema, no deployment-input change.

1. Add the summary helper and the route component; move the matrix markup.
2. Add `/rubric/stacks`, then delete `app/stacks/page.tsx` in the same commit so no build exports both.
3. Switch the header and footer, update the chrome/coverage/route tests, update the four docs that name `/stacks`.
4. Verify: workspace suites (`npm test`), `npm run check:stack-coverage`, `npm run check:site-boundary`, the site build with `assert-export`, and `npm run check:documentation-structure` for the doc edits.

Rollback is a revert: the route returns to `/stacks`, the header to four links; nothing outside the export changes.

## Open Questions

- Which four values the index summary states is a copy call, not a contract: the candidate set is recognised stacks, package/census split, advisory coverage, and judged/named-only frameworks. It can be trimmed at review without touching the spec or the approach.
