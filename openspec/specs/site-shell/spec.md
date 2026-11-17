## Purpose

Global site chrome — header navigation and interactive affordance that is consistent across all pages.

## Requirements

### Requirement: Header offers no engine pill or unshipped entry

The header SHALL render the brand mark, without an "engine: coming" pill, and SHALL NOT link to a live-scan surface or a run-history surface. The navigable roster and its responsive arrangement are governed by the header-roster requirement.

#### Scenario: Header renders clean

- **WHEN** any page renders `SiteHeader`
- **THEN** the brand mark is present and no element containing "engine: coming" is in the DOM

#### Scenario: Header offers no live or history entry

- **WHEN** any page renders `SiteHeader`
- **THEN** no nav link resolves to a live-scan path or a run-history path

### Requirement: Header roster and responsive rows

The header SHALL render exactly five navigation targets: three reading links — `Samples`, `Method`, `Rubric` — in that order, and two utilities: `GitHub`, a static anchor to the public repository, and `$0 Assessment`, a link to the site's `/assessment` document. The header SHALL NOT render a `Stacks` entry and SHALL NOT link any path to `/stacks`.

Every header link SHALL use the same plain muted treatment. No header link SHALL be rendered as a bordered, filled, or pill-shaped call to action.

The three reading links SHALL form one navigation group and the two utilities SHALL form a second group. Below the `sm` breakpoint the header SHALL render two rows — the brand mark and the two utilities on the first row, the three reading links on the second — and at `sm` and above it SHALL render a single row. The reading links SHALL precede the utilities in document order in both arrangements, so visual order and focus order agree.

#### Scenario: Desktop roster

- **WHEN** the header renders at `sm` and above
- **THEN** one row shows the brand mark, Samples, Method, Rubric, GitHub, and $0 Assessment, with the reading links before the utilities in document order

#### Scenario: Narrow viewport renders two rows

- **WHEN** the header renders below the `sm` breakpoint
- **THEN** the brand mark, GitHub, and $0 Assessment occupy the first row and Samples, Method, and Rubric occupy the second, with no item clipped or scrolled out of reach

#### Scenario: The assessment link is the site route and carries no campaign

- **WHEN** a visitor follows `$0 Assessment`
- **THEN** the link resolves to the exported `/assessment` document under the configured base path, with no query parameters

#### Scenario: The stacks entry is gone

- **WHEN** any page renders the header
- **THEN** no header link is labelled `Stacks` and no header link resolves to `/stacks`

### Requirement: Interactive affordances show pointer cursor

Every `<button>`, `[role=button]`, and interactive summary/accordion trigger SHALL show `cursor: pointer` on hover.

#### Scenario: Collapsible triggers show hand

- **WHEN** hovering an accordion or collapsible trigger on the rubric or sample surfaces
- **THEN** computed style `cursor` is `pointer`

#### Scenario: Sample gallery actions show hand

- **WHEN** hovering a control on a sample gallery row or a sample detail page
- **THEN** cursor is `pointer`

### Requirement: Public source is reachable from the site

The site SHALL link the public repository at `https://github.com/open-legacyleap/leapscore` from the header and the footer of every page, and from any surface that asserts an open-source licence or an auditability claim. The link SHALL be a static anchor in the exported artifact: no client-side fetch, no GitHub API call, and no repository-derived data rendered at build time. The header anchor SHALL be labelled `GitHub`; the footer anchor SHALL be labelled so a reader can tell it opens the source.

#### Scenario: Footer renders the source link

- **WHEN** any page that renders `Footer` is exported
- **THEN** the document contains an anchor whose `href` is exactly `https://github.com/open-legacyleap/leapscore`, labelled so a reader can tell it opens the source

#### Scenario: Header renders the source link

- **WHEN** any page renders `SiteHeader`
- **THEN** the header contains exactly one anchor whose `href` is exactly `https://github.com/open-legacyleap/leapscore`, labelled `GitHub`

#### Scenario: An open-source claim is checkable in place

- **WHEN** a surface states the licence or invites the reader to audit the method
- **THEN** that surface links the same repository URL, or links a page that does

#### Scenario: The link is static

- **WHEN** the exported artifact is inspected
- **THEN** no request to `api.github.com` or any other repository host appears in the served graph, and no rendered value depends on network state

### Requirement: Footer navigation roster

The footer SHALL render the site routes `Samples`, `Method`, and `Rubric`, the public contact address, and the public repository link. It SHALL NOT render a `Stacks` link and SHALL NOT link any path to `/stacks`.

#### Scenario: Footer drops the stacks link

- **WHEN** any page that renders `Footer` is exported
- **THEN** the footer carries no anchor to `/stacks` and no link labelled `Stacks`
