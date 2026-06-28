import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PublicationsComponent } from './publications.component';

describe('PublicationsComponent', () => {
  let component: PublicationsComponent;
  let fixture: ComponentFixture<PublicationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create publications component', () => {
    expect(component).toBeTruthy();
  });

  it('should render publication cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.pub-card');
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });
});
