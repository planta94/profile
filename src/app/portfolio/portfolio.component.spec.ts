import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PortfolioComponent } from './portfolio.component';
import { render } from '../testing/i18n-fixtures';

const SECTIONS = ['about', 'expertise', 'experience', 'publications', 'skills', 'contact'];

/** Places `activeId` across the 180px trigger line and every other section far below it. */
function layoutSections(root: HTMLElement, activeId: string | null) {
  for (const id of SECTIONS) {
    const section = root.querySelector<HTMLElement>(`#${id}`)!;
    const top = id === activeId ? 100 : 5000;
    section.getBoundingClientRect = () => ({ top, bottom: top + 600 }) as DOMRect;
  }
}

describe('PortfolioComponent', () => {
  let fixture: ComponentFixture<PortfolioComponent>;
  let el: HTMLElement;

  const activeNav = () =>
    Array.from(el.querySelectorAll('app-header a.nav-link.active')).map((a) =>
      a.getAttribute('href'),
    );

  beforeEach(async () => {
    // The hero canvas is covered by its own spec; keep jsdom quiet here.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await TestBed.configureTestingModule({
      imports: [PortfolioComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioComponent);
    el = fixture.nativeElement;
    await render(fixture);
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.restoreAllMocks();
  });

  it('composes the header and every section, in navigation order, inside <main>', () => {
    expect(el.querySelectorAll('app-header')).toHaveLength(1);
    const main = el.querySelector('main.main-content')!;
    expect(Array.from(main.children).map((c) => [c.tagName.toLowerCase(), c.id])).toEqual([
      ['app-hero', 'about'],
      ['app-expertise', 'expertise'],
      ['app-experience', 'experience'],
      ['app-publications', 'publications'],
      ['app-skills', 'skills'],
      ['app-contact', 'contact'],
    ]);
  });

  it('every header anchor points at a section that exists on the page', () => {
    const hrefs = Array.from(el.querySelectorAll('app-header a.nav-link')).map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toEqual(SECTIONS.map((id) => `#${id}`));
    for (const href of hrefs) {
      expect(el.querySelectorAll(href!)).toHaveLength(1);
    }
  });

  it('highlights "about" on first render', () => {
    expect(activeNav()).toEqual(['#about']);
  });

  it.each(['expertise', 'publications', 'contact'])(
    'highlights "%s" when it crosses the trigger line while scrolling',
    async (id) => {
      layoutSections(el, id);
      window.dispatchEvent(new Event('scroll'));
      await render(fixture);
      expect(activeNav()).toEqual([`#${id}`]);
    },
  );

  it('falls back to "about" when no section crosses the trigger line', async () => {
    layoutSections(el, 'skills');
    window.dispatchEvent(new Event('scroll'));
    await render(fixture);
    layoutSections(el, null);
    window.dispatchEvent(new Event('scroll'));
    await render(fixture);
    expect(activeNav()).toEqual(['#about']);
  });

  it('removes the exact scroll listener it registered on destroy', async () => {
    TestBed.resetTestingModule();
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    await TestBed.configureTestingModule({
      imports: [PortfolioComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const f = TestBed.createComponent(PortfolioComponent);
    await render(f);

    const registered = addSpy.mock.calls.find(([type]) => type === 'scroll');
    expect(registered?.[2]).toEqual({ passive: true });
    f.destroy();
    expect(removeSpy).toHaveBeenCalledWith('scroll', registered?.[1]);
  });
});
