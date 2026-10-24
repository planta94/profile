import { test, expect } from '@playwright/test';
import { ManualJourneyRecorder } from 'veriscribe';

/**
 * Feature slice: Curriculum Vitae (route `/cv`, rendered at `/#/cv` by the hash router).
 *
 * The recorded journey produces the `manual-cv` chapter (en-US, role `user`) and enforces the
 * AGENTS.md rule that the CV prints to exactly two A4 pages. The extra tests cover `?lang=` deep links.
 */

test.describe('Feature Slice: Curriculum Vitae (/cv)', () => {
  test('[en-US][Role: user] CV review + PDF download + multi-dimension verification + manual capture', async ({
    page,
  }) => {
    const manual = new ManualJourneyRecorder(page, {
      chapterId: 'manual-cv',
      featureTitle: 'Viewing and Downloading the CV',
      summary:
        'Read the two-page A4 curriculum vitae, switch its language, and download it as a PDF.',
      role: 'user',
      locale: 'en-US',
      routePath: '/cv',
      preconditions: [
        'You opened the CV from **Download CV** on the portfolio, or went straight to `/#/cv`.',
        'Your browser allows downloads from this site.',
      ],
      captureResponsiveViewports: true,
    });

    await manual.goto('/cv');
    await manual.assertCurrentRoute('/cv');
    const page1 = page.locator('.cv-page').nth(0);
    const page2 = page.locator('.cv-page').nth(1);
    await expect(page.locator('.cv-page')).toHaveCount(2);

    // Dimension: accessibility. The CV is a print document, so the document-preview preset applies.
    await manual.verifyAccessibility({ preset: 'document-preview' });

    // Dimension: print layout. AGENTS.md requires exactly 2 A4 pages when printed.
    const print = await manual.verifyVisualLayout({
      media: 'print',
      pageBudget: { pageSize: 'A4', maxPages: 2 },
    });
    expect(print.pages, `print page count (method: ${print.method})`).toBe(2);

    // Dimension: responsive layout on screen.
    await manual.verifyResponsiveViewports();

    // --- Step 1: action bar ------------------------------------------------------------------
    const actionBar = page.locator('.action-bar');
    await manual.recordStep({
      title: 'Find the CV controls',
      userInstruction:
        'Use the bar at the top of the page to choose a language (**English**, **中文**, **Melayu**) or click **Download PDF**.',
      expectedOutcome:
        'The current language is highlighted. The bar is only on screen: it does not appear in the printout or the PDF.',
      target: actionBar,
      action: async () => {
        await expect(actionBar.locator('.lang-selector .btn')).toHaveText([
          'English',
          '中文',
          'Melayu',
        ]);
        await expect(actionBar.locator('.lang-selector .btn.active')).toHaveText('English');
        await expect(actionBar.locator('.btn-print')).toHaveText('Download PDF');
        await expect(actionBar.locator('.btn-print')).toBeEnabled();
        await page.emulateMedia({ media: 'print' });
        await expect(actionBar).toBeHidden();
        await page.emulateMedia({ media: 'screen' });
        await expect(actionBar).toBeVisible();
      },
    });

    // --- Step 2: page 1 ----------------------------------------------------------------------
    await manual.recordStep({
      title: 'Read page 1: profile, education, skills and career',
      userInstruction:
        'The left column of page 1 has contact details, degrees and core skills. The right column lists professional experience, newest first.',
      expectedOutcome:
        'Page 1 shows the CV photo, 3 degrees, 12 core skills and every role, each with its dates.',
      target: page1,
      action: async () => {
        await expect(page1.locator('.sidebar img.avatar')).toHaveAttribute('src', 'profile_cv.jpg');
        await expect(page1.locator('h1.name')).toHaveText('Chia Min Yan');
        await expect(page1.locator('.edu-item')).toHaveCount(3);
        await expect(page1.locator('.skill-badge')).toHaveCount(12);
        await expect(page1.locator('.job-item').first().locator('.job-role')).not.toBeEmpty();
        await expect(page1.locator('.page-number')).toHaveText('Page 1 of 2');
      },
    });

    // --- Step 3: page 2 ----------------------------------------------------------------------
    await manual.recordStep({
      title: 'Read page 2: research, publications and references',
      userInstruction:
        'Scroll down to page 2 for research experience, selected publications, extracurricular activities, affiliations and references.',
      expectedOutcome:
        "Page 2 lists 5 publications with Dr. Chia's name in bold, plus 2 references.",
      target: page2,
      action: async () => {
        await page2.scrollIntoViewIfNeeded();
        await expect(page2.locator('.section-title').first()).toHaveText('Research Experience');
        const citations = page2.locator('.main-content > div:nth-child(2) li');
        await expect(citations).toHaveCount(5);
        for (const li of await citations.all()) {
          await expect(li.locator('strong')).toHaveCount(1);
        }
        await expect(page2.locator('.ref-card')).toHaveCount(2);
        await expect(page2.locator('.page-number')).toHaveText('Page 2 of 2');
      },
    });

    // --- Step 4: language switch -------------------------------------------------------------
    const zhBtn = actionBar.locator('.lang-selector .btn', { hasText: '中文' });
    await manual.recordStep({
      title: 'Change the CV language',
      userInstruction: 'Click **中文** or **Melayu** in the top bar.',
      expectedOutcome:
        'The whole CV is translated without reloading the page, and it still fits on exactly two A4 pages.',
      target: zhBtn,
      action: async () => {
        await zhBtn.click();
        await expect(zhBtn).toHaveClass(/active/);
        await expect(page1.locator('.sidebar-section-title').first()).toHaveText('联系方式');
        await expect(page2.locator('.section-title').first()).toHaveText('研究经历');
        await expect(page.locator('.cv-page')).toHaveCount(2);

        // Switch back to English so the rest of the manual is captured in English.
        await actionBar.locator('.lang-selector .btn', { hasText: 'English' }).click();
        await expect(page1.locator('.sidebar-section-title').first()).toHaveText('Contact');
      },
    });

    // --- Step 5: download PDF ----------------------------------------------------------------
    const printBtn = actionBar.locator('.btn-print');
    await manual.recordStep({
      title: 'Download the CV as a PDF',
      userInstruction:
        'Click **Download PDF** and keep the tab open until the file has downloaded.',
      expectedOutcome:
        'The button changes to **Generating PDF...** for a few seconds, `CV_Chia_Min_Yan.pdf` is downloaded, and the button goes back to **Download PDF** so you can download again.',
      target: printBtn,
      notes:
        'The PDF is generated in your browser at high resolution, so it can take a few seconds on slower devices.',
      action: async () => {
        const downloadPromise = page.waitForEvent('download', { timeout: 60_000 });
        await printBtn.click();
        await expect(printBtn).toHaveText('Generating PDF...');
        await expect(printBtn).toBeDisabled();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('CV_Chia_Min_Yan.pdf');
        await expect(printBtn).toHaveText('Download PDF', { timeout: 10_000 });
        await expect(printBtn).toBeEnabled();
      },
    });

    await manual.assertNoUntranslatedI18nKeys();
    await manual.assertVisualLayoutHealth('Curriculum Vitae Page');

    // --- Troubleshooting ---------------------------------------------------------------------
    await manual.recordTroubleshootingScenario({
      scenario: 'The Download PDF button says "Generating PDF..."',
      userMessage: 'Generating PDF...',
      resolution:
        'The PDF is being built in your browser. This usually takes 2–3 seconds. Stay on the tab; the button comes back once the download starts.',
      target: printBtn,
    });
    await manual.recordTroubleshootingScenario({
      scenario: 'Printing with Ctrl/Cmd + P adds headers or a third page',
      userMessage: 'The print preview shows browser headers or spills onto a 3rd page.',
      resolution:
        'Use **Download PDF** instead: it always gives a clean two-page A4 PDF. If you do print, turn off "Headers and footers" and set the margins to "Default".',
    });
    await manual.recordTroubleshootingScenario({
      scenario: 'The CV opened in a different language from the portfolio',
      userMessage: 'The language in the CV does not match the portfolio.',
      resolution:
        "Open the CV with **Download CV** on the portfolio: the link carries your current language (`?lang=`). You can also pick a language in the CV's top bar.",
    });

    await manual.finalize();
  });

  for (const [lang, contactTitle] of [
    ['zh', '联系方式'],
    ['ms', 'Hubungi'],
  ] as const) {
    test(`[Deep link] /#/cv?lang=${lang} opens the CV in that language on a fresh load`, async ({
      page,
    }) => {
      await page.goto(`/#/cv?lang=${lang}`);
      await expect(
        page.locator('.cv-page').first().locator('.sidebar-section-title').first(),
      ).toHaveText(contactTitle);
      await expect(page.locator('.lang-selector .btn.active')).toHaveText(
        lang === 'zh' ? '中文' : 'Melayu',
      );
      expect(await page.evaluate(() => localStorage.getItem('preferredLang'))).toBe(lang);
    });
  }

  test('[Deep link] ?lang= overrides a different remembered language and ignores unsupported values', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem('preferredLang', 'zh');
        sessionStorage.setItem('seeded', '1');
      }
    });
    await page.goto('/#/cv?lang=en');
    const firstTitle = page.locator('.cv-page').first().locator('.sidebar-section-title').first();
    await expect(firstTitle).toHaveText('Contact');

    await page.goto('/#/cv?lang=fr');
    await page.reload();
    await expect(firstTitle).toHaveText('Contact');
    await expect(page.locator('.lang-selector .btn.active')).toHaveText('English');
  });
});
