# Stack coverage

This document defines what "covered" means for a stack. It owns the vocabulary
and the rules; the site's `/stacks` surface owns the numbers. Every count,
dataset identifier, and framework split on that surface is generated from
[`apps/site/lib/generated/stacks.ts`](../apps/site/lib/generated/stacks.ts) by
[`build-stack-manifest.ts`](../apps/site/scripts/build-stack-manifest.ts), not
typed into this file.

## The capability layers

A stack can be recognised without being parsed, and parsed without having
offline evidence. The manifest keeps these claims separate:

- **Recognition** — the files that make the scanner classify a target as this
  stack. Package ecosystems are recognised from their manifest and lockfile
  shapes; census-only stacks are recognised from project and source files.
- **Dependency parsing** — whether the scanner reads a package manifest and
  lockfile to build a dependency graph. A stack with no package manager has no
  dependency surface.
- **Offline evidence** — the vendored runtime cycles, package metadata, and
  advisory rows available without a network call. Absence is stated, never
  treated as a clean result.
- **Grading** — the rubric rows that can actually be evaluated for the stack.
  A row that cannot be evaluated is `not_applicable` or `unknown`, never a
  silent pass.

## The census-only rule

VB6 and Delphi have no package manager. They are recognised as stacks from
project and source files, and the census is a separate signal that is never
reported as a dependency manifest. Their dependency indicators are
**not applicable**, not clean: there is no lockfile or package graph to parse.
The `/stacks` surface marks these rows as census-only and states the absence
explicitly.

## The provenance rule

Every count or support statement on the stack surface carries the engine
version and the identifiers of the datasets that produced it. Prose does not
hard-code a count that the manifest already carries. A dataset refresh is
expected to move the published numbers with no page edit; a stale committed
manifest fails the repository's freshness check.

The inputs are the vendored datasets and the scanner's recognition tables:

- [End-of-life dataset](../apps/scanner/src/scan/snapshots/eol.json) — runtime
  cycles, framework support status, and package metadata.
- [Advisory dataset](../apps/scanner/src/scan/snapshots/advisories.json) —
  pinned advisory rows for the package ecosystems it covers.
- [Snapshot guide](../apps/scanner/src/scan/snapshots/README.md) — how the
  vendored data is selected and refreshed.
- [Stack manifest generator](../apps/site/scripts/build-stack-manifest.ts) —
  the single writer of the generated view.

## Published stacks

Each identifier below is a row in the generated manifest. The display name is
the one the surface renders.

| Identifier | Stack | Surface |
|---|---|---|
| `js` | JavaScript / TypeScript | package manifest and lockfile |
| `py` | Python | package manifest and lockfile |
| `go` | Go | package manifest and lockfile |
| `rust` | Rust | package manifest and lockfile |
| `java` | Java | package manifest and lockfile |
| `ruby` | Ruby | package manifest and lockfile |
| `php` | PHP | package manifest and lockfile |
| `csharp` | C# / .NET | project files, package manifest, and lockfile |
| `vb6` | Visual Basic 6 | census only — project and source files |
| `delphi` | Delphi | census only — project and source files |

The framework names the scanner reads from a target's identity are a separate
split: each is either judged for end-of-life support by the vendored dataset or
marked as named only. That split, and the advisory coverage of each package
ecosystem, are rendered from the same manifest and are not restated here.
