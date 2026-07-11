import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HeaderComponent } from './header.component';
import { TranslationService } from '../services/translation.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let translationService: TranslationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), TranslationService],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    translationService = TestBed.inject(TranslationService);
    fixture.detectChanges();
  });

  it('should create header component', () => {
    expect(component).toBeTruthy();
  });

  it('should render website logo monogram text', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.logo-text')?.textContent).toContain('CHIA MIN YAN');
  });

  it('should toggle language dropdown menu visibility on click', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const trigger = compiled.querySelector('.lang-dropdown-trigger') as HTMLButtonElement;

    expect(compiled.querySelector('.lang-dropdown-menu')).toBeFalsy();

    trigger.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.lang-dropdown-menu')).toBeTruthy();

    trigger.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.lang-dropdown-menu')).toBeFalsy();
  });
});
