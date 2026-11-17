import type { Metadata } from "next";
import Link from "next/link";

import { StackCoverage } from "@/components/stack-coverage";

export const metadata: Metadata = {
  title: "Stack coverage",
  description:
    "Every stack the scanner recognises, whether its dependencies are parsed, which offline evidence covers it, and exactly where grading stops.",
};

export default function RubricStacksPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-faint">
        <Link
          href="/rubric"
          className="cursor-pointer rounded underline underline-offset-2 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
        >
          Rubric
        </Link>{" "}
        / <span className="text-muted">Stack coverage</span>
      </nav>

      <header className="mt-4">
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

      <StackCoverage />
    </div>
  );
}
