# Personal Portfolio Website & CV Generator

This repository contains Dr. Chia Min Yan's personal portfolio website and automated curriculum vitae (CV) generation system.

## 1. Web Application

Built using **Angular 22+** with modern SCSS styling, featuring a clean developer layout, a responsive canvas particle backdrop, multilingual localization support, and selected publications.

### Architecture & Routing

- **Main Portfolio (`/`)**: Hosts the primary developer profile ([PortfolioComponent](file:///c:/Users/chine/OneDrive/Desktop/Github/personal-website/src/app/portfolio/portfolio.component.ts)) showcasing interactive capability tabs, academic publications, contact forms, and a fully responsive career timeline optimized with auto-stacking headers and layout scaling for mobile screens.
- **Interactive CV (`/cv`)**: A web-based counterpart ([CvComponent](file:///c:/Users/chine/OneDrive/Desktop/Github/personal-website/src/app/cv/cv.component.ts)) of the professional CV, specifically formatted via print stylesheets to render and print exactly onto a **2-page A4** layout.

### Multilingual (i18n) Support

- Supported languages: English (`en`), Chinese (`zh`), and Malay (`ms`).
- Language files are located at [public/i18n/](file:///c:/Users/chine/OneDrive/Desktop/Github/personal-website/public/i18n/) (`en.json`, `zh.json`, `ms.json`). These are served dynamically by [TranslationService](file:///c:/Users/chine/OneDrive/Desktop/Github/personal-website/src/app/services/translation.service.ts).
- English acts as the initial in-memory fallback to ensure seamless rendering without layout shift.

### Development Server

Run `npm run start` to start the local development server at `http://localhost:4200/`.

### Build & Deployment

- **Build Production**: Run `npm run build` to compile the app. Production assets are output to the `docs/` directory for deployment compatibility (e.g., GitHub Pages).
- **GitHub Pages Build**: Run `npm run build:github-pages` to compile production assets with a base href of `/profile/`.

### Code Quality & Validation

- **Linting**: Run `npm run lint` to execute ESLint and Prettier checks on code templates, SCSS styles, and language JSON files.
- **Formatting**: Run `npm run format` to execute Prettier code and JSON formatter.
- **Unit Tests**: Run `npm run test` to run Vitest unit tests.

---

## 2. CV Generator

Located in the [cv-generator/](file:///c:/Users/chine/OneDrive/Desktop/Github/personal-website/cv-generator/) directory, this **Python script** uses ReportLab to compile a professional, grid-aligned, 2-page CV PDF with clean Inter typography.

### File Structure

- `cv-generator/generate_cv.py` — The core ReportLab compiler script.
- `cv-generator/inter-v20-latin-*` — Extracted TrueType font files for the premium "Inter" typography.
- `public/profile_cv.jpg` — The profile photo used strictly on the CV (blue background, tie).
- `public/profile.jpg` — The original profile photo used strictly on the website.

### Compilation

To regenerate the CV PDF:

```bash
python cv-generator/generate_cv.py
```

This automatically compiles the document, saves the primary bundle to [public/CV.pdf](file:///c:/Users/chine/OneDrive/Desktop/Github/personal-website/public/CV.pdf) (served by the Angular app), and creates a synchronized copy at the workspace root [CV.pdf](file:///c:/Users/chine/OneDrive/Desktop/Github/personal-website/CV.pdf).

### Page Budget & Verification

The CV has a strict **2-page budget**. You can programmatically verify the page count using:

```bash
python -c "import pypdf; reader = pypdf.PdfReader('CV.pdf'); print(len(reader.pages))"
# Output should be exactly 2
```
