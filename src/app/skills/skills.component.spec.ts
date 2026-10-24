import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SkillsComponent } from './skills.component';
import { TranslationService } from '../services/translation.service';
import { I18N_FIXTURES, render, switchLanguage, texts } from '../testing/i18n-fixtures';

describe('SkillsComponent', () => {
  let fixture: ComponentFixture<SkillsComponent>;
  let el: HTMLElement;
  let http: HttpTestingController;

  const cards = () => Array.from(el.querySelectorAll<HTMLElement>('.skills-card'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(SkillsComponent);
    el = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
    await render(fixture);
  });

  afterEach(() => http.verify());

  it('renders the development skill bars with widths matching their percentage', () => {
    const items = Array.from(cards()[0].querySelectorAll<HTMLElement>('.skill-bar-item'));
    expect(items).toHaveLength(7);
    items.forEach((item) => {
      const pct = item.querySelector('.skill-percentage')!.textContent!.trim();
      expect(pct).toMatch(/^\d{2,3}%$/);
      const fill = item.querySelector<HTMLElement>('.skill-bar-fill')!;
      expect(fill.style.width).toBe(pct);
    });
    expect(texts(cards()[0], '.skill-name')[0]).toBe('Python (Machine Learning, PyTorch, Pandas)');
  });

  it('every percentage is within 0-100', () => {
    texts(el, '.skill-percentage').forEach((p) => {
      const n = Number(p.replace('%', ''));
      expect(n).toBeGreaterThan(0);
      expect(n).toBeLessThanOrEqual(100);
    });
  });

  it.each([
    ['en', 'English (Professional)', 'Environmental Modelling'],
    ['zh', '英语 (专业熟练)', '环境系统建模'],
    ['ms', 'Bahasa Inggeris (Profesional)', 'Pemodelan Alam Sekitar'],
  ] as const)(
    'localizes language names, proficiency labels and interests in %s',
    async (lang, firstLanguage, firstInterest) => {
      if (lang !== 'en') {
        await switchLanguage(TestBed.inject(TranslationService), http, lang);
        await render(fixture);
      }
      const languageNames = texts(cards()[1], '.skill-name');
      expect(languageNames).toHaveLength(4);
      expect(languageNames[0]).toBe(firstLanguage);

      const interests = texts(el, '.interest-tag');
      expect(interests).toHaveLength(6);
      expect(interests[0]).toBe(firstInterest);

      // language bars use the green accent fill
      expect(cards()[1].querySelectorAll('.skill-bar-fill.accent-green')).toHaveLength(4);
    },
  );

  it.each(['en', 'zh', 'ms'] as const)('renders the %s headings', async (lang) => {
    if (lang !== 'en') {
      await switchLanguage(TestBed.inject(TranslationService), http, lang);
      await render(fixture);
    }
    // eslint-disable-next-line security/detect-object-injection
    const d = I18N_FIXTURES[lang].skills;
    expect(el.querySelector('.section-title')?.textContent).toBe(d.title);
    expect(texts(el, '.skills-card h3')).toEqual([d.devToolsTitle, d.langInterestsTitle]);
    expect(el.querySelector('.interests-container h4')?.textContent).toBe(d.researchInterestsTitle);
  });
});
