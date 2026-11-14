## Context

See `proposal.md` — Why. The constraints that shape the approach:

- **The site is a static export with no scan runtime.** `check:site-boundary` forbids the served graph from reaching `apps/scanner` or using `node:fs`; build tooling (`tooling/`, `apps/site/scripts/`, `apps/site/lib/generated/`, tests) is exempt. Two generated manifests already follow this shape: `scripts/build-coverage-manifest.ts` → `lib/generated/coverage.ts`, and `scripts/build-samples-manifest.ts` → `lib/generated/samples.ts`, both wired into `apps/site` `prebuild` with committed output.
- **The scanner's recognition tables are module-local.** `ecosystem.ts` holds `PATTERNS` as an unexported constant; `stackcensus.ts` holds `VB6_EXTS`/`DELPHI_EXTS` unexported. `identity.ts` already exports `FRAMEWORK_SIGNATURES`, and `snapshots.ts` exports the dataset versions and the ecosystem-alias normaliser.
- **The vendored datasets carry their own provenance.** `eol.json` and `advisories.json` each ship `version`, `generated_at`, `data_date`, and a `source` note with the selection rule.
- **The three coverage gaps are facts, not opinions.** Advisories cover `js, java, csharp, py` of the eight package ecosystems; VB6 and Delphi are census-only (no manifest, no lockfile); identity names 21 frameworks while the EOL table judges a set whose overlap with those names is 16. Computing this by hand in page copy would be wrong within one dataset refresh.
- **The site pins its own chrome and vocabulary.** `lib/chrome-honesty.test.tsx` asserts the header href array exactly (twice), and `lib/claim-honesty.test.tsx` scans surfaces for banned phrases including `/\bcoming\b/i` — so no future-support promise can appear.
- **The rubric tree is closed to new documents.** `docs/rubric/` holds exactly `README.md` plus `indicators/`, `model/`, `sheets/`, enforced by `check:documentation-structure`, so the authored document lives at the `docs/` root beside `PRODUCT.md`.

## Goals / Non-Goals

**Goals:**

- One generated dataset is the only place stack membership and stack counts exist; every surface reads it.
- Regenerating after a snapshot refresh changes the published numbers with zero page edits.
- A new runtime product, a new framework signature, or a new stack that the generator cannot map fails the build loudly instead of being silently omitted.
- Two renderings at different depths — a full matrix and a one-sentence rubric handoff — with no duplicated table.

**Non-Goals:**

- Per-stack measured scores on the site (the only measured per-stack coverage numbers live in the planning roadmap and on committed fixtures).
- A stack filter on the rubric browser. That needs indicator-level stack metadata, which is a rubric schema change (see Open Questions).
- Promoting a scanner-side `stacks.ts` catalogue consumed by the engine. Two additive exports are enough for one consumer; a shared catalogue is its own change with its own blast radius.
- Reporting stack coverage per scan on the site. The site never runs a scan; the report already carries `identity.stack` and `legacy_stacks`.

## Decisions

**D1 — Generate in `apps/site/scripts`, commit the output, and add a freshness check.**
The generator follows `build-coverage-manifest.ts`: a prebuild script writes `lib/generated/stacks.ts`; the output is committed so a clean checkout builds without the scanner present. A new `tooling/checks/stack-coverage.ts` (`npm run check:stack-coverage`) regenerates into memory and requires byte equality, wired into `release:gates`.
*Alternatives:* generate at request time — impossible in a static export. Hand-author the matrix with a pinning test — weakest against a new stack, which is exactly the failure the coverage manifest exists to prevent. Put the generator in `tooling/scripts` — wrong home: that directory owns the rubric compiler and the snapshot refresher, and this artifact is site-owned.

**D2 — Read the scanner's tables as data by exporting them, not by parsing source.**
Add `export` to `ecosystem.ts`'s `PATTERNS` and `stackcensus.ts`'s extension sets. No behaviour change, no new module.
*Alternatives:* regex the constant blocks — breaks silently on any refactor, and a silent break is worse than no page. Duplicate the tables in the generator and compare — comparison requires the export anyway.

**D3 — Authored mapping tables inside the generator, guarded by completeness assertions.**
Two mappings cannot be derived: runtime product → stack (`node`→`js`, `python`→`py`, `dotnet`+`dotnetfx`→`csharp`, `vb6`, `delphi`, …) and identity framework name → dataset key (`Spring`→`spring-boot`, `ASP.NET`→`aspnet`; `Fastify`, `Koa`, `Actix`, `Axum`, `Hibernate` → named-only). Both live in the generator with assertions that every snapshot runtime key and every `FRAMEWORK_SIGNATURES` name is mapped or deliberately declared unmapped; the generator throws with the offending name otherwise. This puts the semantic judgement in one reviewable place while the *membership set* stays derived.
*Alternatives:* loosen the dataset by adding aliases to `eol.json` — mixes a data-refresh concern into a documentation change. Derive by string similarity — produces confident wrong pairings (`express`/`export`).

**D4 — Two renderings, one dataset.** `/stacks` owns the full matrix plus a second table splitting the named frameworks into judged and named-only; `/rubric` carries one section that states the stack-agnostic count (read from the compiled registry's applicability text) and links to `/stacks`.
*Alternatives:* the same matrix in both places — guaranteed drift. A rubric filter — see Non-Goals.

**D5 — The authored document holds the rules; the page holds the numbers.**
`docs/stack-coverage.md` defines the four capability layers and names every published stack, and quotes no count. Counts and dataset identifiers appear only where the generated manifest can stamp them, satisfying the provenance requirement. A test asserts every manifest stack appears in the document.
*Alternatives:* make the doc the canonical table — then it must be generated, which is a second writer of the same facts. Leave the doc out — the site would be the only source, which fails the request for a document that answers "what stacks are covered" without a browser.

**D6 — Nav order `Samples, Stacks, Method, Rubric`.**
Append-safe: it preserves the current first and last entries, so the two pinned assertions change by a single inserted element, and the page sits next to the proof (samples) rather than before it.
*Alternative:* lead with `Stacks` — better for the legacy buyer's first question, but it reorders every existing assertion and buries the proof for the JS/Python visitor. Reordering later is a one-line change if that read turns out wrong.

**D7 — The route is `/stacks`.**
It matches the product's own vocabulary: the report's identity block calls census stacks `legacy_stacks`, and the spec is `stack-coverage`.
*Alternatives:* `/coverage` collides with the rubric's coverage vocabulary (31 of 102 detectors), which is a different claim on the same word. `/ecosystems` is too narrow — VB6 and Delphi are not package ecosystems, and using it would exclude half the point of the page.

**D8 — Freshness is its own check, not an extension of `check:dist`.**
`check:dist` compares the committed Action bundle against its sources; this check compares a site manifest against the scanner datasets. Different inputs, different failure message, and a change to one should not drag the other's release-blocking semantics.
*Alternative:* fold into `check:dist` — couples two unrelated artifacts and makes the dist failure message ambiguous.

## Risks / Trade-offs

- [The manifest becomes a third consumer of scanner-internal constants, and the exports ossify] → Keep it to two existing exports with no new module; if a third consumer appears, promote the tables into a shared catalogue as its own change rather than growing the exports.
- [A dataset refresh changes public claims without anyone reading the page] → The freshness check fails on a stale committed manifest, and every count renders from it, so page copy cannot disagree with the data.
- [Readers take the matrix as "all 102 indicators grade my stack"] → The denominator, the census-only marking, and the advisory-gap marking are requirement-level, not copy-level; the banned-vocabulary scan extends to the new route.
- [The framework split doubles the surface and adds noise] → It is generated from the same manifest and isolated in one component; dropping it later removes one requirement and one component without touching the matrix.
- [Four nav links overflow on a narrow viewport] → Four short labels against the existing `gap-5`/`text-sm` row; verify at 320px. A collapsing menu is explicitly out of scope.
- [The document and the manifest drift apart] → The test in the document requirement fails when a manifest stack is missing from the doc.

## Migration Plan

Additive; no data or state migration. Generate the manifest, commit it, run `npm run release:gates` (which now includes `check:stack-coverage`), build the static export. Rollback is a revert: remove the route, the nav entry, the manifest, and the doc; no runtime state, no schema, no stored report is affected.

## Open Questions

- Whether indicator-level stack metadata should normalize the 82 `Ecosystems:` lines into a vocabulary, enabling a real rubric filter and per-indicator stack applicability. Deferred: it touches 102 canonical files plus the identity-field list in `check:documentation-structure`.
- Whether the framework split later deserves promotion to its own surface or remains a collapsed table on `/stacks`.
- Whether `docs/README.md` should list the new document under "Start here" or only under "Documentation areas". A copy decision, revisable without touching this change's specs.
