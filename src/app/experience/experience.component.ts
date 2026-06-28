import { Component, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

// Experience history timeline component declared as standalone.
@Component({
  selector: 'app-experience',
  standalone: true, // Explicitly marks component as standalone (default in Angular 19+)
  imports: [],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.scss',
})
export class ExperienceComponent {
  protected readonly ts = inject(TranslationService);
}
