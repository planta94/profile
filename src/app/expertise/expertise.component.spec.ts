import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ExpertiseComponent } from './expertise.component';
import { TranslationService } from '../services/translation.service';
import { I18N_FIXTURES, render, switchLanguage, texts } from '../testing/i18n-fixtures';

describe('ExpertiseComponent', () => {
  let fixture: ComponentFixture<ExpertiseComponent>;
  let el: HTMLElement;
  let http: HttpTestingController;
  const tabs = I18N_FIXTURES.en.expertise.tabs;

  const tabButtons = () => Array.from(el.querySelectorAll<HTMLButtonElement>('.tab-btn'));
  const panes = () => Array.from(el.querySelectorAll<HTMLElement>('.content-pane'));
  const dots = () => Array.from(el.querySelectorAll<HTMLButtonElement>('.indicator-dot'));
  const [prevBtn, nextBtn] = [
    () => el.querySelector<HTMLButtonElement>('[aria-label="Previous Domain"]')!,
    () => el.querySelector<HTMLButtonElement>('[aria-label="Next Domain"]')!,
  ];
  const activePaneIndex = () => panes().findIndex((p) => p.classList.contains('active'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpertiseComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpertiseComponent);
    el = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
    await render(fixture);
  });

  afterEach(() => http.verify());

  it('renders a desktop tab, a content pane and a carousel dot per focus area', () => {
    expect(tabButtons()).toHaveLength(tabs.length);
    expect(panes()).toHaveLength(tabs.length);
    expect(dots()).toHaveLength(tabs.length);
    expect(texts(el, '.tab-title')).toEqual(tabs.map((t) => t.title));
    expect(texts(el, '.tab-subtitle')).toEqual(tabs.map((t) => t.subtitle));
  });

  it('renders each pane with badge, description, accomplishments and tech tags', () => {
    panes().forEach((pane, i) => {
      // eslint-disable-next-line security/detect-object-injection
      const tab = tabs[i];
      expect(pane.querySelector('h3')?.textContent).toBe(tab.title);
      expect(pane.querySelector('.pane-badge')?.textContent).toBe(tab.badge);
      expect(pane.querySelector('.pane-description')?.textContent).toBe(tab.description);
      expect(texts(pane, '.accomplishments-list li')).toEqual(tab.bullets);
      expect(texts(pane, '.tech-tag')).toEqual(tab.tech);
    });
  });

  it('shows the first focus area by default', () => {
    expect(activePaneIndex()).toBe(0);
    expect(tabButtons()[0].classList).toContain('active');
    expect(el.querySelectorAll('.tab-btn.active')).toHaveLength(1);
  });

  it('switches pane when a desktop tab is clicked', async () => {
    tabButtons()[2].click();
    await render(fixture);
    expect(activePaneIndex()).toBe(2);
    expect(el.querySelectorAll('.content-pane.active')).toHaveLength(1);
    expect(tabButtons()[2].classList).toContain('active');
  });

  describe('mobile carousel', () => {
    it('disables "previous" on the first item and advances with "next"', async () => {
      expect(prevBtn().disabled).toBe(true);
      expect(el.querySelector('.carousel-label')?.textContent).toBe(tabs[0].title);

      nextBtn().click();
      await render(fixture);
      expect(activePaneIndex()).toBe(1);
      expect(prevBtn().disabled).toBe(false);
      expect(el.querySelector('.carousel-label')?.textContent).toBe(tabs[1].title);
    });

    it('disables "next" on the last item and never overflows past it', async () => {
      for (let i = 0; i < tabs.length + 2; i++) {
        nextBtn().click();
        await render(fixture);
      }
      expect(activePaneIndex()).toBe(tabs.length - 1);
      expect(nextBtn().disabled).toBe(true);
    });

    it('steps back with "previous" and never goes below the first item', async () => {
      nextBtn().click();
      nextBtn().click();
      await render(fixture);
      prevBtn().click();
      await render(fixture);
      expect(activePaneIndex()).toBe(1);

      (fixture.componentInstance as unknown as { prevTab(): void }).prevTab();
      (fixture.componentInstance as unknown as { prevTab(): void }).prevTab();
      await render(fixture);
      expect(activePaneIndex()).toBe(0);
    });

    it('indicator dots are labelled buttons that jump to their focus area', async () => {
      dots().forEach((dot, i) => {
        expect(dot.tagName).toBe('BUTTON');
        expect(dot.getAttribute('type')).toBe('button');
        // eslint-disable-next-line security/detect-object-injection
        expect(dot.getAttribute('aria-label')).toBe(tabs[i].title);
      });
      expect(dots()[0].getAttribute('aria-pressed')).toBe('true');

      dots()[3].click();
      await render(fixture);
      expect(activePaneIndex()).toBe(3);
      expect(dots()[3].getAttribute('aria-pressed')).toBe('true');
      expect(dots()[0].getAttribute('aria-pressed')).toBe('false');
    });
  });

  describe('localized pane headings', () => {
    it.each(['en', 'zh', 'ms'] as const)('uses the %s dictionary headings', async (lang) => {
      if (lang !== 'en') {
        await switchLanguage(TestBed.inject(TranslationService), http, lang);
        await render(fixture);
      }
      // eslint-disable-next-line security/detect-object-injection
      const d = I18N_FIXTURES[lang].expertise;
      const headings = texts(panes()[0], '.pane-section-title');
      expect(headings).toEqual([d.accomplishmentsTitle, d.techStackTitle]);
    });

    it('never shows Chinese headings in Malay (regression)', async () => {
      await switchLanguage(TestBed.inject(TranslationService), http, 'ms');
      await render(fixture);
      const all = texts(el, '.pane-section-title').join(' ');
      expect(all).not.toMatch(/[\u4e00-\u9fff]/);
    });
  });
});
