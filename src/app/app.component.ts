import { Component, signal, NgZone, inject, OnInit, OnDestroy } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { HeroComponent } from './hero/hero.component';
import { ExperienceComponent } from './experience/experience.component';
import { ExpertiseComponent } from './expertise/expertise.component';
import { PublicationsComponent } from './publications/publications.component';
import { SkillsComponent } from './skills/skills.component';
import { ContactComponent } from './contact/contact.component';

// Main application shell component declared as standalone.
@Component({
  selector: 'app-root',
  standalone: true, // Explicitly marks component as standalone (default in Angular 19+)
  imports: [
    HeaderComponent,
    HeroComponent,
    ExperienceComponent,
    ExpertiseComponent,
    PublicationsComponent,
    SkillsComponent,
    ContactComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly ngZone = inject(NgZone);

  protected readonly activeSection = signal<string>('about');

  private scrollListener?: () => void;

  ngOnInit() {
    this.scrollListener = () => {
      this.ngZone.run(() => {
        this.trackScrollSection();
      });
    };

    window.addEventListener('scroll', this.scrollListener, { passive: true });
    // Run once initially
    this.trackScrollSection();
  }

  ngOnDestroy() {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  private trackScrollSection() {
    const sections = ['about', 'expertise', 'experience', 'publications', 'skills', 'contact'];
    let currentActive = 'about';
    const triggerOffset = 180;

    for (const sectionId of sections) {
      const el = document.getElementById(sectionId);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= triggerOffset && rect.bottom >= triggerOffset) {
          currentActive = sectionId;
          break;
        }
      }
    }

    if (this.activeSection() !== currentActive) {
      this.activeSection.set(currentActive);
    }
  }
}
