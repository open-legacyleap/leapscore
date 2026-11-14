import type { Metadata } from "next";
import Link from "next/link";

import { STACK_MANIFEST, type StackRow } from "@/lib/generated/stacks";
import {
  advisoryCoverage,
  censusDisclosure,
  detectorCoverage,
  frameworkSplit,
  provenanceSentence,
} from "@/lib/stack-coverage";

export const metadata: Metadata = {
  title: "Stacks | LeapScore",
  description:
    "Every stack the scanner recognises, whether its dependencies are parsed, which offline evidence covers it, and exactly where grading stops.",
};

function ShapeList({ values }: { values: readonly string[] }) {
  if (values.length === 0) return null;
  return (
    <ul className="mt-1 flex flex-wrap gap-1">
      {values.map((value) => (
        <li key={value}>
          <code className="rounded border border-hairline bg-panel-raised/60 px-1.5 py-0.5 font-mono text-[11px] text-muted">
            {value}
          </code>
        </li>
      ))}
    </ul>
  );
}

function RecognitionCell({ stack }: { stack: StackRow }) {
  const {
    manifests,
    lockfiles,
    project_files: projectFiles,
    source_files: sourceFiles,
  } = stack.recognition;

  if (stack.kind === "census") {
    return (
      <div className="text-xs leading-relaxed text-muted">
        <p>Project and source files</p>
        <ShapeList values={projectFiles} />
        <ShapeList values={sourceFiles} />
      </div>
    );
  }

  return (
    <div className="text-xs leading-relaxed text-muted">
      <p>Manifests</p>
      <ShapeList values={manifests} />
      <p className="mt-1">Lockfiles</p>
      <ShapeList values={lockfiles} />
    </div>
  );
}

function DependenciesCell({ stack }: { stack: StackRow }) {
  if (!stack.dependency_parsing.parsed) {
    return (
      <div className="text-xs leading-relaxed text-muted">
        <p className="font-medium text-foreground">None — census only</p>
        <p className="mt-1">
          Dependency indicators are not applicable, not clean: the stack has no
          package manifest or lockfile to parse.
        </p>
      </div>
    );
  }
  return (
    <div className="text-xs leading-relaxed text-muted">
      <p className="font-medium text-foreground">Parsed</p>
      <p className="mt-1">
        Manifest and lockfile shapes above feed the dependency rows.
      </p>
    </div>
  );
}

function EvidenceCell({ stack }: { stack: StackRow }) {
  const evidence = stack.offline_evidence;
  return (
    <div className="space-y-1 text-xs leading-relaxed text-muted">
      <p>
        <span className="text-faint">Runtime cycles:</span>{" "}
        <span className="font-mono text-foreground tabular-nums">
          {evidence.runtime_cycles}
        </span>{" "}
        {evidence.runtime_products.map((product) => (
          <code
            key={product}
            className="mr-1 rounded border border-hairline px-1 font-mono text-[11px]"
          >
            {product}
          </code>
        ))}
      </p>
      {stack.kind === "package" ? (
        <p>
          <span className="text-faint">Package metadata:</span>{" "}
          <span className="font-mono text-foreground tabular-nums">
            {evidence.package_count}
          </span>{" "}
          package rows
        </p>
      ) : (
        <p>
          <span className="text-faint">Package metadata:</span> none — the stack
          has no package surface
        </p>
      )}
      <p>
        <span className="text-faint">Advisories:</span>{" "}
        {evidence.advisory_covered && evidence.advisory_ecosystem ? (
          <span className="text-foreground">
            covered for {evidence.advisory_ecosystem}
          </span>
        ) : (
          <span className="text-foreground">
            no advisory rows — not covered
          </span>
        )}
      </p>
    </div>
  );
}

function GradingCell({ stack }: { stack: StackRow }) {
  return (
    <div className="text-xs leading-relaxed text-muted">
      <ul className="flex flex-wrap gap-1">
        {stack.grading.indicator_ids.map((id) => (
          <li key={id}>
            <code className="rounded border border-hairline px-1.5 py-0.5 font-mono text-[11px] text-foreground">
              {id}
            </code>
          </li>
        ))}
      </ul>
      <p className="mt-1">{stack.grading.note}</p>
    </div>
  );
}

export default function StacksPage() {
  const manifest = STACK_MANIFEST;
  const advisory = advisoryCoverage(manifest);
  const frameworks = frameworkSplit(manifest);
  const detectors = detectorCoverage(manifest);
  const census = censusDisclosure(manifest);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <header>
        <p className="text-xs tracking-wider text-faint uppercase">
          Stack coverage
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          What the scanner sees
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
          Recognition, dependency parsing, offline evidence, and grading are
          four different claims with four different sources. A stack can be
          recognised without being parsed, and parsed without having advisory
          data. This page keeps them apart.
        </p>
      </header>

      <section className="mt-8" aria-labelledby="matrix-heading">
        <h2 id="matrix-heading" className="text-lg font-semibold">
          Recognised stacks
        </h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-hairline">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-panel-raised text-left text-[11px] tracking-wider text-faint uppercase">
              <tr>
                <th className="px-3 py-2 font-medium">Stack</th>
                <th className="px-3 py-2 font-medium">Recognised from</th>
                <th className="px-3 py-2 font-medium">Dependencies</th>
                <th className="px-3 py-2 font-medium">Offline evidence</th>
                <th className="px-3 py-2 font-medium">Graded</th>
              </tr>
            </thead>
            <tbody>
              {manifest.stacks.map((stack) => (
                <tr
                  key={stack.id}
                  data-stack={stack.id}
                  className="border-b border-hairline align-top last:border-0 hover:bg-panel-raised/40"
                >
                  <td className="px-3 py-3">
                    <p className="font-medium text-foreground">{stack.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-faint">
                      {stack.id}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <RecognitionCell stack={stack} />
                  </td>
                  <td className="px-3 py-3">
                    <DependenciesCell stack={stack} />
                  </td>
                  <td className="px-3 py-3">
                    <EvidenceCell stack={stack} />
                  </td>
                  <td className="px-3 py-3">
                    <GradingCell stack={stack} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-faint">
          {advisory.sentence}
        </p>
      </section>

      <section
        className="instrument-panel mt-8 rounded-lg p-4"
        aria-labelledby="provenance-heading"
      >
        <h2 id="provenance-heading" className="text-sm font-medium text-ink">
          Provenance
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          {provenanceSentence(manifest)}
        </p>
        <details className="mt-2 text-xs leading-relaxed text-faint">
          <summary className="cursor-pointer text-muted">
            Dataset selection rules
          </summary>
          <p className="mt-2">{manifest.datasets.eol.source}</p>
          <p className="mt-2">{manifest.datasets.advisory.source}</p>
        </details>
      </section>

      <section className="mt-10" aria-labelledby="frameworks-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="frameworks-heading" className="text-lg font-semibold">
            Frameworks named in a target&apos;s identity
          </h2>
          <span className="font-mono text-xs text-faint">
            {manifest.frameworks.length} named
          </span>
        </div>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          {frameworks.sentence}
        </p>
        <div className="mt-3 overflow-hidden rounded-lg border border-hairline">
          <table className="w-full text-sm">
            <thead className="bg-panel-raised text-left text-[11px] tracking-wider text-faint uppercase">
              <tr>
                <th className="px-3 py-2 font-medium">Framework</th>
                <th className="px-3 py-2 font-medium">End-of-life judgement</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">
                  Dataset key
                </th>
              </tr>
            </thead>
            <tbody>
              {manifest.frameworks.map((framework) => (
                <tr
                  key={framework.name}
                  data-framework={framework.name}
                  data-framework-judged={framework.judged ? "yes" : "no"}
                  className="border-b border-hairline last:border-0"
                >
                  <td className="px-3 py-2 font-medium text-foreground">
                    {framework.name}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {framework.judged ? (
                      <span className="text-foreground">
                        Judged for end-of-life support
                      </span>
                    ) : (
                      <span className="text-muted">
                        Named only — not judged
                      </span>
                    )}
                  </td>
                  <td className="hidden px-3 py-2 font-mono text-xs text-faint sm:table-cell">
                    {framework.dataset_key ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="instrument-panel mt-10 rounded-lg p-4"
        aria-labelledby="limits-heading"
      >
        <h2 id="limits-heading" className="text-sm font-medium text-ink">
          Where the coverage stops
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          {detectors.sentence}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Stack-specific grading is bounded by what the target&apos;s manifests
          and files expose. A stack with no lockfile yields unknown dependency
          rows, not clean ones.
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {census.sentence}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-faint">
          The rubric stays stack-agnostic: each indicator is defined over the
          artifacts a scan can read.{" "}
          <Link
            href="/rubric"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Browse the indicators
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
