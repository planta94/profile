import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ContactComponent } from './contact.component';

describe('ContactComponent', () => {
  let component: ContactComponent;
  let fixture: ComponentFixture<ContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create contact component', () => {
    expect(component).toBeTruthy();
  });

  it('should render contact links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.contact-details a');
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it('should render professional reference items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const refItems = compiled.querySelectorAll('.reference-item');
    expect(refItems.length).toBeGreaterThanOrEqual(2);
  });
});
