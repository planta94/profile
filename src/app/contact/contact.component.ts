import { Component, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

// Contact and footer info component declared as standalone.
@Component({
  selector: 'app-contact',
  standalone: true, // Explicitly marks component as standalone (default in Angular 19+)
  imports: [],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  protected readonly ts = inject(TranslationService);
}
