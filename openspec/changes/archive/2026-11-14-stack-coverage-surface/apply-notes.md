# Apply notes

## 6.3 — Header at a 320px viewport

Measured in headless Chrome (`Emulation.setDeviceMetricsOverride`, width 320,
no device scale) against the built static export:

- `window.innerWidth` = 320; `document.documentElement.scrollWidth` = 320 (no
  horizontal page overflow).
- Header nav box: left 73.5, right 304 — inside the 16px container padding.
- Labels on one line (all share top 18 / bottom 38):
  `Samples` 73.5–130.1, `Stacks` 142.1–186.7, `Method` 198.7–249.3,
  `Rubric` 261.3–304.
- No wrapping and no overlap. The brand wordmark is hidden below `sm` so the
  brand mark and the four labels fit; the wordmark returns at `sm` and above.
