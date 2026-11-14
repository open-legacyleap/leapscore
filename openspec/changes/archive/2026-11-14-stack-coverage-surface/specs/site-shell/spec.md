## MODIFIED Requirements

### Requirement: Header without engine pill

The header SHALL render the brand mark plus exactly 4 nav links (`Samples`, `Stacks`, `Method`, `Rubric`) in that order, without an "engine: coming" pill, and SHALL NOT link to a live-scan surface or a run-history surface.

#### Scenario: Header renders clean

- **WHEN** any page renders `SiteHeader`
- **THEN** the nav shows exactly the samples, stacks, method, and rubric links in that order and no element containing "engine: coming" is in the DOM

#### Scenario: Header offers no live or history entry

- **WHEN** any page renders `SiteHeader`
- **THEN** no nav link resolves to a live-scan path or a run-history path

#### Scenario: The stacks entry resolves

- **WHEN** a visitor follows the header's stacks link
- **THEN** it resolves to the exported stack-coverage surface, not to a rubric category or a sample
