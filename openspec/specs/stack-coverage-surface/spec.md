# stack-coverage-surface Specification

## Purpose
Publishes what the scanner can actually see and grade — one generated matrix over the ten recognised stacks — so a legacy-estate reader can tell whether their stack is recognised, what evidence backs it, and exactly where coverage stops, without the site hand-typing a support list that drifts from the engine.

## Requirements

### Requirement: The coverage matrix is derived, never authored

The site SHALL publish stack membership and stack counts only from a build-generated manifest derived from the vendored reference datasets, the scanner's recognition tables, and the scanner package version. Hand-authored copy SHALL NOT introduce a stack, a count, or a dataset identity.

#### Scenario: Manifest matches its inputs at build time

- **WHEN** the site build runs its manifest generator
- **THEN** every stack row, runtime cycle count, package count, advisory count, and dataset identifier in the committed manifest equals the value derived from the vendored datasets and recognition tables, and no row is carried over from a previous generation

#### Scenario: An unmapped runtime fails the build

- **WHEN** the end-of-life dataset gains a runtime product that the generator has no declared stack mapping for
- **THEN** generation fails with the unmapped product named, rather than publishing a matrix that silently omits it

#### Scenario: An unmapped framework signature fails the build

- **WHEN** the identity framework signature list gains a name that the generator has no declared dataset mapping for
- **THEN** generation fails with the unmapped name, rather than publishing the framework split with a missing row

#### Scenario: A dataset refresh moves the numbers alone

- **WHEN** the vendored datasets are refreshed and the manifest regenerated
- **THEN** the published counts and dataset identifiers change with no edit to page copy, and a stale committed manifest fails the repository's freshness check

### Requirement: Every recognised stack is published with its capability layers

The stack surface SHALL render one row per recognised stack, stating four independently sourced layers: the files that make the stack recognisable, whether its dependencies are parsed, the offline evidence available for it, and what can be graded on it. A census-only stack SHALL be identified as having no dependency surface and SHALL NOT be presented as partially parsed.

#### Scenario: A package ecosystem row states its evidence chain

- **WHEN** the surface renders a stack with a package manager
- **THEN** the row names the manifest and lockfile shapes it is recognised from, the runtime products and package counts the offline datasets carry for it, and whether advisory data exists for its ecosystem

#### Scenario: A census-only stack is disclosed as such

- **WHEN** the surface renders VB6 or Delphi
- **THEN** the row states that recognition comes from project and source files, that no dependency parsing exists, and that dependency indicators are not applicable rather than clean

#### Scenario: An ecosystem without advisory data is marked uncovered

- **WHEN** a package ecosystem has package metadata but no advisories in the vendored dataset
- **THEN** the row marks it as having no vulnerability coverage, and the surface does not imply a clean vulnerability result for it

### Requirement: Coverage claims carry dataset and engine provenance

Every count or support statement on the stack surface SHALL render the engine version and the identifiers of the datasets that produced it. A count SHALL NOT appear without that provenance, and prose SHALL NOT hard-code a count that the manifest already carries.

#### Scenario: The surface is provenance-stamped

- **WHEN** the stack surface renders
- **THEN** it names the engine version, the end-of-life dataset identifier, and the advisory dataset identifier, each taken from the generated manifest

#### Scenario: Prose counts come from the manifest

- **WHEN** the surface summarises how many ecosystems carry advisory data, or how many frameworks are judged for end-of-life support
- **THEN** each number is computed from the manifest at render time rather than typed into the page

### Requirement: The stack surface does not overclaim

The surface SHALL state the detector denominator for the current release and SHALL state that stack-specific grading is bounded by what the target's manifests and files expose. It SHALL NOT state or imply that every rubric indicator grades every stack, and SHALL NOT promise future stack support.

#### Scenario: The denominator is stated

- **WHEN** the stack surface renders
- **THEN** it states how many of the rubric's indicator rows have a detector in the current release, and how many of those run on a local scan

#### Scenario: Named frameworks are split by whether they can be judged

- **WHEN** the surface lists the frameworks the scanner names in a target's identity
- **THEN** each is marked as either judged for end-of-life support by the vendored dataset or named only, and the counts of both groups are derived from the manifest

#### Scenario: The page passes the public claim vocabulary

- **WHEN** the stack surface and the rubric handoff section are rendered and scanned against the repository's prohibited-claim vocabulary
- **THEN** neither publishes a banned phrase, a future-support promise, or an unqualified full-coverage claim

### Requirement: The rubric index hands off instead of duplicating

The rubric index SHALL carry a section that explains why the rubric is deliberately stack-agnostic and links to the stack surface. It SHALL NOT render its own copy of the capability matrix.

#### Scenario: The handoff section exists

- **WHEN** the rubric index renders
- **THEN** it contains a section naming the stack-agnostic indicators, a link to the stack surface, and no matrix table of its own

#### Scenario: The link resolves in the exported artifact

- **WHEN** the static export is built
- **THEN** the handoff link targets an exported document and respects the site's configured base path

### Requirement: The authored document and the manifest agree

The repository SHALL carry an authored document stating what the four capability layers mean and naming every stack the manifest publishes. The document SHALL NOT be the source of a published count. A test SHALL fail when a stack published by the manifest is absent from the document.

#### Scenario: Every manifest stack is documented

- **WHEN** the test suite runs against the generated manifest
- **THEN** every stack identifier in the manifest appears in the authored document, and a stack added to the manifest without a document update fails the suite

#### Scenario: The document states the layer definitions

- **WHEN** a reader opens the document
- **THEN** it defines recognition, dependency parsing, offline evidence, and grading, and points to the vendored datasets and the stack surface rather than restating their values
