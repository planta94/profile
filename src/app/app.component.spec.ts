import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { CvComponent } from './cv/cv.component';

describe('AppComponent (shell + route table)', () => {
  beforeEach(async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => vi.restoreAllMocks());

  it('renders only a router outlet as the application shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.children).toHaveLength(1);
    expect(el.firstElementChild?.tagName.toLowerCase()).toBe('router-outlet');
  });

  it('routes "/" to the portfolio page', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/', PortfolioComponent);
    expect(page).toBeInstanceOf(PortfolioComponent);
  });

  it('routes "/cv" to the printable CV page', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/cv', CvComponent);
    expect(page).toBeInstanceOf(CvComponent);
  });

  it('redirects unknown URLs back to the portfolio', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/does-not-exist', PortfolioComponent);
    expect(page).toBeInstanceOf(PortfolioComponent);
    expect(TestBed.inject(Router).url).toBe('/');
  });
});
