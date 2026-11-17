## MODIFIED Requirements

### Requirement: The stack surface does not overclaim

The surface SHALL state the detector denominator for the current release and SHALL state that stack-specific grading is bounded by what the target's manifests and files expose. It SHALL NOT state or imply that every rubric indicator grades every stack, and SHALL NOT promise future stack support.

#### Scenario: The denominator is stated

- **WHEN** the stack surface renders
- **THEN** it states how many of the rubric's indicator rows have a detector in the current release, and how many of those run on a local scan

#### Scenario: Named frameworks are split by whether they can be judged

- **WHEN** the surface lists the frameworks the scanner names in a target's identity
- **THEN** each is marked as either judged for end-of-life support by the vendored dataset or named only, and the counts of both groups are derived from the manifest

#### Scenario: The page passes the public claim vocabulary

- **WHEN** the stack surface and the rubric index's stack-coverage summary are rendered and scanned against the repository's prohibited-claim vocabulary
- **THEN** neither publishes a banned phrase, a future-support promise, or an unqualified full-coverage claim

## ADDED Requirements

### Requirement: The matrix is served once, under the rubric

The site SHALL serve the capability matrix at exactly one document, `/rubric/stacks`, and SHALL NOT export a stack-coverage document at `/stacks`. A request for `/stacks` SHALL resolve through the site's not-found document; no forwarding document SHALL be exported for that path. The matrix document SHALL carry a breadcrumb back to the rubric index.

#### Scenario: The matrix has one home

- **WHEN** the static artifact is built
- **THEN** the matrix renders in the `/rubric/stacks` document and in no other exported document

#### Scenario: The retired path is not served

- **WHEN** a visitor requests `/stacks`
- **THEN** the site's not-found document renders, and no forwarding document is exported for that path

#### Scenario: The sub-route links back to the rubric

- **WHEN** the matrix document renders
- **THEN** a breadcrumb links the rubric index under the configured base path

### Requirement: The rubric index summarises stack coverage

The rubric index SHALL carry a stack-coverage section that states why the rubric is deliberately stack-agnostic, summarises the published stacks from the generated manifest, and links the matrix document. Every number in the summary SHALL be computed from the generated stack manifest at render time, and the summary SHALL carry the manifest's engine-and-dataset provenance sentence. The section SHALL NOT render the capability matrix, the framework split, or any recognised-stack row of its own.

#### Scenario: The summary matches the manifest

- **WHEN** the rubric index renders
- **THEN** its stack counts equal the values derived from the generated stack manifest, and its provenance sentence names the engine version and both dataset identifiers

#### Scenario: The summary links the matrix

- **WHEN** the static export is built
- **THEN** the summary's link targets the exported `/rubric/stacks` document and respects the configured base path

#### Scenario: No second matrix

- **WHEN** the rubric index renders
- **THEN** no recognised-stack row and no framework row appear on the index

## REMOVED Requirements

### Requirement: The rubric index hands off instead of duplicating

**Reason**: The matrix is no longer a separate top-level surface. Splitting one coverage question across two destinations — release status on the rubric index, stack capability on `/stacks` — left a handoff paragraph as the seam, and the index could not say what a stack exposes without sending the reader elsewhere.

**Migration**: The rubric index now carries a derived stack-coverage summary and links `/rubric/stacks` (see "The rubric index summarises stack coverage"). The matrix document moves under the rubric and `/stacks` is no longer exported; nothing in the site links it.
