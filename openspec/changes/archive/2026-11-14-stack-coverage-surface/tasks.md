## 1. Engine exports (design D2)

- [x] 1.1 Export `PATTERNS` from `apps/scanner/src/scan/ecosystem.ts` and the VB6/Delphi extension sets from `apps/scanner/src/scan/stackcensus.ts`, with no behaviour change; verify `npm run lint --workspace leapscore-scan` and the scanner suite (`npm test --workspace leapscore-scan`) pass with no diff in emitted facts
- [x] 1.2 Confirm the exports are additive only: verify `git diff` touches no statement other than the `export` keyword and any local constant regrouping, and that `npm run check:detector-isolation` passes

## 2. Generated manifest (design D1, D3)

- [x] 2.1 Write `apps/site/scripts/build-stack-manifest.ts` deriving stack rows from the vendored datasets, `PATTERNS`, the census extension sets, `FRAMEWORK_SIGNATURES`, and the scanner package version; verify it runs standalone (`./node_modules/.bin/tsx scripts/build-stack-manifest.ts` from `apps/site`) and writes `lib/generated/stacks.ts`
- [x] 2.2 Add the authored runtime→stack and framework→dataset-key mappings with completeness assertions that throw on an unmapped runtime product, an unmapped framework signature, or an advisory ecosystem outside the known set; verify each assertion by temporarily adding a fake entry and observing a named failure
- [x] 2.3 Emit dataset provenance (`eol` and `advisory` version, `data_date`, `source`) and the engine version into the manifest; verify the generated file names all four values and matches the source JSON byte values
- [x] 2.4 Wire the generator into `apps/site` `prebuild` ahead of `next build`; verify `npm run build --workspace @leapscore/site` regenerates the manifest and the committed copy is unchanged after a clean run

## 3. Freshness check (design D1, D8)

- [x] 3.1 Add `tooling/checks/stack-coverage.ts` that generates into memory and requires byte equality with the committed manifest, naming the drifted field on failure; verify it exits 0 on a fresh generate and exits non-zero after a hand edit to `lib/generated/stacks.ts`
- [x] 3.2 Register `check:stack-coverage` in the root `package.json` and in `tooling/scripts/release-gates.ts`; verify `npm run release:gates` lists and passes it, and that a tampered manifest makes the gate script fail

## 4. The stack surface (design D4, D7)

- [x] 4.1 Build `apps/site/app/stacks/page.tsx` rendering one row per manifest stack across recognition, dependency parsing, offline evidence, and grading, with census-only stacks marked as having no dependency surface; verify by rendering the page in a test and asserting every manifest stack id appears exactly once
- [x] 4.2 Render provenance and manifest-derived prose: engine version, both dataset identifiers and dates, the advisory-covered count over package ecosystems, and the judged/named-only framework split computed at render time; verify no numeric literal used in a claim exists in `page.tsx` source outside the manifest import
- [x] 4.3 Add the framework table splitting named frameworks into EOL-judged and named-only; verify its row count equals the manifest framework total and that each row's marker matches the dataset
- [x] 4.4 Add the disclosure block stating the detector denominator (31 of 102, 25 on a local scan) and that stack-specific grading is bounded by the target's manifests and files; verify the rendered text contains both numbers and the census-only sentence
- [x] 4.5 Add page metadata (title/description) consistent with the site's existing pages; verify the exported document carries the title and no base-path-unsafe internal URL

## 5. Rubric handoff (design D4)

- [x] 5.1 Add the handoff section to `apps/site/app/rubric/page.tsx` stating the stack-agnostic indicator count and linking to `/stacks`; verify the rendered section contains exactly one link to `/stacks` and no matrix table
- [x] 5.2 Verify the stack-agnostic count is read from the generated rubric registry rather than typed, and that the section does not restate any stack-level count

## 6. Navigation (design D6)

- [x] 6.1 Insert `Stacks` into `apps/site/components/site-header.tsx` as the second entry (`Samples, Stacks, Method, Rubric`) and add it to the footer nav; verify the rendered header href array is exactly that order
- [x] 6.2 Update both pinned nav assertions in `apps/site/lib/chrome-honesty.test.tsx`; verify the site suite passes and the assertions still reject live-scan and run-history paths
- [x] 6.3 Check the header at a 320px viewport; verify four labels fit without wrapping or overlap and record the observation in the change's apply notes

## 7. Document (design D5)

- [x] 7.1 Write `docs/stack-coverage.md` defining the four capability layers, the census-only rule, and the provenance rule, naming every published stack, quoting no count; verify `npm run check:documentation-structure` passes and every local link resolves
- [x] 7.2 Register the document in `docs/README.md` under documentation areas and update the root `AGENTS.md` site-surface line to include the new route; verify both files link to a path that exists
- [x] 7.3 Verify the document does not duplicate the generated numbers: no cycle count, package count, or advisory count appears in it

## 8. Guards

- [x] 8.1 Add `apps/site/lib/stack-coverage.test.ts` asserting the manifest matches the datasets and tables, the page matches the manifest, and the framework split matches the dataset; verify a deliberately broken expectation fails the suite
- [x] 8.2 Add the doc↔manifest assertion that every manifest stack id appears in `docs/stack-coverage.md`; verify adding a fake stack row to the manifest fails the suite with the missing id named
- [x] 8.3 Extend `apps/site/lib/claim-honesty.test.tsx` with the `/stacks` and `/rubric` surfaces; verify the banned-vocabulary scan runs against both and passes

## 9. Release validation

- [x] 9.1 Run `openspec validate stack-coverage-surface --strict`; verify no errors
- [x] 9.2 Run `npm run release:gates` from the root; verify every check including the new stack-coverage comparison passes
- [x] 9.3 Build the static export (`npm run build --workspace @leapscore/site`) and run `check:export`; verify `out/stacks/index.html` exists without the `__next_error__` marker and every internal URL respects the configured base path
