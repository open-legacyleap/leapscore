## ADDED Requirements

### Requirement: The rubric namespace carries one non-category coverage sub-route

The rubric namespace SHALL expose exactly one document under `/rubric` that is neither a category index nor an indicator document: the stack-coverage document at `/rubric/stacks`. That path SHALL be a static document, SHALL NOT be consumed as a category or indicator identifier, and SHALL NOT change the set of category or indicator documents the artifact exports.

#### Scenario: The sub-route is its own document

- **WHEN** the artifact is built
- **THEN** `/rubric/stacks` resolves to the stack-coverage document rather than a category page, an indicator page, or the not-found document

#### Scenario: Category and indicator documents are unchanged

- **WHEN** the artifact is built
- **THEN** the exported category documents are exactly the ten categories, and the indicator documents are exactly the rows of the compiled registry

#### Scenario: Index and sub-route link each other

- **WHEN** the rubric index or the stack-coverage document renders
- **THEN** each links the other, and both links resolve under the configured base path
