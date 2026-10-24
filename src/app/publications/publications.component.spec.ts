import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PublicationsComponent } from './publications.component';
import { TranslationService } from '../services/translation.service';
import { I18N_FIXTURES, render, switchLanguage, texts } from '../testing/i18n-fixtures';

describe('PublicationsComponent', () => {
  let fixture: ComponentFixture<PublicationsComponent>;
  let el: HTMLElement;
  let http: HttpTestingController;

  const cards = () => Array.from(el.querySelectorAll<HTMLElement>('.pub-card'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicationsComponent);
    el = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
    await render(fixture);
  });

  afterEach(() => http.verify());

  it('renders the five selected Q1 publications newest-first', () => {
    expect(cards()).toHaveLength(5);
    const years = texts(el, '.pub-year').map(Number);
    expect(years).toEqual([...years].sort((a, b) => b - a));
    expect(texts(el, '.pub-journal span:last-child')).toEqual([
      'Atmospheric Environment',
      'Journal of Hydrology',
      'Applied Soft Computing',
      'Agricultural Water Management',
      'Computers and Electronics in Agriculture',
    ]);
  });

  it('labels every card with its journal tier and applies the Q1 style', () => {
    cards().forEach((card) => {
      const tier = card.querySelector('.pub-tier')!;
      expect(tier.textContent?.trim()).toBe('Q1 Journal');
      expect(tier.classList).toContain('q1');
    });
  });

  it('highlights the author exactly once per paper, for both initial spellings', () => {
    cards().forEach((card) => {
      const strong = texts(card, '.pub-authors strong');
      expect(strong).toHaveLength(1);
      expect(strong[0]).toMatch(/^Chia, M\. ?Y\.$/);
    });
    // The Applied Soft Computing paper lists the author as "Chia, M. Y." (spaced initials).
    expect(texts(cards()[2], '.pub-authors strong')).toEqual(['Chia, M. Y.']);
  });

  it('separates authors with commas and no trailing comma', () => {
    const authors = texts(cards()[1], '.pub-authors').join('');
    expect(authors).toBe('Wai, K.P., Chia, M.Y., Koo, C.H., Huang, Y.F., Chong, W.C.');
    expect(authors.endsWith(',')).toBe(false);
  });

  it.each(['en', 'zh', 'ms'] as const)('renders the %s section header', async (lang) => {
    if (lang !== 'en') {
      await switchLanguage(TestBed.inject(TranslationService), http, lang);
      await render(fixture);
    }
    // eslint-disable-next-line security/detect-object-injection
    const d = I18N_FIXTURES[lang].publications;
    expect(el.querySelector('.section-tag')?.textContent).toBe(d.tag);
    expect(el.querySelector('.section-title')?.textContent).toBe(d.title);
    expect(el.querySelector('.section-desc')?.textContent).toBe(d.desc);
  });
});
