import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TranslationService } from './translation.service';
import { I18N_FIXTURES, keyPaths, switchLanguage } from '../testing/i18n-fixtures';

let activeHttp: HttpTestingController | undefined;

function setup(platform: 'browser' | 'server' = 'browser') {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: PLATFORM_ID, useValue: platform },
    ],
  });
  activeHttp = TestBed.inject(HttpTestingController);
  return { service: TestBed.inject(TranslationService), http: activeHttp };
}

describe('TranslationService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    activeHttp?.verify();
    activeHttp = undefined;
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('starts in English with the in-memory fallback dictionary (no request yet)', () => {
      const { service } = setup();
      expect(service.currentLang()).toBe('en');
      expect(service.t().header.about).toBe('Profile');
      expect(service.t().expertise.tabs).toHaveLength(4);
    });

    it('in-memory fallback is identical to public/i18n/en.json (no content drift)', () => {
      const { service } = setup();
      expect(keyPaths(service.t())).toEqual(keyPaths(I18N_FIXTURES.en));
      expect(service.t()).toEqual(I18N_FIXTURES.en);
    });
  });

  describe('initialize()', () => {
    it('GETs i18n/en.json when no preference is stored', async () => {
      const { service, http } = setup();
      const done = service.initialize();
      const req = http.expectOne('i18n/en.json');
      expect(req.request.method).toBe('GET');
      req.flush(I18N_FIXTURES.en);
      await done;
      expect(service.currentLang()).toBe('en');
      expect(service.t()).toEqual(I18N_FIXTURES.en);
    });

    it('restores the stored preference', async () => {
      localStorage.setItem('preferredLang', 'ms');
      const { service, http } = setup();
      const done = service.initialize();
      http.expectOne('i18n/ms.json').flush(I18N_FIXTURES.ms);
      await done;
      expect(service.currentLang()).toBe('ms');
      expect(service.t().header.about).toBe(I18N_FIXTURES.ms.header.about);
    });

    it('ignores an unsupported stored value and falls back to English', async () => {
      localStorage.setItem('preferredLang', 'fr');
      const { service, http } = setup();
      const done = service.initialize();
      http.expectOne('i18n/en.json').flush(I18N_FIXTURES.en);
      await done;
      expect(service.currentLang()).toBe('en');
    });

    it('resolves without any HTTP request during SSR / prerendering', async () => {
      const { service, http } = setup('server');
      await expect(service.initialize()).resolves.toBeUndefined();
      http.expectNone(() => true);
      expect(service.t().header.about).toBe('Profile');
    });
  });

  describe('setLanguage()', () => {
    it('loads the dictionary, updates both signals and persists the preference', async () => {
      const { service, http } = setup();
      await switchLanguage(service, http, 'zh');
      expect(service.currentLang()).toBe('zh');
      expect(service.t().header.about).toBe(I18N_FIXTURES.zh.header.about);
      expect(localStorage.getItem('preferredLang')).toBe('zh');
    });

    it('does not persist the preference before the dictionary has loaded', () => {
      const { service, http } = setup();
      void service.setLanguage('ms');
      expect(localStorage.getItem('preferredLang')).toBeNull();
      expect(service.currentLang()).toBe('en');
      http.expectOne('i18n/ms.json').flush(I18N_FIXTURES.ms);
    });

    it('does not touch localStorage on the server platform', async () => {
      const { service, http } = setup('server');
      const done = service.setLanguage('zh');
      http.expectOne('i18n/zh.json').flush(I18N_FIXTURES.zh);
      await done;
      expect(service.currentLang()).toBe('zh');
      expect(localStorage.getItem('preferredLang')).toBeNull();
    });
  });

  describe('degraded state: dictionary request fails', () => {
    it.each([500, 404])(
      'HTTP %i keeps the previous language label + strings and logs the failure',
      async (status) => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { service, http } = setup();
        await switchLanguage(service, http, 'zh');

        const done = service.setLanguage('ms');
        http.expectOne('i18n/ms.json').flush('boom', { status, statusText: 'Error' });
        await done;

        expect(service.currentLang()).toBe('zh');
        expect(service.t().header.about).toBe(I18N_FIXTURES.zh.header.about);
        expect(localStorage.getItem('preferredLang')).toBe('zh');
        expect(errorSpy).toHaveBeenCalledWith(
          'Failed to load translation JSON: ms',
          expect.anything(),
        );
      },
    );

    it('network error on first load leaves the app usable in English', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      localStorage.setItem('preferredLang', 'zh');
      const { service, http } = setup();
      const done = service.initialize();
      http.expectOne('i18n/zh.json').error(new ProgressEvent('error'));
      await expect(done).resolves.toBeUndefined();
      expect(service.currentLang()).toBe('en');
      expect(service.t().header.about).toBe('Profile');
    });
  });

  describe('contract: locale dictionaries stay in sync', () => {
    it.each(['zh', 'ms'] as const)('%s.json has exactly the keys of en.json', (lang) => {
      // eslint-disable-next-line security/detect-object-injection
      expect(keyPaths(I18N_FIXTURES[lang])).toEqual(keyPaths(I18N_FIXTURES.en));
    });

    it.each(['zh', 'ms'] as const)('%s.json has the same list lengths as en.json', (lang) => {
      // eslint-disable-next-line security/detect-object-injection
      const dict = I18N_FIXTURES[lang];
      expect(dict.experience.list).toHaveLength(I18N_FIXTURES.en.experience.list.length);
      expect(dict.expertise.tabs).toHaveLength(I18N_FIXTURES.en.expertise.tabs.length);
      dict.expertise.tabs.forEach((tab, i) => {
        // eslint-disable-next-line security/detect-object-injection
        expect(tab.icon).toBe(I18N_FIXTURES.en.expertise.tabs[i].icon);
      });
    });

    it('no locale contains an empty string value', () => {
      for (const dict of Object.values(I18N_FIXTURES)) {
        const empty = JSON.stringify(dict).match(/:""/g);
        expect(empty).toBeNull();
      }
    });
  });
});
