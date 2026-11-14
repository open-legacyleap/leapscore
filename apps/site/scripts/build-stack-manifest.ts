/**
 * Generate `lib/generated/stacks.ts` from the shipped recognition tables and
 * vendored datasets (design D1/D3).
 *
 * Membership is derived, never authored: package ecosystems come from the
 * end-of-life dataset's package buckets and the scanner's manifest patterns,
 * census stacks come from the scanner's extension sets, and the framework rows
 * come from the identity signatures. The few mappings that cannot be derived
 * (runtime product → stack, framework name → dataset key) are declared here and
 * guarded: an unmapped runtime, framework signature, package ecosystem, or
 * advisory ecosystem fails the build with the offending name instead of
 * publishing a silently incomplete matrix.
 *
 * Runs as the package `prebuild` step and can be run by hand:
 *
 *   ./node_modules/.bin/tsx scripts/build-stack-manifest.ts
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PATTERNS } from "../../scanner/src/scan/ecosystem";
import { FRAMEWORK_SIGNATURES } from "../../scanner/src/scan/identity";
import { LOCAL_IDS } from "../../scanner/src/scan/local";
import { DELPHI_EXTS, VB6_EXTS } from "../../scanner/src/scan/stackcensus";
import { mapDetectorFiles } from "./build-coverage-manifest";

const SITE = join(import.meta.dirname, "..");
const SCANNER = join(SITE, "..", "scanner");
const EOL_JSON = join(SCANNER, "src", "scan", "snapshots", "eol.json");
const ADVISORY_JSON = join(
  SCANNER,
  "src",
  "scan",
  "snapshots",
  "advisories.json",
);
const SCANNER_PACKAGE = join(SCANNER, "package.json");
const RUBRIC_JSON = join(SCANNER, "src", "scan", "scoring", "rubric.json");
const DETECTORS_DIR = join(SCANNER, "src", "scan", "detectors");

export type StackId =
  | "js"
  | "py"
  | "go"
  | "rust"
  | "java"
  | "ruby"
  | "php"
  | "csharp"
  | "vb6"
  | "delphi";

export type StackKind = "package" | "census";

export type StackRecognition = {
  manifests: string[];
  lockfiles: string[];
  project_files: string[];
  source_files: string[];
};

export type StackOfflineEvidence = {
  runtime_products: string[];
  runtime_cycles: number;
  package_count: number;
  advisory_ecosystem: string | null;
  advisory_covered: boolean;
};

export type StackGrading = {
  indicator_ids: string[];
  note: string;
};

export type StackRow = {
  id: StackId;
  name: string;
  kind: StackKind;
  recognition: StackRecognition;
  dependency_parsing: { parsed: boolean };
  offline_evidence: StackOfflineEvidence;
  grading: StackGrading;
};

export type FrameworkRow = {
  name: string;
  dataset_key: string | null;
  judged: boolean;
};

export type StackDataset = {
  id: string;
  data_date: string;
  source: string;
};

export type StackManifest = {
  engine_version: string;
  datasets: { eol: StackDataset; advisory: StackDataset };
  detection: { total: number; local: number; rubric_total: number };
  stacks: StackRow[];
  frameworks: FrameworkRow[];
};

type EolDoc = {
  version: string;
  data_date: string;
  source: string;
  runtimes: Record<string, { cycles: unknown[] }>;
  frameworks: Record<string, unknown>;
  packages: Record<string, Record<string, unknown>>;
};

type AdvisoryDoc = {
  version: string;
  data_date: string;
  source: string;
  advisories: Array<{ ecosystem: string }>;
};

/** Publication order, package ecosystems first, census stacks last. */
const STACK_ORDER: readonly StackId[] = [
  "js",
  "py",
  "go",
  "rust",
  "java",
  "ruby",
  "php",
  "csharp",
  "vb6",
  "delphi",
];

const STACK_NAMES: Record<StackId, string> = {
  js: "JavaScript / TypeScript",
  py: "Python",
  go: "Go",
  rust: "Rust",
  java: "Java",
  ruby: "Ruby",
  php: "PHP",
  csharp: "C# / .NET",
  vb6: "Visual Basic 6",
  delphi: "Delphi",
};

/**
 * Runtime products that the end-of-life dataset carries, mapped to the stack
 * they belong to. `.NET Framework` (`dotnetfx`) is the same published stack as
 * `dotnet`.
 */
const RUNTIME_STACK: Record<string, StackId> = {
  node: "js",
  python: "py",
  go: "go",
  java: "java",
  ruby: "ruby",
  php: "php",
  dotnet: "csharp",
  dotnetfx: "csharp",
  vb6: "vb6",
  delphi: "delphi",
};

/**
 * Identity framework names mapped to the end-of-life dataset's key. `null` is a
 * deliberate declaration that the dataset does not judge the framework — the
 * page renders it as "named only", never as supported or clear.
 */
const FRAMEWORK_DATASET_KEY: Record<string, string | null> = {
  React: "react",
  "Next.js": "next",
  Vue: "vue",
  Svelte: "svelte",
  Angular: "angular",
  Express: "express",
  Fastify: null,
  Koa: null,
  NestJS: "nestjs",
  Django: "django",
  Flask: "flask",
  FastAPI: "fastapi",
  Spring: "spring-boot",
  Rails: "rails",
  Laravel: "laravel",
  Gin: "gin",
  Actix: null,
  Axum: null,
  "ASP.NET": "aspnet",
  "Entity Framework": "entityframework",
  Hibernate: null,
};

/** The .NET discovery shapes are the one package surface `PATTERNS` does not carry. */
const DOTNET_RECOGNITION = {
  manifests: [
    "*.sln",
    "*.csproj",
    "*.vbproj",
    "packages.config",
    "Directory.Packages.props",
    "global.json",
  ],
  lockfiles: ["packages.lock.json"],
};

/** Census project-file extensions, declared so "project" and "source" stay distinct. */
const CENSUS_PROJECT_FILES: Record<"vb6" | "delphi", readonly string[]> = {
  vb6: [".vbp"],
  delphi: [".dpr", ".dproj", ".dof"],
};

const PACKAGE_INDICATORS = [
  "ECOS-01",
  "ECOS-02",
  "ECOS-03",
  "ECOS-05",
  "ECOS-06",
  "ECOS-07",
  "ECOS-08",
];

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function assertKnownPackageEcosystems(
  packageEcosystems: readonly string[],
  advisoryEcosystems: readonly string[],
): void {
  const known = new Set(packageEcosystems);
  for (const ecosystem of advisoryEcosystems) {
    if (!known.has(ecosystem)) {
      throw new Error(
        `advisory dataset carries ecosystem ${ecosystem} outside the known package set (${[...known].sort().join(", ")}) — declare the stack mapping before publishing the matrix`,
      );
    }
  }
}

function buildStacks(
  eol: EolDoc,
  advisoryEcosystems: readonly string[],
): StackRow[] {
  const packageEcosystems = Object.keys(eol.packages).sort();
  const advisoryCovered = new Set(advisoryEcosystems);

  for (const ecosystem of packageEcosystems) {
    if (!STACK_ORDER.includes(ecosystem as StackId)) {
      throw new Error(
        `end-of-life dataset carries package ecosystem ${ecosystem} with no declared stack row — add it to STACK_ORDER and name it before publishing the matrix`,
      );
    }
  }

  for (const product of Object.keys(eol.runtimes)) {
    if (!(product in RUNTIME_STACK)) {
      throw new Error(
        `end-of-life dataset carries runtime product ${product} with no declared stack mapping — add it to RUNTIME_STACK before publishing the matrix`,
      );
    }
  }

  for (const [product, stack] of Object.entries(RUNTIME_STACK)) {
    if (!STACK_ORDER.includes(stack)) {
      throw new Error(
        `runtime mapping ${product} → ${stack} names an unknown stack — every mapped stack must appear in STACK_ORDER`,
      );
    }
  }

  return STACK_ORDER.map((id) => {
    const kind: StackKind =
      id === "vb6" || id === "delphi" ? "census" : "package";
    const runtimeProducts = Object.keys(eol.runtimes)
      .filter((product) => RUNTIME_STACK[product] === id)
      .sort();
    const runtimeCycles = runtimeProducts.reduce(
      (total, product) => total + eol.runtimes[product].cycles.length,
      0,
    );
    const packageCount =
      kind === "package" ? Object.keys(eol.packages[id] ?? {}).length : 0;
    const advisoryEcosystem = kind === "package" ? id : null;
    const isAdvisoryCovered =
      advisoryEcosystem !== null && advisoryCovered.has(advisoryEcosystem);

    let recognition: StackRecognition;
    if (kind === "package") {
      const patterns =
        id === "csharp"
          ? []
          : PATTERNS.filter((pattern) => pattern.ecosystem === id);
      const manifests =
        id === "csharp"
          ? DOTNET_RECOGNITION.manifests
          : uniqueSorted(patterns.map((pattern) => pattern.manifest));
      const lockfiles =
        id === "csharp"
          ? DOTNET_RECOGNITION.lockfiles
          : uniqueSorted(patterns.map((pattern) => pattern.lockfile));
      recognition = {
        manifests,
        lockfiles,
        project_files: [],
        source_files: [],
      };
    } else {
      const censusId = id as "vb6" | "delphi";
      const extensionSet = censusId === "vb6" ? VB6_EXTS : DELPHI_EXTS;
      const projectFiles = CENSUS_PROJECT_FILES[censusId];
      for (const extension of projectFiles) {
        if (!extensionSet.has(extension)) {
          throw new Error(
            `census project extension ${extension} is not in the ${id} extension set — the recognition table and project-file declaration disagree`,
          );
        }
      }
      const extensions = uniqueSorted([...extensionSet]);
      recognition = {
        manifests: [],
        lockfiles: [],
        project_files: [...projectFiles].sort(),
        source_files: extensions.filter(
          (extension) => !projectFiles.includes(extension),
        ),
      };
    }

    const indicatorIds =
      kind === "census"
        ? ["ECOS-01"]
        : [
            ...PACKAGE_INDICATORS,
            ...(isAdvisoryCovered ? ["SEC-01", "SEC-06"] : []),
          ];

    return {
      id,
      name: STACK_NAMES[id],
      kind,
      recognition,
      dependency_parsing: { parsed: kind === "package" },
      offline_evidence: {
        runtime_products: runtimeProducts,
        runtime_cycles: runtimeCycles,
        package_count: packageCount,
        advisory_ecosystem: advisoryEcosystem,
        advisory_covered: isAdvisoryCovered,
      },
      grading: {
        indicator_ids: indicatorIds,
        note:
          kind === "census"
            ? "Runtime toolchain end-of-life only; dependency indicators are not applicable — the stack has no package manifest."
            : isAdvisoryCovered
              ? "Runtime, package, lockfile, and advisory evidence."
              : "Runtime, package, and lockfile evidence; no advisory rows exist for this ecosystem.",
      },
    };
  });
}

function buildFrameworks(eol: EolDoc): FrameworkRow[] {
  const names = FRAMEWORK_SIGNATURES.map((signature) => signature.name);

  for (const name of names) {
    if (!(name in FRAMEWORK_DATASET_KEY)) {
      throw new Error(
        `identity framework signature ${name} has no declared dataset mapping — map it to an end-of-life key or declare it named-only before publishing the split`,
      );
    }
  }
  for (const name of Object.keys(FRAMEWORK_DATASET_KEY)) {
    if (!names.includes(name)) {
      throw new Error(
        `framework mapping ${name} names a signature the identity table does not carry — remove it or update FRAMEWORK_SIGNATURES`,
      );
    }
  }

  return names.map((name) => {
    const datasetKey = FRAMEWORK_DATASET_KEY[name];
    if (datasetKey !== null && !(datasetKey in eol.frameworks)) {
      throw new Error(
        `framework ${name} maps to dataset key ${datasetKey}, which the end-of-life dataset does not carry — fix the mapping before publishing the split`,
      );
    }
    return { name, dataset_key: datasetKey, judged: datasetKey !== null };
  });
}

/** The manifest object, derived from the live datasets and recognition tables. */
export function buildStackManifestData(): StackManifest {
  const eol = readJson<EolDoc>(EOL_JSON);
  const advisory = readJson<AdvisoryDoc>(ADVISORY_JSON);
  const scanner = readJson<{ version?: string }>(SCANNER_PACKAGE);
  const rubric = readJson<{ indicators?: unknown[] }>(RUBRIC_JSON);

  if (!scanner.version)
    throw new Error(`${SCANNER_PACKAGE} carries no engine version`);
  if (!rubric.indicators?.length)
    throw new Error(`${RUBRIC_JSON} carries no indicator rows`);

  const advisoryEcosystems = uniqueSorted(
    advisory.advisories.map((entry) => entry.ecosystem.trim().toLowerCase()),
  );
  assertKnownPackageEcosystems(
    Object.keys(eol.packages).sort(),
    advisoryEcosystems,
  );

  const stacks = buildStacks(eol, advisoryEcosystems);
  const frameworks = buildFrameworks(eol);

  const rubricIds = new Set(
    (rubric.indicators as Array<{ id?: string }>).map((row) => row.id),
  );
  for (const stack of stacks) {
    for (const id of stack.grading.indicator_ids) {
      if (!rubricIds.has(id)) {
        throw new Error(
          `stack ${stack.id} grades ${id}, which is not a rubric row — fix the grading list`,
        );
      }
    }
  }

  const detectorIds = mapDetectorFiles(readdirSync(DETECTORS_DIR));

  return {
    engine_version: scanner.version,
    datasets: {
      eol: {
        id: eol.version,
        data_date: eol.data_date,
        source: eol.source,
      },
      advisory: {
        id: advisory.version,
        data_date: advisory.data_date,
        source: advisory.source,
      },
    },
    detection: {
      total: detectorIds.length,
      local: LOCAL_IDS.length,
      rubric_total: rubric.indicators.length,
    },
    stacks,
    frameworks,
  };
}

const TYPES = `export type StackId =
  | "js"
  | "py"
  | "go"
  | "rust"
  | "java"
  | "ruby"
  | "php"
  | "csharp"
  | "vb6"
  | "delphi";

export type StackKind = "package" | "census";

export type StackRecognition = {
  manifests: string[];
  lockfiles: string[];
  project_files: string[];
  source_files: string[];
};

export type StackOfflineEvidence = {
  runtime_products: string[];
  runtime_cycles: number;
  package_count: number;
  advisory_ecosystem: string | null;
  advisory_covered: boolean;
};

export type StackGrading = {
  indicator_ids: string[];
  note: string;
};

export type StackRow = {
  id: StackId;
  name: string;
  kind: StackKind;
  recognition: StackRecognition;
  dependency_parsing: { parsed: boolean };
  offline_evidence: StackOfflineEvidence;
  grading: StackGrading;
};

export type FrameworkRow = {
  name: string;
  dataset_key: string | null;
  judged: boolean;
};

export type StackDataset = {
  id: string;
  data_date: string;
  source: string;
};

export type StackManifest = {
  engine_version: string;
  datasets: { eol: StackDataset; advisory: StackDataset };
  detection: { total: number; local: number; rubric_total: number };
  stacks: StackRow[];
  frameworks: FrameworkRow[];
};
`;

/** The generated module's source for a manifest. */
export function stackManifestSource(manifest: StackManifest): string {
  return `// Generated by scripts/build-stack-manifest.ts — do not hand-edit.
// Sources: the vendored end-of-life and advisory datasets, the scanner's
// recognition tables, the identity framework signatures, and the scanner
// package version.
${TYPES}
export const STACK_MANIFEST: StackManifest = ${JSON.stringify(manifest, null, 2)};
`;
}

/** Build the generated module's source from the live inputs. */
export function buildStackManifest(): string {
  return stackManifestSource(buildStackManifestData());
}

function main(): void {
  const source = buildStackManifest();
  const generatedDir = join(SITE, "lib", "generated");
  mkdirSync(generatedDir, { recursive: true });
  writeFileSync(join(generatedDir, "stacks.ts"), source);
  const manifest = buildStackManifestData();
  console.log(
    `stack-manifest: wrote lib/generated/stacks.ts (${manifest.stacks.length} stack(s), ${manifest.frameworks.length} framework(s))`,
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
