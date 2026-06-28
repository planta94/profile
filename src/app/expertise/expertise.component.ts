import { Component, signal, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

// Core focus areas / capability dashboard component declared as standalone.
@Component({
  selector: 'app-expertise',
  standalone: true, // Explicitly marks component as standalone (default in Angular 19+)
  imports: [],
  templateUrl: './expertise.component.html',
  styleUrl: './expertise.component.scss',
})
export class ExpertiseComponent {
  protected readonly activeTab = signal(0);
  protected readonly ts = inject(TranslationService);

  protected prevTab() {
    const current = this.activeTab();
    if (current > 0) {
      this.activeTab.set(current - 1);
    }
  }

  protected nextTab() {
    const current = this.activeTab();
    const totalTabs = this.ts.t().expertise.tabs.length;
    if (current < totalTabs - 1) {
      this.activeTab.set(current + 1);
    }
  }
}
