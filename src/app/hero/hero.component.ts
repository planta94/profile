import { Component, NgZone, inject, OnInit, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { TranslationService } from '../services/translation.service';

// Interactive hero landing section with canvas particle backdrop and custom letter animations declared as standalone.
@Component({
  selector: 'app-hero',
  standalone: true, // Explicitly marks component as standalone (default in Angular 19+)
  imports: [],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly ngZone = inject(NgZone);
  protected readonly ts = inject(TranslationService);

  private canvasElement?: HTMLCanvasElement;
  private animationFrameId?: number;
  private resizeListener?: () => void;
  // eslint-disable-next-line no-unused-vars
  private mouseMoveListener?: (e: MouseEvent) => void;

  private readonly mouse = {
    x: undefined as number | undefined,
    y: undefined as number | undefined,
    radius: 180,
  };

  constructor() {
    effect(() => {
      // Re-trigger text animation whenever the language signal changes
      this.ts.currentLang();
      setTimeout(() => {
        this.initHeroTextAnimation();
      }, 0);
    });
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.initParticleCanvas();
  }

  ngOnDestroy() {
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    if (this.mouseMoveListener) {
      window.removeEventListener('mousemove', this.mouseMoveListener);
      window.removeEventListener('mouseleave', this.mouseMoveListener);
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private initHeroTextAnimation() {
    const heroTitle = document.getElementById('heroTitle');
    if (!heroTitle) return;

    heroTitle.classList.remove('liftoff');
    const originalText = this.ts.t().hero.title;
    heroTitle.textContent = '';

    // Split Chinese by individual characters to prevent nowrap cutoffs, split others by whitespace
    const words =
      this.ts.currentLang() === 'zh'
        ? Array.from(originalText.replace(/\s+/g, ''))
        : originalText.split(/\s+/);
    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word-span';

      const letters = Array.from(word);
      letters.forEach((letter, letterIndex) => {
        const letterSpan = document.createElement('span');
        letterSpan.className = 'char-span';
        letterSpan.textContent = letter;
        letterSpan.style.transitionDelay = `${(wordIndex * 3 + letterIndex) * 30}ms`;
        wordSpan.appendChild(letterSpan);
      });

      heroTitle.appendChild(wordSpan);

      if (wordIndex < words.length - 1) {
        const spaceNode = document.createTextNode(' ');
        heroTitle.appendChild(spaceNode);
      }
    });

    setTimeout(() => {
      heroTitle.classList.add('liftoff');
    }, 100);
  }

  private initParticleCanvas() {
    this.canvasElement = document.getElementById('particleCanvas') as HTMLCanvasElement;
    if (!this.canvasElement) return;

    const canvas = this.canvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: Particle[] = [];
    const maxParticles = 85;

    this.mouseMoveListener = (e: MouseEvent) => {
      if (e.type === 'mouseleave') {
        this.mouse.x = undefined;
        this.mouse.y = undefined;
      } else {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      }
    };

    window.addEventListener('mousemove', this.mouseMoveListener);
    window.addEventListener('mouseleave', this.mouseMoveListener);

    class Particle {
      x: number = 0;
      y: number = 0;
      vx: number = 0;
      vy: number = 0;
      radius: number = 0;
      opacity: number = 0;

      constructor(w: number, h: number) {
        this.reset(w, h, true);
      }

      reset(w: number, h: number, init: boolean = false) {
        this.x = Math.random() * w;
        this.y = init ? Math.random() * h : h + 20;
        this.vx = (Math.random() - 0.5) * 1.0;
        this.vy = -(Math.random() * 0.8 + 0.3);
        this.radius = Math.random() * 2 + 1.5;
        this.opacity = Math.random() * 0.4 + 0.1;
      }

      update(
        w: number,
        h: number,
        mouseX: number | undefined,
        mouseY: number | undefined,
        mouseRadius: number,
      ) {
        this.x += this.vx;
        this.y += this.vy;

        if (mouseX !== undefined && mouseY !== undefined) {
          const dx = this.x - mouseX;
          const dy = this.y - mouseY;
          const distance = Math.hypot(dx, dy);

          if (distance < mouseRadius) {
            const force = (mouseRadius - distance) / mouseRadius;
            const angle = Math.atan2(dy, dx);
            // Attract/focus particles towards the cursor
            this.x -= Math.cos(angle) * force * 3.5;
            this.y -= Math.sin(angle) * force * 3.5;
          }
        }

        if (this.x < 0) this.x = w;
        if (this.x > w) this.x = 0;

        if (this.y < -20) {
          this.reset(w, h, false);
        }
      }

      draw(cContext: CanvasRenderingContext2D) {
        cContext.beginPath();
        cContext.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        cContext.fillStyle = `rgba(31, 31, 31, ${this.opacity})`;
        cContext.fill();
      }
    }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    this.resizeListener = () => {
      this.ngZone.runOutsideAngular(() => {
        resizeCanvas();
      });
    };
    window.addEventListener('resize', this.resizeListener);

    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle(canvas.width, canvas.height));
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.update(canvas.width, canvas.height, this.mouse.x, this.mouse.y, this.mouse.radius);
        p.draw(ctx);
      });

      let i = 0;
      for (const p1 of particles) {
        let j = 0;
        for (const p2 of particles) {
          if (j > i) {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.hypot(dx, dy);

            if (distance < 115) {
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              const lineOpacity = ((115 - distance) / 115) * 0.08;
              ctx.strokeStyle = `rgba(31, 31, 31, ${lineOpacity})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
          j++;
        }
        i++;
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.ngZone.runOutsideAngular(() => {
      animate();
    });
  }
}
