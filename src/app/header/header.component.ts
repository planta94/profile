import { Component, input, inject, signal, HostListener, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../services/translation.service';

// Responsive header navigation and language selector component declared as standalone.
@Component({
  selector: 'app-header',
  standalone: true, // Explicitly marks component as standalone (default in Angular 19+)
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly activeSection = input<string>('about');
  protected readonly ts = inject(TranslationService);
  protected readonly isDropdownOpen = signal(false);
  private readonly elementRef = inject(ElementRef);

  protected toggleDropdown() {
    this.isDropdownOpen.update((open) => !open);
  }

  protected selectLanguage(lang: 'en' | 'zh' | 'ms') {
    this.ts.setLanguage(lang);
    this.isDropdownOpen.set(false);
  }

  protected getLangLabel(lang: 'en' | 'zh' | 'ms'): string {
    const labels = new Map<'en' | 'zh' | 'ms', string>([
      ['en', 'English (EN)'],
      ['zh', '中文 (ZH)'],
      ['ms', 'Melayu (BM)'],
    ]);
    return labels.get(lang) || '';
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
    }
  }
}
