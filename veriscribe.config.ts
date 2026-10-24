import { defineConfig } from 'veriscribe/config';

export default defineConfig({
  // Angular uses withHashLocation() (GitHub Pages has no rewrite rules), so manual.goto('/cv') -> '/#/cv'.
  router: {
    mode: 'hash',
    baseHref: '/',
  },
  // Living manuals are published in English only. The app itself supports en/zh/ms; the
  // other locales are covered by unit specs and by the E2E locale switch steps.
  i18n: {
    locales: ['en-US'],
    defaultLocale: 'en-US',
  },
  artifactsRootDir: 'docs/manual-artifacts',
  manualsOutputDir: 'docs/manuals',
  // Default per-step checks for every ManualJourneyRecorder.recordStep().
  checks: {
    i18nKeys: { keySources: ['public/i18n'] },
    // The hero particle canvas is a decorative full-bleed background layer, not an occluder.
    visualLayout: { ignoreSelectors: ['#particleCanvas'] },
  },
  gate: {
    // Written by the Playwright json reporter (see playwright.config.ts). Kept outside
    // playwright-report/ because the html reporter wipes that folder on every run.
    playwrightReport: 'qa-system/reports/playwright-results.json',
    // Written by `ng test` (see angular.json -> architect.test.options).
    unitReport: 'qa-system/reports/unit-results.xml',
    coverage: {
      file: 'coverage/personal-website/lcov.info',
      branches: 70,
      lines: 80,
    },
    allowList: [],
  },
});
