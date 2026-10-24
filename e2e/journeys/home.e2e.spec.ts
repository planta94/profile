import { test, expect, type Page } from '@playwright/test';
import { ManualJourneyRecorder } from 'veriscribe';

/**
 * Feature slice: Home portfolio (route `/`, rendered at `/#/` by the hash router).
 *
 * The recorded journey produces the `manual-home` chapter (en-US, role `user`). The extra tests
 * below it check behaviour that a manual screenshot can't prove: degraded i18n,
 * the Malay locale, and the mobile expertise carousel.
 */

const CJK = /[\u3400-\u9fff]/;

async function openLanguageMenu(page: Page) {
  await page.locator('.lang-dropdown-trigger').click();
  await expect(page.locator('.lang-dropdown-menu')).toBeVisible();
}

test.describe('Feature Slice: Home Portfolio (/)', () => {
  test('[en-US][Role: user] Portfolio journey + multi-dimension verification + manual capture', async ({
    page,
  }) => {
    const manual = new ManualJourneyRecorder(page, {
      chapterId: 'manual-home',
      featureTitle: 'Exploring the Portfolio',
      summary:
        "Find your way around Dr. Chia Min Yan's portfolio: switch the interface language, jump between sections, browse expertise and career history, and open the printable CV.",
      role: 'user',
      locale: 'en-US',
      routePath: '/',
      preconditions: [
        'You are using an up-to-date browser (Chrome, Edge, Firefox or Safari).',
        'You are online, so the page can load its language files.',
      ],
      captureResponsiveViewports: true,
    });

    await manual.goto('/');
    await manual.assertCurrentRoute('/');
    await expect(page.locator('a.nav-link').first()).toHaveText('Profile');

    // Dimension: accessibility. Nothing is disabled up front; a rule gets disabled only if the
    // audit turns up a deliberate exception.
    await manual.verifyAccessibility({ preset: 'full-page' });

    // Dimension: responsive layout (desktop / tablet / mobile overflow and occlusion).
    await manual.verifyResponsiveViewports();

    // --- Step 1: hero ------------------------------------------------------------------------
    const hero = page.locator('app-hero#about');
    await manual.recordStep({
      title: 'Read the profile introduction',
      userInstruction:
        'Start at the top of the page. The introduction summarises the profile and has two shortcut buttons: **Contact** and **Publications**.',
      expectedOutcome: 'The name, a short bio and the two shortcut buttons are visible.',
      target: hero,
      action: async () => {
        await expect(hero.locator('h1#heroTitle')).toBeVisible();
        await expect(hero.locator('a.btn-primary')).toHaveAttribute('href', '#contact');
        await expect(hero.locator('a.btn-secondary')).toHaveAttribute('href', '#publications');
      },
    });

    // --- Step 2: language switch -------------------------------------------------------------
    const langTrigger = page.locator('.lang-dropdown-trigger');
    await manual.recordStep({
      title: 'Change the display language',
      userInstruction:
        'Click the **language** button (the translate icon) in the header, then pick **English**, **中文** or **Melayu**.',
      expectedOutcome:
        'The page is translated straight away, with no reload, and the header shows the language you picked. Your choice is remembered for your next visit.',
      target: langTrigger,
      notes: 'The printable CV opens in whichever language is active when you open it.',
      action: async () => {
        await openLanguageMenu(page);
        await page.locator('.lang-dropdown-menu .menu-item').nth(1).click();
        await expect(page.locator('a.nav-link').first()).toHaveText('个人简介');
        await expect(page.locator('.lang-dropdown-menu')).toBeHidden();
        expect(await page.evaluate(() => localStorage.getItem('preferredLang'))).toBe('zh');

        // Switch back to English so the rest of the manual is captured in English.
        await openLanguageMenu(page);
        await page.locator('.lang-dropdown-menu .menu-item').nth(0).click();
        await expect(page.locator('a.nav-link').first()).toHaveText('Profile');
        expect(await page.evaluate(() => localStorage.getItem('preferredLang'))).toBe('en');
      },
    });

    // --- Step 3: section navigation ----------------------------------------------------------
    const navLinks = page.locator('nav.nav-links');
    await manual.recordStep({
      title: 'Jump to a section',
      userInstruction:
        'Use the links in the header (**Profile**, **Expertise**, **Experience**, **Publications**, **Skills**, **Contact**) to scroll to that part of the page.',
      expectedOutcome: 'The page scrolls to the section you clicked.',
      target: navLinks,
      // After the jump, the content above the target scrolls under the fixed floating header
      // (that's how a sticky header works). Ignore the header as an occluder for this step only.
      checks: { visualLayout: { ignoreSelectors: ['header'] } },
      action: async () => {
        await expect(navLinks.locator('a.nav-link')).toHaveText([
          'Profile',
          'Expertise',
          'Experience',
          'Publications',
          'Skills',
          'Contact',
        ]);
        await navLinks.getByText('Publications', { exact: true }).click();
        await expect(page.locator('app-publications#publications')).toBeInViewport();
        // The section title must land below the fixed header, not underneath it.
        const title = page.locator('app-publications#publications .section-title');
        await expect
          .poll(async () => {
            const headerBottom = await page
              .locator('header')
              .first()
              .evaluate((el) => el.getBoundingClientRect().bottom);
            const titleTop = await title.evaluate((el) => el.getBoundingClientRect().top);
            return titleTop >= headerBottom;
          })
          .toBe(true);
      },
    });

    // --- Step 4: expertise tabs --------------------------------------------------------------
    const expertise = page.locator('app-expertise#expertise');
    const tabButtons = expertise.locator('.dashboard-tabs .tab-btn');
    await manual.recordStep({
      title: 'Browse areas of expertise',
      userInstruction:
        'In **Expertise**, click a topic on the left (for example **Academic Research**) to see its accomplishments and tech stack.',
      expectedOutcome:
        'The topic you clicked is highlighted, and the panel on the right shows its **Key Accomplishments** and **Technology Stack**.',
      target: expertise.locator('.dashboard-container'),
      action: async () => {
        await expect(tabButtons).toHaveCount(4);
        await expect(tabButtons.first()).toHaveClass(/active/);
        await tabButtons.nth(2).click();
        await expect(tabButtons.nth(2)).toHaveClass(/active/);
        const pane = expertise.locator('.content-pane.active');
        await expect(pane.locator('h3')).toHaveText('Academic Research');
        await expect(pane.locator('.pane-section-title')).toHaveText([
          'Key Accomplishments',
          'Technology Stack',
        ]);
      },
    });

    // --- Step 5: experience timeline (keyboard operable) -------------------------------------
    const experience = page.locator('app-experience#experience');
    const secondCard = experience.locator('.timeline-item').nth(1).locator('.card-header');
    await manual.recordStep({
      title: 'Expand a role in the career timeline',
      userInstruction:
        'In **Experience**, click a role (or select it with **Tab** and press **Enter** or **Space**) to show its achievements and technologies.',
      expectedOutcome:
        'The card opens to show the achievements and technology tags. Click it again to close it. The most recent role is open by default.',
      target: secondCard,
      // Scrolling to the 2nd timeline card places the 1st card's header under the fixed navbar.
      checks: { visualLayout: { ignoreSelectors: ['header'] } },
      action: async () => {
        await expect(
          experience.locator('.timeline-item').first().locator('.card-header'),
        ).toHaveAttribute('aria-expanded', 'true');
        await expect(secondCard).toHaveAttribute('aria-expanded', 'false');
        await secondCard.focus();
        await page.keyboard.press('Space');
        await expect(secondCard).toHaveAttribute('aria-expanded', 'true');
        await expect(experience.locator('.timeline-card').nth(1)).toHaveClass(/expanded/);
        await page.keyboard.press('Enter');
        await expect(secondCard).toHaveAttribute('aria-expanded', 'false');
        await page.keyboard.press('Enter');
        await expect(secondCard).toHaveAttribute('aria-expanded', 'true');
      },
    });

    // --- Step 6: publications ----------------------------------------------------------------
    const publications = page.locator('app-publications#publications');
    await manual.recordStep({
      title: 'Browse peer-reviewed publications',
      userInstruction:
        'Scroll to **Publications** to see the selected journal papers, with their tier, year, authors and journal.',
      expectedOutcome: "Each card lists the full author list, with Dr. Chia's name in **bold**.",
      target: publications.locator('.publications-grid'),
      action: async () => {
        const cards = publications.locator('.pub-card');
        await expect(cards).toHaveCount(5);
        for (const card of await cards.all()) {
          await expect(card.locator('.pub-authors strong')).toHaveCount(1);
          await expect(card.locator('.pub-authors strong')).toHaveText(/^Chia, M\. ?Y\.$/);
        }
      },
    });

    // --- Step 7: contact ---------------------------------------------------------------------
    const contact = page.locator('app-contact#contact');
    await manual.recordStep({
      title: 'Get in touch',
      userInstruction:
        'In **Contact**, click the email address or phone number to open your mail or phone app. Professional references are listed alongside.',
      expectedOutcome: 'Your email app (or dialler) opens with the address already filled in.',
      target: contact.locator('.contact-card'),
      action: async () => {
        await expect(contact.locator('a.contact-detail-item')).toHaveCount(2);
        await expect(contact.locator('a.contact-detail-item').nth(0)).toHaveAttribute(
          'href',
          'mailto:chiamy94@gmail.com',
        );
        await expect(contact.locator('a.contact-detail-item').nth(1)).toHaveAttribute(
          'href',
          'tel:+60192508182',
        );
        await expect(contact.locator('.reference-item')).toHaveCount(2);
        await expect(contact.locator('.reference-item a.ref-email')).toHaveText([
          'bryan.lee@juiceuptoday.com',
          'huangyf@utar.edu.my',
        ]);
      },
    });

    // --- Step 8: open the CV -----------------------------------------------------------------
    const cvLink = page.locator('a.btn-cv');
    await manual.recordStep({
      title: 'Open the printable CV',
      userInstruction: 'Click **Download CV** in the header.',
      expectedOutcome:
        'The two-page A4 CV opens in a new tab, in the language you are currently using, ready to download as a PDF.',
      target: cvLink,
      action: async () => {
        await expect(cvLink).toHaveAttribute('target', '_blank');
        await expect(cvLink).toHaveAttribute('href', /#\/cv\?lang=en$/);
        const [cvTab] = await Promise.all([page.context().waitForEvent('page'), cvLink.click()]);
        await cvTab.waitForLoadState();
        await expect(cvTab).toHaveURL(/#\/cv\?lang=en$/);
        await expect(cvTab.locator('.cv-page')).toHaveCount(2);
        await cvTab.close();
      },
    });

    // Page-level checks after the journey.
    await manual.assertNoUntranslatedI18nKeys();
    await manual.assertVisualLayoutHealth('Home Portfolio Page');

    // --- Troubleshooting (each entry is covered by its own test below) ------------------------
    await manual.recordTroubleshootingScenario({
      scenario: 'The language does not change when I pick 中文 or Melayu',
      userMessage: 'The page stays in the current language and the header label does not change.',
      resolution:
        'The language file could not be downloaded (for example, you went offline). The page keeps working in the current language. Check your connection, reload the page and pick the language again.',
    });
    await manual.recordTroubleshootingScenario({
      scenario: 'I cannot see the topic list in Expertise on my phone',
      userMessage: 'On narrow screens the left-hand topic list is replaced by a carousel.',
      resolution:
        'Use the **‹ / ›** arrows or tap one of the dots under the topic name to move between topics.',
      target: expertise.locator('.dashboard-container'),
    });

    // Fails on any console/page error, binds the chapter to the slice fingerprint and writes manual-steps.json.
    await manual.finalize();
  });

  test('[Degraded] a failed language download keeps the current language and does not persist it', async ({
    page,
  }) => {
    await page.route('**/i18n/zh.json', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{"error":"unavailable"}',
      }),
    );
    await page.goto('/');
    await expect(page.locator('a.nav-link').first()).toHaveText('Profile');

    await openLanguageMenu(page);
    const failed = page.waitForResponse('**/i18n/zh.json');
    await page.locator('.lang-dropdown-menu .menu-item').nth(1).click();
    expect((await failed).status()).toBe(500);

    // Label and content stay consistent (both English) and the failed choice is not remembered.
    await expect(page.locator('.lang-dropdown-trigger .active-lang-text.desktop-only')).toHaveText(
      'English (EN)',
    );
    await expect(page.locator('a.nav-link').first()).toHaveText('Profile');
    expect(await page.evaluate(() => localStorage.getItem('preferredLang'))).not.toBe('zh');

    // Once the network recovers, the same switch works.
    await page.unroute('**/i18n/zh.json');
    await openLanguageMenu(page);
    await page.locator('.lang-dropdown-menu .menu-item').nth(1).click();
    await expect(page.locator('a.nav-link').first()).toHaveText('个人简介');
  });

  test('[ms] a returning Malay visitor sees no Chinese text anywhere on the page', async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem('preferredLang', 'ms'));
    await page.goto('/');
    await expect(page.locator('a.nav-link').first()).toHaveText('Profil');

    const expertise = page.locator('app-expertise#expertise');
    await expect(expertise.locator('.content-pane.active .pane-section-title')).toHaveText([
      'Pencapaian Utama',
      'Teknologi Utama',
    ]);
    await expect(page.locator('app-contact .reference-item > span:not(.ref-sub)')).toHaveText([
      'Jurutera Perisian Kanan',
      'Profesor',
    ]);
    const visibleText = await page.locator('body').innerText();
    expect(visibleText.match(CJK), 'CJK characters rendered in the Malay locale').toBeNull();
  });

  test('[Mobile] expertise carousel dots are labelled, keyboard-focusable buttons', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const expertise = page.locator('app-expertise#expertise');
    await expertise.scrollIntoViewIfNeeded();

    const dots = expertise.locator('.carousel-indicators button.indicator-dot');
    await expect(dots).toHaveCount(4);
    await expect(dots.nth(0)).toHaveAttribute('aria-pressed', 'true');
    await expect(dots.nth(3)).toHaveAttribute('aria-label', 'Engineering & Optimization');

    await dots.nth(3).focus();
    await page.keyboard.press('Enter');
    await expect(dots.nth(3)).toHaveAttribute('aria-pressed', 'true');
    await expect(dots.nth(0)).toHaveAttribute('aria-pressed', 'false');
    await expect(expertise.locator('.carousel-label')).toHaveText('Engineering & Optimization');
    await expect(expertise.locator('.carousel-nav-btn').last()).toBeDisabled();

    await expertise.locator('.carousel-nav-btn').first().click();
    await expect(expertise.locator('.carousel-label')).toHaveText('Academic Research');
  });
});
