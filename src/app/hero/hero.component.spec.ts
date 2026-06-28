import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HeroComponent } from './hero.component';

describe('HeroComponent', () => {
  let component: HeroComponent;
  let fixture: ComponentFixture<HeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create hero component', () => {
    expect(component).toBeTruthy();
  });

  it('should contain a particle canvas element', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#particleCanvas')).toBeTruthy();
  });

  it('should contain hero action button links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const actions = compiled.querySelectorAll('.hero-ctas a');
    expect(actions.length).toBeGreaterThanOrEqual(1);
  });
});
