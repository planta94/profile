import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SkillsComponent } from './skills.component';

describe('SkillsComponent', () => {
  let component: SkillsComponent;
  let fixture: ComponentFixture<SkillsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(SkillsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create skills component', () => {
    expect(component).toBeTruthy();
  });

  it('should render dev tools skill bars', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const bars = compiled.querySelectorAll('.skill-bar-item');
    expect(bars.length).toBeGreaterThanOrEqual(1);
  });

  it('should render research interest tags', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const tags = compiled.querySelectorAll('.interest-tag');
    expect(tags.length).toBeGreaterThanOrEqual(1);
  });
});
