import { Component, inject, signal } from '@angular/core';
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

  // Tracks collapsible states of each card index, defaulting the latest (0) to expanded.
  expandedStates = signal<{ [key: number]: boolean }>({ 0: true });

  toggleExpand(index: number) {
    this.expandedStates.update((states) => ({
      ...states,
      // eslint-disable-next-line security/detect-object-injection
      [index]: !states[index],
    }));
  }
}
