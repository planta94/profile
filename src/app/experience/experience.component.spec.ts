import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ExperienceComponent } from './experience.component';

describe('ExperienceComponent', () => {
  let component: ExperienceComponent;
  let fixture: ComponentFixture<ExperienceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperienceComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ExperienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create experience component', () => {
    expect(component).toBeTruthy();
  });

  it('should render timeline items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const timelineItems = compiled.querySelectorAll('.timeline-item');
    expect(timelineItems.length).toBeGreaterThanOrEqual(1);
  });
});
