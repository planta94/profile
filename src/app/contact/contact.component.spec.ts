import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ContactComponent } from './contact.component';
import { TranslationService } from '../services/translation.service';
import { I18N_FIXTURES, render, switchLanguage, texts } from '../testing/i18n-fixtures';

describe('ContactComponent', () => {
  let fixture: ComponentFixture<ContactComponent>;
  let el: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    el = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
    await render(fixture);
  });

  afterEach(() => http.verify());

  it('exposes actionable email and phone links', () => {
    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('.contact-details a'));
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      'mailto:chiamy94@gmail.com',
      'tel:+60192508182',
    ]);
    expect(texts(el, '.contact-details .detail-val')).toEqual([
      'chiamy94@gmail.com',
      '+60 192508182',
      'Selangor, Malaysia',
    ]);
  });

  it('lists two professional references with mailto links', () => {
    const refs = Array.from(el.querySelectorAll<HTMLElement>('.reference-item'));
    expect(refs).toHaveLength(2);
    expect(texts(el, '.reference-item strong')).toEqual([
      'Lee Yuen Fai',
      'Prof. Ir. Dr. Huang Yuk Feng',
    ]);
    expect(
      Array.from(el.querySelectorAll('.ref-email')).map((a) => a.getAttribute('href')),
    ).toEqual(['mailto:bryan.lee@juiceuptoday.com', 'mailto:huangyf@utar.edu.my']);
  });

  it('renders the footer copyright', () => {
    expect(el.querySelector('footer.footer')?.textContent).toContain('© 2026 Chia Min Yan.');
  });

  describe.each(['en', 'zh', 'ms'] as const)('in %s', (lang) => {
    beforeEach(async () => {
      if (lang !== 'en') {
        await switchLanguage(TestBed.inject(TranslationService), http, lang);
        await render(fixture);
      }
    });

    it('localizes headings, labels and location', () => {
      // eslint-disable-next-line security/detect-object-injection
      const d = I18N_FIXTURES[lang].contact;
      expect(el.querySelector('.section-tag')?.textContent).toBe(d.tag);
      expect(el.querySelector('h2')?.textContent).toBe(d.title);
      expect(texts(el, '.detail-label')).toEqual([d.emailLabel, d.phoneLabel, d.locationLabel]);
      expect(el.querySelector('.contact-links-pane h3')?.textContent).toBe(d.referencesTitle);
    });

    it('localizes reference titles and affiliation from the dictionary', () => {
      // eslint-disable-next-line security/detect-object-injection
      const d = I18N_FIXTURES[lang].contact;
      expect(texts(el, '.reference-item > span:not(.ref-sub)')).toEqual([
        d.refSeniorEngineer,
        d.refProfessor,
      ]);
      expect(texts(el, '.ref-sub')[1]).toBe(d.refUtar);
    });
  });

  it('never shows Chinese reference titles in Malay (regression)', async () => {
    await switchLanguage(TestBed.inject(TranslationService), http, 'ms');
    await render(fixture);
    expect(texts(el, '.contact-links-pane').join(' ')).not.toMatch(/[\u4e00-\u9fff]/);
  });
});
