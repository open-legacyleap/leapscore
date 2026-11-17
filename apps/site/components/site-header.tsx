import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { ASSESSMENT_ROUTE } from "@/lib/assessment";
import { SOURCE_NAV_LABEL, SOURCE_URL } from "@/lib/source-links";

const PRIMARY_NAV = [
  { href: "/samples", label: "Samples" },
  { href: "/method", label: "Method" },
  { href: "/rubric", label: "Rubric" },
];

const linkClass = "transition-colors hover:text-foreground";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-background/85 backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:h-14 sm:flex-nowrap sm:py-0">
        <Link href="/" className="group flex items-center gap-2">
          <BrandMark className="h-5 w-5 text-foreground transition-transform group-hover:rotate-6" />
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            LeapScore
          </span>
          <span className="hidden text-xs text-faint sm:inline">
            leapscore.dev
          </span>
        </Link>
        <nav
          aria-label="Primary"
          className="order-3 flex w-full items-center gap-3 text-sm text-muted sm:order-none sm:w-auto sm:gap-5"
        >
          {PRIMARY_NAV.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </Link>
          ))}
        </nav>
        <nav
          aria-label="Utilities"
          className="order-2 flex items-center gap-3 text-sm text-muted sm:order-none sm:gap-5"
        >
          <a href={SOURCE_URL} className={linkClass}>
            {SOURCE_NAV_LABEL}
          </a>
          <Link href={ASSESSMENT_ROUTE} className={linkClass}>
            $0 Assessment
          </Link>
        </nav>
      </div>
    </header>
  );
}
