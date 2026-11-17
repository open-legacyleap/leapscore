import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

import { StackCoverage } from "@/components/stack-coverage";
import { STACK_MANIFEST } from "@/lib/generated/stacks";
import { PATTERNS } from "../../scanner/src/scan/ecosystem";
import { FRAMEWORK_SIGNATURES } from "../../scanner/src/scan/identity";
import { DELPHI_EXTS, VB6_EXTS } from "../../scanner/src/scan/stackcensus";
import {
  advisoryCoverage,
  censusDisclosure,
  detectorCoverage,
  frameworkSplit,
  stackCoverageSummary,
} from "@/lib/stack-coverage";
import {
  buildStackManifest,
  buildStackManifestData,
} from "../scripts/build-stack-manifest";

const SITE = process.cwd();
const SCANNER = join(SITE, "..", "scanner");
const DOCS = join(SITE, "..", "..", "docs", "stack-coverage.md");

type EolDoc = {
  runtimes: Record<string, { cycles: unknown[] }>;
  frameworks: Record<string, unknown>;
  packages: Record<string, Record<string, unknown>>;
};

type AdvisoryDoc = { advisories: Array<{ ecosystem: string }> };

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("stack coverage manifest", () => {
  it("matches a fresh generation byte for byte", () => {
    const committed = readFileSync(
      join(SITE, "lib", "generated", "stacks.ts"),
      "utf-8",
    );
    expect(committed).toBe(buildStackManifest());
  });

  it("matches the vendored datasets and recognition tables", () => {
    const eol = readJson<EolDoc>(
      join(SCANNER, "src", "scan", "snapshots", "eol.json"),
    );
    const advisory = readJson<AdvisoryDoc>(
      join(SCANNER, "src", "scan", "snapshots", "advisories.json"),
    );
    const advisoryEcosystems = new Set(
      advisory.advisories.map((row) => row.ecosystem.trim().toLowerCase()),
    );

    for (const stack of STACK_MANIFEST.stacks) {
      const products = stack.offline_evidence.runtime_products;
      for (const product of products) {
        expect(
          eol.runtimes[product],
          `${stack.id} names unknown runtime ${product}`,
        ).toBeDefined();
      }
      expect(stack.offline_evidence.runtime_cycles).toBe(
        products.reduce(
          (total, product) => total + eol.runtimes[product].cycles.length,
          0,
        ),
      );

      const expectedPackages =
        stack.kind === "package"
          ? Object.keys(eol.packages[stack.id] ?? {}).length
          : 0;
      expect(stack.offline_evidence.package_count).toBe(expectedPackages);
      expect(stack.offline_evidence.advisory_covered).toBe(
        stack.kind === "package" && advisoryEcosystems.has(stack.id),
      );

      if (stack.kind === "package" && stack.id !== "csharp") {
        const patterns = PATTERNS.filter(
          (pattern) => pattern.ecosystem === stack.id,
        );
        expect(stack.recognition.manifests).toEqual(
          [...new Set(patterns.map((pattern) => pattern.manifest))].sort(),
        );
        expect(stack.recognition.lockfiles).toEqual(
          [...new Set(patterns.map((pattern) => pattern.lockfile))].sort(),
        );
      }

      if (stack.kind === "census") {
        const extensions = stack.id === "vb6" ? VB6_EXTS : DELPHI_EXTS;
        expect(
          [
            ...stack.recognition.project_files,
            ...stack.recognition.source_files,
          ].sort(),
        ).toEqual([...extensions].sort());
      }
    }
  });

  it("summarises the manifest for the rubric index", () => {
    const fresh = buildStackManifestData();
    const packages = fresh.stacks.filter((stack) => stack.kind === "package");
    const summary = stackCoverageSummary();

    expect(summary.stacks.total).toBe(fresh.stacks.length);
    expect(summary.stacks.package).toBe(packages.length);
    expect(summary.stacks.census).toBe(
      fresh.stacks.filter((stack) => stack.kind === "census").length,
    );
    expect(summary.advisory.covered).toBe(
      packages.filter((stack) => stack.offline_evidence.advisory_covered)
        .length,
    );
    expect(summary.advisory.total).toBe(packages.length);
    expect(summary.frameworks.total).toBe(fresh.frameworks.length);
    expect(summary.frameworks.judged).toBe(
      fresh.frameworks.filter((framework) => framework.judged).length,
    );
    expect(summary.frameworks.namedOnly).toBe(
      fresh.frameworks.filter((framework) => !framework.judged).length,
    );
  });

  it("splits the identity frameworks against the dataset keys", () => {
    const eol = readJson<EolDoc>(
      join(SCANNER, "src", "scan", "snapshots", "eol.json"),
    );
    expect(STACK_MANIFEST.frameworks.map((row) => row.name)).toEqual(
      FRAMEWORK_SIGNATURES.map((signature) => signature.name),
    );
    for (const framework of STACK_MANIFEST.frameworks) {
      expect(framework.judged).toBe(framework.dataset_key !== null);
      if (framework.dataset_key) {
        expect(
          eol.frameworks[framework.dataset_key],
          `${framework.name} maps to unknown dataset key ${framework.dataset_key}`,
        ).toBeDefined();
      }
    }
  });
});

describe("stack coverage component", () => {
  const html = renderToStaticMarkup(createElement(StackCoverage));

  it("renders every manifest stack exactly once", () => {
    for (const stack of STACK_MANIFEST.stacks) {
      const matches =
        html.match(new RegExp(`data-stack="${stack.id}"`, "g")) ?? [];
      expect(matches, `${stack.id} must render exactly once`).toHaveLength(1);
    }
  });

  it("renders the advisory, detector, and census disclosures from the manifest", () => {
    const advisory = advisoryCoverage();
    const detectors = detectorCoverage();
    const census = censusDisclosure();

    expect(html).toContain(advisory.sentence);
    expect(html).toContain(detectors.sentence);
    expect(html).toContain(census.sentence);
    expect(html).toContain(
      `${STACK_MANIFEST.detection.total} of the ${STACK_MANIFEST.detection.rubric_total}`,
    );
    expect(html).toContain(
      `${STACK_MANIFEST.detection.local} of those run on a local scan`,
    );
  });

  it("marks every framework row as the dataset judges it", () => {
    const rows = html.match(/data-framework="/g) ?? [];
    expect(rows).toHaveLength(STACK_MANIFEST.frameworks.length);
    for (const framework of STACK_MANIFEST.frameworks) {
      const marker = framework.judged ? "yes" : "no";
      expect(
        html,
        `${framework.name} must carry data-framework-judged="${marker}"`,
      ).toMatch(
        new RegExp(
          `data-framework="${escapeRegex(framework.name)}"[^>]*data-framework-judged="${marker}"`,
        ),
      );
    }
    expect(frameworkSplit().judged).toHaveLength(
      STACK_MANIFEST.frameworks.filter((row) => row.judged).length,
    );
  });

  it("does not type a stack count into the surface source", () => {
    const source = readFileSync(
      join(SITE, "components", "stack-coverage.tsx"),
      "utf-8",
    );
    expect(source).not.toMatch(/\b31 of 102\b/);
    expect(source).not.toMatch(/\b25 on a local scan\b/);
    expect(source).not.toMatch(/\b4 of 8\b/);
  });
});

describe("stack coverage document", () => {
  it("names every stack the manifest publishes", () => {
    const document = readFileSync(DOCS, "utf-8");
    for (const stack of STACK_MANIFEST.stacks) {
      expect(
        document,
        `docs/stack-coverage.md is missing stack ${stack.id}`,
      ).toContain(`\`${stack.id}\``);
    }
  });

  it("does not restate generated counts", () => {
    const document = readFileSync(DOCS, "utf-8");
    expect(document).not.toContain(String(STACK_MANIFEST.detection.total));
    expect(document).not.toContain(String(STACK_MANIFEST.detection.local));
    expect(document).not.toContain(
      String(STACK_MANIFEST.detection.rubric_total),
    );
  });
});
