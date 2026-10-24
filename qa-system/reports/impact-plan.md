# Incremental QA & User Manual Impact Plan

- **Compared Against**: `2d85d25e66341bdbf0bbb0b50aa3ea94cf51abaf`
- **Changed Files Detected**: 99
- **OpenAPI Contract Changed**: No
- **i18n Translations Changed**: YES (re-run locale manual snapshots)

## 1. Impacted Unit Specs (`.spec.ts`) to Update/Run
- [Service] `src/app/services/translation.service.spec.ts` (Status: **TRIAGED**)
- [Component] `src/app/app.component.spec.ts` (Status: **VERIFIED**)
- [Component] `src/app/contact/contact.component.spec.ts` (Status: **TRIAGED**)
- [Component] `src/app/cv/cv.component.spec.ts` (Status: **TRIAGED**)
- [Component] `src/app/experience/experience.component.spec.ts` (Status: **TRIAGED**)
- [Component] `src/app/expertise/expertise.component.spec.ts` (Status: **TRIAGED**)
- [Component] `src/app/header/header.component.spec.ts` (Status: **TRIAGED**)
- [Component] `src/app/hero/hero.component.spec.ts` (Status: **TRIAGED**)
- [Component] `src/app/portfolio/portfolio.component.spec.ts` (Status: **TRIAGED**)
- [Component] `src/app/publications/publications.component.spec.ts` (Status: **TRIAGED**)
- [Component] `src/app/skills/skills.component.spec.ts` (Status: **VERIFIED**)

## 2. Impacted Playwright E2E Journeys & Manual Chapters
- [Route `/cv`] E2E: `e2e/journeys/cv.e2e.spec.ts` -> Manual Chapter: `manual-cv`
- [Route `/`] E2E: `e2e/journeys/home.e2e.spec.ts` -> Manual Chapter: `manual-home`

## 3. Evidence
| Slice | Route | Manual Evidence | Playwright |
| :--- | :--- | :--- | :--- |
| `home` | `/` | **fresh** | passed |
| `cv` | `/cv` | **fresh** | passed |

## 4. Ready-to-Ship Gate Violations (0)
All in-scope components, services, and manual slices have evidence.
