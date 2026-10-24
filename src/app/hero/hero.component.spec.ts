import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HeroComponent } from './hero.component';
import { TranslationService } from '../services/translation.service';
import { I18N_FIXTURES, render, switchLanguage } from '../testing/i18n-fixtures';

type FakeCtx = Record<
  'setTransform' | 'clearRect' | 'fillRect' | 'beginPath' | 'moveTo' | 'lineTo' | 'stroke',
  ReturnType<typeof vi.fn>
>;

type FrameRequest = { cb: FrameRequestCallback; id: number };
const WINDOW_EVENTS = ['resize', 'pointermove', 'touchmove', 'touchend', 'pointerdown'];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('HeroComponent', () => {
  let fixture: ComponentFixture<HeroComponent>;
  let el: HTMLElement;
  let http: HttpTestingController;
  let ctx: FakeCtx;
  let frameRequests: FrameRequest[];
  let cancelSpy: ReturnType<typeof vi.spyOn>;
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  /** Frame requests made by the hero's own render loop (Angular's scheduler also uses rAF). */
  const loopRequests = () => {
    const renderFrame = (
      fixture.componentInstance as unknown as { renderFrame: FrameRequestCallback }
    ).renderFrame;
    return frameRequests.filter((r) => r.cb === renderFrame);
  };

  beforeEach(async () => {
    // jsdom has no 2D canvas: provide a recording context so the render loop really runs.
    ctx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => ctx as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1200);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(800);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 1200,
      bottom: 800,
      width: 1200,
      height: 800,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    // Record frame requests without running them; tests drive the loop explicitly.
    frameRequests = [];
    let nextId = 1000;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      const id = nextId++;
      frameRequests.push({ cb, id });
      return id;
    });
    cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    addSpy = vi.spyOn(window, 'addEventListener');
    removeSpy = vi.spyOn(window, 'removeEventListener');

    await TestBed.configureTestingModule({
      imports: [HeroComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroComponent);
    el = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
    await render(fixture);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  describe('content', () => {
    it('renders subtitle and both calls to action from the dictionary', () => {
      const d = I18N_FIXTURES.en.hero;
      expect(el.querySelector('.hero-subtitle')?.textContent?.trim()).toBe(d.subtitle);
      const ctas = Array.from(el.querySelectorAll<HTMLAnchorElement>('.hero-ctas a'));
      expect(ctas.map((a) => a.getAttribute('href'))).toEqual(['#contact', '#publications']);
      expect(ctas[0].textContent).toContain(d.ctaContact);
      expect(ctas[1].textContent).toContain(d.ctaResearch);
    });

    it('renders the single page <h1> and a described profile photo', () => {
      expect(el.querySelectorAll('h1')).toHaveLength(1);
      const img = el.querySelector<HTMLImageElement>('.avatar-frame img')!;
      expect(img.getAttribute('src')).toBe('profile.jpg');
      expect(img.getAttribute('alt')).toBe('Chia Min Yan');
    });

    it('animates the title word-by-word and then lifts it off', async () => {
      await wait(150);
      const title = el.querySelector('#heroTitle')!;
      const words = I18N_FIXTURES.en.hero.title.split(/\s+/);
      expect(title.querySelectorAll('.word-span')).toHaveLength(words.length);
      expect(title.querySelectorAll('.char-span')).toHaveLength(words.join('').length);
      expect(title.textContent).toBe(I18N_FIXTURES.en.hero.title);
      expect(title.classList).toContain('liftoff');
    });

    it('re-runs the animation per character when switching to Chinese', async () => {
      await switchLanguage(TestBed.inject(TranslationService), http, 'zh');
      await render(fixture);
      await wait(150);
      const zhTitle = I18N_FIXTURES.zh.hero.title.replace(/\s+/g, '');
      const title = el.querySelector('#heroTitle')!;
      expect(title.querySelectorAll('.word-span')).toHaveLength(Array.from(zhTitle).length);
      expect(title.textContent?.replace(/\s+/g, '')).toBe(zhTitle);
    });
  });

  describe('particle canvas lifecycle', () => {
    it('sizes the canvas to its container and renders a frame', () => {
      const canvas = el.querySelector<HTMLCanvasElement>('#particleCanvas')!;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      expect(canvas.width).toBe(Math.floor(1200 * dpr));
      expect(canvas.height).toBe(Math.floor(800 * dpr));
      expect(ctx.setTransform).toHaveBeenCalledWith(dpr, 0, 0, dpr, 0, 0);

      // The loop is started once and waits for its first frame.
      expect(loopRequests()).toHaveLength(1);
      loopRequests()[0].cb(performance.now() + 16);

      expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 1200, 800);
      expect(ctx.fillRect).toHaveBeenCalled(); // background dust
      expect(loopRequests()).toHaveLength(2); // the frame re-schedules itself

      // After a resize layout (non-bloom), particles sit on the ring and render capsule strokes.
      window.dispatchEvent(new Event('resize'));
      loopRequests()
        .at(-1)!
        .cb(performance.now() + 32);
      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.moveTo).toHaveBeenCalled();
      expect(ctx.lineTo).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('tracks pointer and touch movement, parts nearby dashes and idles on leave', () => {
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 600, clientY: 400 }));
      loopRequests()
        .at(-1)!
        .cb(performance.now() + 16);

      const touchEvent = new Event('touchmove') as unknown as {
        touches: { item: (_i: number) => { clientX: number; clientY: number } | null };
      };
      touchEvent.touches = { item: () => ({ clientX: 640, clientY: 420 }) };
      window.dispatchEvent(touchEvent as unknown as Event);
      loopRequests()
        .at(-1)!
        .cb(performance.now() + 32);

      window.dispatchEvent(new Event('touchend'));
      document.documentElement.dispatchEvent(new Event('pointerleave'));
      loopRequests()
        .at(-1)!
        .cb(performance.now() + 48);

      expect(ctx.stroke).toHaveBeenCalled();
      expect(loopRequests().length).toBeGreaterThanOrEqual(4);
    });

    it('emits a radial velocity pulse on pointerdown inside the canvas and ignores clicks outside', () => {
      window.dispatchEvent(new Event('resize'));
      const particles = (
        fixture.componentInstance as unknown as {
          particles: Array<{ x: number; y: number; vx: number; vy: number }>;
        }
      ).particles;

      window.dispatchEvent(new PointerEvent('pointerdown', { clientX: -20, clientY: -20 }));
      expect(particles.every((p) => p.vx === 0 && p.vy === 0)).toBe(true);

      const target = particles[0];
      window.dispatchEvent(
        new PointerEvent('pointerdown', { clientX: target.x + 5, clientY: target.y + 5 }),
      );
      expect(particles.some((p) => Math.hypot(p.vx, p.vy) > 0)).toBe(true);
    });

    it('pauses the render loop when scrolled out of view and resumes when visible again', () => {
      let observerCb: IntersectionObserverCallback | undefined;
      const disconnectSpy = vi.fn();
      vi.stubGlobal(
        'IntersectionObserver',
        class {
          constructor(cb: IntersectionObserverCallback) {
            observerCb = cb;
          }
          observe = vi.fn();
          disconnect = disconnectSpy;
        },
      );

      fixture.destroy();
      fixture = TestBed.createComponent(HeroComponent);
      el = fixture.nativeElement;
      fixture.detectChanges();

      const countBeforePause = loopRequests().length;
      observerCb?.(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      loopRequests()
        .at(-1)!
        .cb(performance.now() + 16);
      expect(loopRequests()).toHaveLength(countBeforePause);

      observerCb?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      expect(loopRequests()).toHaveLength(countBeforePause + 1);

      fixture.destroy();
      expect(disconnectSpy).toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

    it('registers passive window listeners for interaction', () => {
      for (const type of WINDOW_EVENTS) {
        expect(addSpy).toHaveBeenCalledWith(type, expect.any(Function), { passive: true });
      }
    });

    it('cancels the pending animation frame and removes every listener on destroy', () => {
      loopRequests()[0].cb(performance.now() + 16);
      const pendingId = loopRequests().at(-1)!.id;
      const added = new Map<string, unknown>(
        (addSpy.mock.calls as unknown[][])
          .filter((call) => WINDOW_EVENTS.includes(String(call[0])))
          .map((call) => [String(call[0]), call[1]] as const),
      );
      fixture.destroy();

      expect(cancelSpy).toHaveBeenCalledWith(pendingId);
      for (const type of WINDOW_EVENTS) {
        expect(removeSpy).toHaveBeenCalledWith(type, added.get(type));
      }
    });

    it('stops scheduling frames after destroy', () => {
      fixture.destroy();
      const before = loopRequests().length;
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('pointerdown'));
      expect(loopRequests()).toHaveLength(before);
      expect(ctx.clearRect).not.toHaveBeenCalled();
    });
  });
});
