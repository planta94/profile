import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CvComponent } from './cv.component';
import { TranslationService } from '../services/translation.service';
import { I18N_FIXTURES, Lang, render, switchLanguage, texts } from '../testing/i18n-fixtures';

const { html2canvasMock, addPageMock, addImageMock, saveMock, jsPdfOptions } = vi.hoisted(() => ({
  html2canvasMock: vi.fn(),
  addPageMock: vi.fn(),
  addImageMock: vi.fn(),
  saveMock: vi.fn(),
  jsPdfOptions: [] as unknown[],
}));

vi.mock('html2canvas', () => ({ default: html2canvasMock }));
vi.mock('jspdf', () => ({
  jsPDF: class {
    constructor(opts: unknown) {
      jsPdfOptions.push(opts);
    }
    addPage = addPageMock;
    addImage = addImageMock;
    save = saveMock;
  },
}));

type CvInternals = { renderPdf(): Promise<void> };

const SIDEBAR_TITLES: Record<Lang, string[]> = {
  en: ['Contact', 'Education', 'Core Skills', 'Affiliations'],
  zh: ['联系方式', '教育背景', '专业技能', '专业协会'],
  ms: ['Hubungi', 'Pendidikan', 'Kemahiran Utama', 'Gabungan Profesional'],
};
const REF_TITLES: Record<Lang, string[]> = {
  en: ['Senior Software Engineer', 'Professor'],
  zh: ['高级软件工程师', '教授'],
  ms: ['Jurutera Perisian Kanan', 'Profesor'],
};
const PAGE2_TITLES: Record<Lang, string> = {
  en: 'Research Experience',
  zh: '研究经历',
  ms: 'Pengalaman Penyelidikan',
};

function configure() {
  return TestBed.configureTestingModule({
    imports: [CvComponent],
    providers: [
      provideRouter([{ path: 'cv', component: CvComponent }]),
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  }).compileComponents();
}

describe('CvComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => localStorage.clear());
  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  describe('rendered document', () => {
    let fixture: ComponentFixture<CvComponent>;
    let el: HTMLElement;
    const pages = () => Array.from(el.querySelectorAll<HTMLElement>('.cv-page'));

    beforeEach(async () => {
      await configure();
      http = TestBed.inject(HttpTestingController);
      fixture = TestBed.createComponent(CvComponent);
      el = fixture.nativeElement;
      await render(fixture);
    });

    it('lays the CV out as exactly two A4 pages with page numbers', () => {
      expect(pages()).toHaveLength(2);
      expect(texts(el, '.page-number')).toEqual(['Page 1 of 2', 'Page 2 of 2']);
      pages().forEach((p) => {
        expect(p.querySelectorAll('.sidebar')).toHaveLength(1);
        expect(p.querySelectorAll('.divider')).toHaveLength(1);
        expect(p.querySelectorAll('.main-content')).toHaveLength(1);
      });
    });

    it('uses the dedicated CV photo, not the website photo', () => {
      const avatar = el.querySelector<HTMLImageElement>('.sidebar img.avatar')!;
      expect(avatar.getAttribute('src')).toBe('profile_cv.jpg');
      expect(avatar.getAttribute('alt')).toBe('Profile');
    });

    it('page 1: name, contact links, 3 degrees, 12 core skills and every job from the dictionary', () => {
      const p1 = pages()[0];
      expect(p1.querySelector('h1.name')?.textContent).toBe('Chia Min Yan');
      expect(
        Array.from(p1.querySelectorAll('.contact-val[href]')).map((a) => a.getAttribute('href')),
      ).toEqual(['mailto:chiamy94@gmail.com', 'tel:+60192508182']);
      expect(p1.querySelectorAll('.edu-item')).toHaveLength(3);
      expect(p1.querySelectorAll('.skill-badge')).toHaveLength(12);
      const jobs = I18N_FIXTURES.en.experience.list;
      expect(texts(p1, '.job-role')).toEqual(jobs.map((j) => j.role));
      expect(texts(p1, '.job-period')).toEqual(jobs.map((j) => j.period));
    });

    it('page 1: renders tech badges only for jobs that declare a tech list', () => {
      const jobItems = Array.from(pages()[0].querySelectorAll('.job-item'));
      jobItems.forEach((item, i) => {
        // eslint-disable-next-line security/detect-object-injection
        const tech = I18N_FIXTURES.en.experience.list[i].tech;
        expect(item.querySelector('.tech-list') !== null).toBe(!!tech);
      });
    });

    it('page 2: research roles, 5 publications, 4 affiliations, 5 activities, 2 references', () => {
      const p2 = pages()[1];
      expect(p2.querySelectorAll('.job-item')).toHaveLength(2);
      expect(p2.querySelectorAll('.main-content > div:nth-child(2) li')).toHaveLength(5);
      expect(p2.querySelectorAll('.sidebar .edu-item')).toHaveLength(4);
      expect(p2.querySelectorAll('.main-content > div:nth-child(3) li')).toHaveLength(5);
      expect(p2.querySelectorAll('.ref-card')).toHaveLength(2);
    });

    it('bolds the author in every citation, for both initial spellings', () => {
      const cv = fixture.componentInstance;
      expect(cv.formatAuthors(['Wong, Y.J.', ' Chia, M.Y. ', 'Koo, C.H.'])).toBe(
        'Wong, Y.J., <strong>Chia, M.Y.</strong>, Koo, C.H.',
      );
      expect(cv.formatAuthors(['Chia, M. Y.'])).toBe('<strong>Chia, M. Y.</strong>');
      const citations = Array.from(
        pages()[1].querySelectorAll('.main-content > div:nth-child(2) li'),
      );
      citations.forEach((li) => expect(li.querySelectorAll('strong')).toHaveLength(1));
    });

    describe('action bar', () => {
      const langButtons = () =>
        Array.from(el.querySelectorAll<HTMLButtonElement>('.lang-selector .btn'));
      const printBtn = () => el.querySelector<HTMLButtonElement>('.btn-print')!;

      it('offers 3 languages with the current one active, and an enabled Download PDF button', () => {
        expect(texts(el, '.lang-selector .btn')).toEqual(['English', '中文', 'Melayu']);
        expect(langButtons()[0].classList).toContain('active');
        expect(el.querySelectorAll('.lang-selector .btn.active')).toHaveLength(1);
        expect(printBtn().textContent?.trim()).toBe('Download PDF');
        expect(printBtn().disabled).toBe(false);
      });

      it.each([
        [1, 'zh'],
        [2, 'ms'],
      ] as const)('button %i switches the whole CV to %s', async (index, lang) => {
        // eslint-disable-next-line security/detect-object-injection
        langButtons()[index].click();
        // eslint-disable-next-line security/detect-object-injection
        http.expectOne(`i18n/${lang}.json`).flush(I18N_FIXTURES[lang]);
        await fixture.whenStable();
        await render(fixture);
        // eslint-disable-next-line security/detect-object-injection
        expect(langButtons()[index].classList).toContain('active');
        // eslint-disable-next-line security/detect-object-injection
        expect(texts(el, '.sidebar-section-title')).toEqual(SIDEBAR_TITLES[lang]);
      });

      it('shows a busy, disabled button while the PDF renders and resets it afterwards', async () => {
        // Hand change detection to the zoneless scheduler, exactly like the running app.
        fixture.autoDetectChanges();
        let finish!: () => void;
        vi.spyOn(
          fixture.componentInstance as unknown as CvInternals,
          'renderPdf',
        ).mockImplementation(() => new Promise<void>((resolve) => (finish = resolve)));

        printBtn().click();
        await render(fixture);
        expect(printBtn().disabled).toBe(true);
        expect(printBtn().textContent?.trim()).toBe('Generating PDF...');

        finish();
        // Let printPage's await/finally chain settle, then rely on the zoneless scheduler
        // (no manual detectChanges) to pick the reset up by itself.
        await new Promise<void>((resolve) => setTimeout(resolve));
        await fixture.whenStable();
        expect(printBtn().disabled).toBe(false);
        expect(printBtn().textContent?.trim()).toBe('Download PDF');
      });

      it('resets the button even when PDF rendering fails', async () => {
        vi.spyOn(
          fixture.componentInstance as unknown as CvInternals,
          'renderPdf',
        ).mockRejectedValue(new Error('canvas tainted'));
        await expect(fixture.componentInstance.printPage()).rejects.toThrow('canvas tainted');
        await fixture.whenStable();
        expect(printBtn().disabled).toBe(false);
      });

      it('renders both CV pages at 4x scale into an A4 PDF and restores their transforms', async () => {
        jsPdfOptions.length = 0;
        html2canvasMock.mockReset();
        addPageMock.mockReset();
        addImageMock.mockReset();
        saveMock.mockReset();

        const [p1, p2] = pages();
        p1.style.transform = 'scale(0.8)';
        p1.style.transformOrigin = 'center top';
        const capturedTransforms: string[] = [];

        html2canvasMock.mockImplementation(async (pageEl: HTMLElement) => {
          capturedTransforms.push(`${pageEl.style.transform}|${pageEl.style.transformOrigin}`);
          return {
            toDataURL: () => 'data:image/png;base64,fake-page',
          } as unknown as HTMLCanvasElement;
        });

        await fixture.componentInstance.printPage();

        expect(jsPdfOptions).toEqual([
          { orientation: 'portrait', unit: 'pt', format: 'a4', compress: true },
        ]);
        expect(html2canvasMock).toHaveBeenCalledTimes(2);
        expect(html2canvasMock).toHaveBeenNthCalledWith(
          1,
          p1,
          expect.objectContaining({ scale: 4, useCORS: true, backgroundColor: '#ffffff' }),
        );
        expect(capturedTransforms).toEqual(['none|top left', 'none|top left']);
        expect(p1.style.transform).toBe('scale(0.8)');
        expect(p1.style.transformOrigin).toBe('center top');
        expect(p2.style.transform).toBe('');
        expect(addPageMock).toHaveBeenCalledTimes(1);
        expect(addImageMock).toHaveBeenCalledTimes(2);
        expect(addImageMock).toHaveBeenCalledWith(
          'data:image/png;base64,fake-page',
          'PNG',
          0,
          0,
          595.28,
          841.89,
        );
        expect(saveMock).toHaveBeenCalledWith('CV_Chia_Min_Yan.pdf');
      });
    });

    describe.each(['en', 'zh', 'ms'] as const)('localized content (%s)', (lang) => {
      beforeEach(async () => {
        if (lang !== 'en') {
          await switchLanguage(TestBed.inject(TranslationService), http, lang);
          await render(fixture);
        }
      });

      it('translates sidebar headings, page-2 heading and reference titles', () => {
        // eslint-disable-next-line security/detect-object-injection
        expect(texts(el, '.sidebar-section-title')).toEqual(SIDEBAR_TITLES[lang]);
        // eslint-disable-next-line security/detect-object-injection
        expect(texts(pages()[1], '.section-title')[0]).toBe(PAGE2_TITLES[lang]);
        // eslint-disable-next-line security/detect-object-injection
        expect(texts(el, '.ref-title')).toEqual(REF_TITLES[lang]);
      });

      it('translates the dictionary-driven sections', () => {
        // eslint-disable-next-line security/detect-object-injection
        const d = I18N_FIXTURES[lang];
        expect(texts(pages()[0], '.section-title')).toEqual([d.header.about, d.header.experience]);
        expect(texts(pages()[0], '.job-role')).toEqual(d.experience.list.map((j) => j.role));
        expect(texts(el, '.contact-label')).toEqual([
          d.contact.emailLabel,
          d.contact.phoneLabel,
          d.contact.locationLabel,
        ]);
      });

      it('keeps the same document structure in every language', () => {
        expect(pages()).toHaveLength(2);
        expect(el.querySelectorAll('.edu-item')).toHaveLength(3 + 4);
        expect(pages()[1].querySelectorAll('.job-item')).toHaveLength(2);
      });
    });
  });

  describe('?lang= deep links', () => {
    beforeEach(async () => {
      await configure();
      http = TestBed.inject(HttpTestingController);
    });

    it.each(['zh', 'ms'] as const)('/cv?lang=%s loads and renders that language', async (lang) => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(`/cv?lang=${lang}`, CvComponent);
      // eslint-disable-next-line security/detect-object-injection
      http.expectOne(`i18n/${lang}.json`).flush(I18N_FIXTURES[lang]);
      await harness.fixture.whenStable();
      harness.detectChanges();
      const el = harness.routeNativeElement!;
      // eslint-disable-next-line security/detect-object-injection
      expect(texts(el, '.sidebar-section-title')[0]).toBe(SIDEBAR_TITLES[lang][0]);
      expect(TestBed.inject(TranslationService).currentLang()).toBe(lang);
    });

    it('reacts when only the query param changes on the same page', async () => {
      const harness = await RouterTestingHarness.create();
      const first = await harness.navigateByUrl('/cv?lang=zh', CvComponent);
      http.expectOne('i18n/zh.json').flush(I18N_FIXTURES.zh);
      const second = await harness.navigateByUrl('/cv?lang=ms', CvComponent);
      http.expectOne('i18n/ms.json').flush(I18N_FIXTURES.ms);
      expect(second).toBe(first);
    });

    it.each(['fr', '', 'ZH'])('ignores unsupported value "%s"', async (value) => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(`/cv?lang=${value}`, CvComponent);
      http.expectNone(() => true);
      expect(TestBed.inject(TranslationService).currentLang()).toBe('en');
    });

    it('does not refetch when ?lang= matches the current language', async () => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/cv?lang=en', CvComponent);
      http.expectNone('i18n/en.json');
    });
  });
});
