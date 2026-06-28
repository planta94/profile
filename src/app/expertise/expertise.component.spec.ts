import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ExpertiseComponent } from './expertise.component';

describe('ExpertiseComponent', () => {
  let component: ExpertiseComponent;
  let fixture: ComponentFixture<ExpertiseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpertiseComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpertiseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create expertise component', () => {
    expect(component).toBeTruthy();
  });

  it('should switch active tab and display corresponding pane on tab button click', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    // First tab is initially active (Agentic AI)
    expect((component as any).activeTab()).toBe(0);

    // Get second tab button (Data Science)
    const tabButtons = compiled.querySelectorAll('.tab-btn');
    expect(tabButtons.length).toBeGreaterThanOrEqual(2);

    (tabButtons[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect((component as any).activeTab()).toBe(1);
  });
});
