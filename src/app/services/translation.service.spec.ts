import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  let service: TranslationService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TranslationService, provideHttpClient(), provideHttpClientTesting()],
    });

    localStorage.removeItem('preferredLang');

    service = TestBed.inject(TranslationService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load English translations on initialize', async () => {
    const initPromise = service.initialize();

    const req = httpTestingController.expectOne('i18n/en.json');
    req.flush({
      header: { about: 'Profile' },
    });

    await initPromise;

    expect(service.currentLang()).toBe('en');
    expect(service.t().header.about).toBe('Profile');
  });

  it('should set language and update signals on successful JSON fetch', async () => {
    const setPromise = service.setLanguage('zh');

    const req = httpTestingController.expectOne('i18n/zh.json');
    expect(req.request.method).toBe('GET');

    const mockResponse = {
      header: { about: '个人简介' },
    } as any;

    req.flush(mockResponse);

    await setPromise;

    expect(service.currentLang()).toBe('zh');
    expect(service.t().header.about).toBe('个人简介');
    expect(localStorage.getItem('preferredLang')).toBe('zh');
  });
});
