import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HeaderComponent } from './header.component';
import { TranslationService } from '../services/translation.service';
import { I18N_FIXTURES, render, switchLanguage, texts } from '../testing/i18n-fixtures';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let el: HTMLElement;
  let ts: TranslationService;
  let http: HttpTestingController;

  const trigger = () => el.querySelector<HTMLButtonElement>('.lang-dropdown-trigger')!;
  const menu = () => el.querySelector('.lang-dropdown-menu');
  const menuItems = () => Array.from(el.querySelectorAll<HTMLButtonElement>('.menu-item'));

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    el = fixture.nativeElement;
    ts = TestBed.inject(TranslationService);
    http = TestBed.inject(HttpTestingController);
    await render(fixture);
  });

  afterEach(() => http.verify());

  describe('branding', () => {
    it('renders the monogram and a decorative (alt="") avatar to avoid redundant announcements', () => {
      expect(el.querySelector('.logo-text')?.textContent).toBe('CHIA MIN YAN');
      const avatar = el.querySelector<HTMLImageElement>('.logo-avatar')!;
      expect(avatar.getAttribute('alt')).toBe('');
      expect(avatar.getAttribute('src')).toBe('profile.jpg');
    });
  });

  describe('section navigation', () => {
    it('renders one anchor per page section with localized labels', () => {
      const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('a.nav-link'));
      expect(links.map((a) => a.getAttribute('href'))).toEqual([
        '#about',
        '#expertise',
        '#experience',
        '#publications',
        '#skills',
        '#contact',
      ]);
      const h = I18N_FIXTURES.en.header;
      expect(texts(el, 'a.nav-link')).toEqual([
        h.about,
        h.expertise,
        h.experience,
        h.publications,
        h.skills,
        h.contact,
      ]);
    });

    it('highlights "about" by default', () => {
      expect(texts(el, 'a.nav-link.active')).toEqual([I18N_FIXTURES.en.header.about]);
    });

    it.each(['expertise', 'experience', 'publications', 'skills', 'contact'])(
      'highlights only the "%s" link when activeSection input changes',
      async (section) => {
        fixture.componentRef.setInput('activeSection', section);
        await render(fixture);
        const active = el.querySelectorAll('a.nav-link.active');
        expect(active).toHaveLength(1);
        expect(active[0].getAttribute('href')).toBe(`#${section}`);
      },
    );
  });

  describe('language dropdown', () => {
    it('is closed initially and toggles open/closed from the trigger', async () => {
      expect(menu()).toBeNull();
      expect(trigger().classList).not.toContain('active');

      trigger().click();
      await render(fixture);
      expect(el.querySelectorAll('.lang-dropdown-menu')).toHaveLength(1);
      expect(trigger().classList).toContain('active');
      expect(el.querySelector('.arrow-icon')!.classList).toContain('rotated');

      trigger().click();
      await render(fixture);
      expect(menu()).toBeNull();
    });

    it('lists the 3 supported languages and marks only the current one', async () => {
      trigger().click();
      await render(fixture);
      expect(texts(el, '.menu-item .item-text')).toEqual([
        'English (EN)',
        '中文 (ZH)',
        'Melayu (BM)',
      ]);
      expect(el.querySelectorAll('.menu-item.selected')).toHaveLength(1);
      expect(menuItems()[0].classList).toContain('selected');
      expect(el.querySelectorAll('.check-icon')).toHaveLength(1);
      expect(menuItems()[0].querySelectorAll('.check-icon')).toHaveLength(1);
    });

    it.each([
      ['zh', 1, '中文 (ZH)', '中'],
      ['ms', 2, 'Melayu (BM)', 'BM'],
    ] as const)(
      'selecting %s closes the menu, re-renders the header and marks %s when reopened',
      async (lang, index, desktopLabel, mobileLabel) => {
        const spy = vi.spyOn(ts, 'setLanguage');
        trigger().click();
        await render(fixture);

        // eslint-disable-next-line security/detect-object-injection
        menuItems()[index].click();
        expect(spy).toHaveBeenCalledWith(lang);
        // eslint-disable-next-line security/detect-object-injection
        http.expectOne(`i18n/${lang}.json`).flush(I18N_FIXTURES[lang]);
        await spy.mock.results[0].value;
        await render(fixture);

        expect(menu()).toBeNull();
        expect(el.querySelector('.active-lang-text.desktop-only')?.textContent).toBe(desktopLabel);
        expect(el.querySelector('.active-lang-text.mobile-only')?.textContent?.trim()).toBe(
          mobileLabel,
        );
        // eslint-disable-next-line security/detect-object-injection
        expect(texts(el, 'a.nav-link')[0]).toBe(I18N_FIXTURES[lang].header.about);

        // Reopen the menu to verify the check icon moved to the active language, then switch back to English.
        trigger().click();
        await render(fixture);
        // eslint-disable-next-line security/detect-object-injection
        expect(menuItems()[index].classList).toContain('selected');
        // eslint-disable-next-line security/detect-object-injection
        expect(menuItems()[index].querySelectorAll('.check-icon')).toHaveLength(1);

        menuItems()[0].click();
        http.expectOne('i18n/en.json').flush(I18N_FIXTURES.en);
        await fixture.whenStable();
        await render(fixture);
        expect(el.querySelector('.active-lang-text.desktop-only')?.textContent).toBe(
          'English (EN)',
        );
      },
    );

    it('closes when the user clicks anywhere outside the header', async () => {
      trigger().click();
      await render(fixture);
      document.body.click();
      await render(fixture);
      expect(menu()).toBeNull();
    });

    it('stays open when the click lands inside the header', async () => {
      trigger().click();
      await render(fixture);
      el.querySelector<HTMLElement>('.logo-text')!.click();
      await render(fixture);
      expect(el.querySelectorAll('.lang-dropdown-menu')).toHaveLength(1);
      expect(trigger().classList).toContain('active');
    });

    it('keeps the trigger accessible name aligned with its visible text (WCAG 2.5.3)', () => {
      expect(trigger().hasAttribute('aria-label')).toBe(false);
      expect(trigger().textContent).toContain('English (EN)');
    });
  });

  describe('Download CV link', () => {
    it('opens the CV route in a new tab carrying the current language', async () => {
      const cv = el.querySelector<HTMLAnchorElement>('a.btn-cv')!;
      expect(cv.getAttribute('target')).toBe('_blank');
      expect(cv.getAttribute('href')).toBe('/cv?lang=en');
      expect(cv.textContent).toContain(I18N_FIXTURES.en.header.downloadCv);

      await switchLanguage(ts, http, 'ms');
      await render(fixture);
      expect(cv.getAttribute('href')).toBe('/cv?lang=ms');
      expect(cv.textContent).toContain(I18N_FIXTURES.ms.header.downloadCv);
    });
  });
});
