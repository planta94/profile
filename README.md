# Personal Portfolio Website & CV Generator

This repository contains Dr. Chia Min Yan's personal portfolio website and automated curriculum vitae (CV) generation system.

## 1. Web Application

Built using **Angular 19+** with modern SCSS styling, featuring a clean developer layout, a responsive canvas particle backdrop, translation support, and selected publications.

### Development Server
Run `npm run start` to start the local development server at `http://localhost:4200/`.

### Build
Run `npm run build` to build the production assets in the `dist/` directory.

### Code Quality
*   **Linting**: Run `npm run lint` to execute ESLint and Prettier checks.
*   **Formatting**: Run `npm run format` to run Prettier formatting.
*   **Unit Tests**: Run `npm run test` to run Vitest unit tests.

---

## 2. CV Generator

Located in the [cv-generator/](cv-generator/) directory, this **Python script** uses ReportLab to compile a professional, grid-aligned, 2-page CV PDF with clean Inter typography.

### File Structure
*   `cv-generator/generate_cv.py` — The core ReportLab compiler script.
*   `cv-generator/inter-v20-latin-*` — Extracted TrueType font files for the premium "Inter" typography.
*   `public/profile_cv.jpg` — The profile photo used strictly on the CV (blue background, tie).
*   `public/profile.jpg` — The original profile photo used strictly on the website.

### Compilation
To regenerate the CV PDF:
```bash
python cv-generator/generate_cv.py
```
This automatically compiles the document, saves the primary bundle to [public/CV.pdf](public/CV.pdf) (served by the Angular app), and creates a synchronized copy at the workspace root [CV.pdf](CV.pdf).

### Page Budget & Verification
The CV has a strict **2-page budget**. You can programmatically verify the page count using:
```bash
python -c "import pypdf; reader = pypdf.PdfReader('CV.pdf'); print(len(reader.pages))"
# Output should be exactly 2
```
