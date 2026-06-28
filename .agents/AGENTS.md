# Workspace Rules for AI Coding Agents

These rules apply specifically to this repository (`planta94/personal-website`). Follow them strictly to maintain codebase integrity and prevent layout regressions.

## 1. Python CV Generation Pipeline

The CV generator script is located in [cv-generator/generate_cv.py](file:///c:/Users/chine/OneDrive/Desktop/Github/personal-website/cv-generator/generate_cv.py).

### A. Layout Dimensions & Grids
The CV is built on an A4 canvas (`595 x 842 pt`) and uses a strict vertical divider at `x = 165`.
*   **Left Sidebar Content Column**: Limited to exactly `125pt` content width (`x = 20` to `x = 145`) with `20pt` symmetrical margins. Sidebar headers and tag grids must use this exact width.
*   **Right Main Content Column**: Limited to exactly `374pt` content width (`x = 185` to `x = 559`).
*   **Divider Line**: Drawn exactly at `x = 165`.

### B. ReportLab Nested Table Overflow
ReportLab ignores outer column constraints when rendering nested Tables.
*   Always set the `colWidths` of any inner helper table (e.g. experience headers, education headers, divider lines) in the main column to sum to exactly `374pt`.
*   Always set inner helper tables in the sidebar column to sum to exactly `125pt` (or `120pt` for grid elements).
*   Failure to do this will cause the text/lines to overflow past the margins and divider lines.

### C. Bullet Point Justification Bug
In ReportLab, setting `alignment=4` (justified) on a `Paragraph` with a manual bullet character (e.g. `"• Text"`) and negative indentation (`firstLineIndent < 0`) causes the spacing engine to justify the space after the bullet, resulting in broken alignments and shifted bullet symbols.
*   **Do NOT** use simple Paragraph bullet tags for experience descriptions.
*   **Always** use the table-based helper `make_bullet_point(text, style, bullet_width, text_width)`. It places the bullet in its own column, shielding it from the justification engine.

### D. Photo Decoupling
*   **Web Photo**: Stored at `public/profile.jpg` (original outdoor background).
*   **CV Photo**: Stored at `public/profile_cv.jpg` (blue background, tie).
*   Do not overwrite `public/profile.jpg` with the CV photo.

---

## 2. Angular Web App Code Quality

*   **Linting**: The workspace has strict ESLint and Prettier rules enforced via `npm run lint`.
*   **Unused variables**: Base rule `no-undef` and `@typescript-eslint` rules are strict. Do not use explicit `any` types (prefer `unknown` or specific interfaces).
*   **Dropdown/Window Listeners**: If using window-level click listeners, use standard class variables, but prefix unused parameters in type signatures with `_` or add `// eslint-disable-next-line no-unused-vars` to prevent build failures.
*   **Property Injection**: Prefer Angular 14+ `inject()` pattern over constructor parameter properties to avoid constructor-property ESLint checks.
