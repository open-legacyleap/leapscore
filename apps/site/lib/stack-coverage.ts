/**
 * Derived sentences over the generated stack manifest (design D4).
 *
 * Every count and split on `/rubric/stacks` and in the rubric index summary
 * comes from here or from the manifest directly; neither surface types a stack
 * count, a dataset identifier, or an advisory coverage number. Keeping the
 * derivations in one module lets the guard suite assert the same numbers the
 * surfaces render.
 */
import {
  STACK_MANIFEST,
  type FrameworkRow,
  type StackManifest,
  type StackRow,
} from "./generated/stacks";

/** Package ecosystems — the stacks with a dependency surface. */
export function packageStacks(
  manifest: StackManifest = STACK_MANIFEST,
): StackRow[] {
  return manifest.stacks.filter((stack) => stack.kind === "package");
}

/** Census-only stacks — recognised, but with no dependency surface. */
export function censusStacks(
  manifest: StackManifest = STACK_MANIFEST,
): StackRow[] {
  return manifest.stacks.filter((stack) => stack.kind === "census");
}

export type AdvisoryCoverage = {
  covered: number;
  total: number;
  sentence: string;
};

/** How many package ecosystems carry advisory rows in the vendored dataset. */
export function advisoryCoverage(
  manifest: StackManifest = STACK_MANIFEST,
): AdvisoryCoverage {
  const packages = packageStacks(manifest);
  const covered = packages.filter(
    (stack) => stack.offline_evidence.advisory_covered,
  ).length;
  return {
    covered,
    total: packages.length,
    sentence: `Advisory data covers ${covered} of ${packages.length} package ecosystems. The rest carry package metadata but no advisory rows, so a clean vulnerability result is not implied for them.`,
  };
}

export type FrameworkSplit = {
  judged: FrameworkRow[];
  namedOnly: FrameworkRow[];
  sentence: string;
};

/** The identity frameworks split by whether the EOL dataset judges them. */
export function frameworkSplit(
  manifest: StackManifest = STACK_MANIFEST,
): FrameworkSplit {
  const judged = manifest.frameworks.filter((framework) => framework.judged);
  const namedOnly = manifest.frameworks.filter(
    (framework) => !framework.judged,
  );
  return {
    judged,
    namedOnly,
    sentence: `${judged.length} of the ${manifest.frameworks.length} named frameworks are judged for end-of-life support by the vendored dataset; the other ${namedOnly.length} are named only.`,
  };
}

export type DetectorCoverage = {
  total: number;
  local: number;
  rubricTotal: number;
  sentence: string;
};

/** The release's detector denominator, as the manifest stamps it. */
export function detectorCoverage(
  manifest: StackManifest = STACK_MANIFEST,
): DetectorCoverage {
  const { total, local, rubric_total: rubricTotal } = manifest.detection;
  return {
    total,
    local,
    rubricTotal,
    sentence: `This release ships a detector for ${total} of the ${rubricTotal} indicator rows; ${local} of those run on a local scan.`,
  };
}

/** The census-only disclosure: no dependency surface, so no dependency score. */
export function censusDisclosure(manifest: StackManifest = STACK_MANIFEST): {
  stacks: StackRow[];
  sentence: string;
} {
  const stacks = censusStacks(manifest);
  return {
    stacks,
    sentence:
      stacks.length === 0
        ? "No stack in this manifest is census-only."
        : `${stacks
            .map((stack) => stack.name)
            .join(
              " and ",
            )} are recognised from project and source files only. They have no dependency surface: dependency indicators are not applicable, not clean.`,
  };
}

export type StackCoverageSummary = {
  /** Every stack the manifest publishes, split by dependency surface. */
  stacks: { total: number; package: number; census: number };
  /** Advisory coverage over the package ecosystems. */
  advisory: { covered: number; total: number };
  /** Identity frameworks split by whether the EOL dataset judges them. */
  frameworks: { total: number; judged: number; namedOnly: number };
};

/**
 * The headline values the rubric index states, all derived from the manifest
 * (design D3). The index renders these numbers and nothing it typed itself.
 */
export function stackCoverageSummary(
  manifest: StackManifest = STACK_MANIFEST,
): StackCoverageSummary {
  const advisory = advisoryCoverage(manifest);
  const frameworks = frameworkSplit(manifest);
  return {
    stacks: {
      total: manifest.stacks.length,
      package: packageStacks(manifest).length,
      census: censusStacks(manifest).length,
    },
    advisory: { covered: advisory.covered, total: advisory.total },
    frameworks: {
      total: frameworks.judged.length + frameworks.namedOnly.length,
      judged: frameworks.judged.length,
      namedOnly: frameworks.namedOnly.length,
    },
  };
}

/** Engine and dataset provenance, rendered on every count-bearing surface. */
export function provenanceSentence(
  manifest: StackManifest = STACK_MANIFEST,
): string {
  const { engine_version: engine, datasets } = manifest;
  return `Engine ${engine}; end-of-life dataset ${datasets.eol.id} (data date ${datasets.eol.data_date}); advisory dataset ${datasets.advisory.id} (data date ${datasets.advisory.data_date}).`;
}
