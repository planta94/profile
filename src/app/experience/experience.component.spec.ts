import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ExperienceComponent } from './experience.component';
import { TranslationService } from '../services/translation.service';
import { I18N_FIXTURES, render, switchLanguage, texts } from '../testing/i18n-fixtures';

describe('ExperienceComponent', () => {
  let fixture: ComponentFixture<ExperienceComponent>;
  let el: HTMLElement;
  let http: HttpTestingController;
  const jobs = I18N_FIXTURES.en.experience.list;

  const headers = () => Array.from(el.querySelectorAll<HTMLElement>('.card-header'));
  const cards = () => Array.from(el.querySelectorAll<HTMLElement>('.timeline-card'));
  const isExpanded = (i: number) =>
    // eslint-disable-next-line security/detect-object-injection
    cards()[i].classList.contains('expanded') &&
    // eslint-disable-next-line security/detect-object-injection
    headers()[i].getAttribute('aria-expanded') === 'true';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperienceComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ExperienceComponent);
    el = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
    await render(fixture);
  });

  afterEach(() => http.verify());

  it('renders the section header from the dictionary', () => {
    const d = I18N_FIXTURES.en.experience;
    expect(el.querySelector('.section-tag')?.textContent).toBe(d.tag);
    expect(el.querySelector('.section-title')?.textContent).toBe(d.title);
    expect(el.querySelector('.section-desc')?.textContent).toBe(d.desc);
  });

  it('renders one timeline card per role with role, company and period', () => {
    expect(el.querySelectorAll('.timeline-item')).toHaveLength(jobs.length);
    expect(texts(el, '.role-title')).toEqual(jobs.map((j) => j.role));
    expect(texts(el, '.company-name')).toEqual(jobs.map((j) => j.company));
    expect(texts(el, '.period-badge')).toEqual(jobs.map((j) => j.period));
  });

  it('marks only the latest role as current', () => {
    const badges = el.querySelectorAll('.period-badge');
    expect(badges[0].classList).toContain('current');
    expect(el.querySelectorAll('.period-badge.current')).toHaveLength(1);
  });

  it('renders every bullet of every role', () => {
    cards().forEach((card, i) => {
      // eslint-disable-next-line security/detect-object-injection
      expect(texts(card, '.experience-bullets li')).toEqual(jobs[i].bullets);
    });
  });

  it('renders a tech-stack row only for roles that declare a tech list', () => {
    cards().forEach((card, i) => {
      // eslint-disable-next-line security/detect-object-injection
      const tech = jobs[i].tech;
      const row = card.querySelector('.tech-stack-row');
      if (tech) {
        expect(texts(card, '.tech-pill')).toEqual(tech);
      } else {
        expect(row).toBeNull();
      }
    });
    expect(jobs.some((j) => !j.tech)).toBe(true);
  });

  describe('expand / collapse', () => {
    it('expands only the latest role by default and exposes aria-expanded', () => {
      expect(isExpanded(0)).toBe(true);
      for (let i = 1; i < jobs.length; i++) {
        expect(isExpanded(i)).toBe(false);
        // eslint-disable-next-line security/detect-object-injection
        expect(headers()[i].getAttribute('aria-expanded')).toBe('false');
      }
    });

    it('headers are keyboard-focusable buttons', () => {
      headers().forEach((h) => {
        expect(h.getAttribute('role')).toBe('button');
        expect(h.getAttribute('tabindex')).toBe('0');
      });
    });

    it('toggles a card on click and rotates its icon', async () => {
      headers()[2].click();
      await render(fixture);
      expect(isExpanded(2)).toBe(true);
      expect(cards()[2].querySelector('.expand-icon')!.classList).toContain('rotated');

      headers()[2].click();
      await render(fixture);
      expect(isExpanded(2)).toBe(false);
    });

    it('collapses the default-expanded card when clicked', async () => {
      headers()[0].click();
      await render(fixture);
      expect(isExpanded(0)).toBe(false);
    });

    it('toggles with the Enter key', async () => {
      headers()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await render(fixture);
      expect(isExpanded(1)).toBe(true);
    });

    it('toggles with the Space key without scrolling the page', async () => {
      const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      headers()[3].dispatchEvent(space);
      await render(fixture);
      expect(isExpanded(3)).toBe(true);
      expect(space.defaultPrevented).toBe(true);
    });

    it('keeps the timeline dot of the latest role highlighted and lights expanded ones', async () => {
      headers()[1].click();
      await render(fixture);
      const dots = el.querySelectorAll('.timeline-dot');
      expect(dots[0].classList).toContain('active');
      expect(dots[1].classList).toContain('active');
      expect(dots[2].classList).not.toContain('active');
    });
  });

  it.each(['zh', 'ms'] as const)('re-renders roles in %s', async (lang) => {
    await switchLanguage(TestBed.inject(TranslationService), http, lang);
    await render(fixture);
    expect(texts(el, '.role-title')).toEqual(
      // eslint-disable-next-line security/detect-object-injection
      I18N_FIXTURES[lang].experience.list.map((j) => j.role),
    );
  });
});
