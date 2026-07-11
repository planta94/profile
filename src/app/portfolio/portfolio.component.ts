import { Component, signal, NgZone, inject, OnInit, OnDestroy } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { HeroComponent } from '../hero/hero.component';
import { ExperienceComponent } from '../experience/experience.component';
import { ExpertiseComponent } from '../expertise/expertise.component';
import { PublicationsComponent } from '../publications/publications.component';
import { SkillsComponent } from '../skills/skills.component';
import { ContactComponent } from '../contact/contact.component';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [
    HeaderComponent,
    HeroComponent,
    ExperienceComponent,
    ExpertiseComponent,
    PublicationsComponent,
    SkillsComponent,
    ContactComponent,
  ],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss',
})
export class PortfolioComponent implements OnInit, OnDestroy {
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
