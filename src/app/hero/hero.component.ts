import {
  Component,
  NgZone,
  inject,
  OnInit,
  AfterViewInit,
  OnDestroy,
  effect,
  ElementRef,
} from '@angular/core';
import { TranslationService } from '../services/translation.service';

// Interactive hero landing section with canvas particle ring backdrop and custom letter animations.
@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly elementRef = inject(ElementRef);
  protected readonly ts = inject(TranslationService);

  private canvasElement?: HTMLCanvasElement;
  private animationFrameId?: number;
  private resizeListener?: () => void;
  // eslint-disable-next-line no-unused-vars
  private mouseMoveListener?: (e: MouseEvent) => void;
  // eslint-disable-next-line no-unused-vars
  private touchMoveListener?: (e: TouchEvent) => void;

  // Easing coordinates for cursor tracking
  private targetX = 50;
  private targetY = 50;
  private smoothX = 50;
  private smoothY = 50;

  // Animation values
  private tick = 0;
  private animationTime = 0;

  // Seed constants (calculated once at startup)
  private M = 0;
  private I = 0;
  private S = 0;
  private z = 0;
  private xDirection = 0;
  private P = 0;
  private V = 0;

  constructor() {
    effect(() => {
      // Re-trigger text animation whenever the language signal changes
      this.ts.currentLang();
      setTimeout(() => {
        this.initHeroTextAnimation();
      }, 0);
    });
  }

  ngOnInit() {
    this.initSeedConstants(280); // Using the same seed 280 from Bramus's config
  }

  ngAfterViewInit() {
    this.initParticleCanvas();
  }

  ngOnDestroy() {
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    if (this.mouseMoveListener) {
      window.removeEventListener('mousemove', this.mouseMoveListener);
    }
    if (this.touchMoveListener) {
      window.removeEventListener('touchmove', this.touchMoveListener);
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  // Seeded Random Generator (PRNG)
  private seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (1831565813 + (s | 0)) | 0;
      let a = Math.imul(s ^ (s >>> 15), 1 | s);
      return (((a = (a + Math.imul(a ^ (a >>> 7), 61 | a)) ^ a) ^ (a >>> 14)) >>> 0) / 4294967296;
    };
  }

  private hash(t: number): number {
    const a = 43758.5453123 * Math.sin(t);
    return a - Math.floor(a);
  }

  private initSeedConstants(seed: number) {
    const random = this.seededRandom(seed);
    const randomInt = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min;
    const randomFloat = (min: number, max: number) => min + random() * (max - min);

    this.M = randomInt(2, 8);
    this.I = randomInt(1, 2);
    this.S = this.hash(seed + 10) > 0.5 ? 1 : -1;
    this.z = randomInt(2, 9);
    this.xDirection = -this.S;
    this.P = randomFloat(0.2, 0.8);
    this.V = randomInt(8, 20);
  }

  // Cubic Bezier curve functions
  private getBezierValue(t: number, p1: number, p2: number, p3: number, p4: number): number {
    const i = 1 - t;
    const s = t * t;
    const o = i * i;
    return o * i * p1 + 3 * o * t * p2 + 3 * i * s * p3 + s * t * p4;
  }

  private solveBezierX(t: number, p1: number, p2: number): number {
    let e = t;
    for (let n = 0; n < 8; n++) {
      const val = this.getBezierValue(e, 0, p1, p2, 1);
      const slope = (this.getBezierValue(e + 0.001, 0, p1, p2, 1) - val) / 0.001;
      if (slope === 0) break;
      e -= (val - t) / slope;
    }
    return Math.max(0, Math.min(1, e));
  }

  private initParticleCanvas() {
    this.canvasElement = document.getElementById('particleCanvas') as HTMLCanvasElement;
    if (!this.canvasElement) return;

    const canvas = this.canvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    this.ngZone.runOutsideAngular(() => {
      this.mouseMoveListener = (e: MouseEvent) => {
        this.targetX = (e.clientX / window.innerWidth) * 100;
        this.targetY = (e.clientY / window.innerHeight) * 100;
      };

      this.touchMoveListener = (e: TouchEvent) => {
        if (e.touches.length > 0) {
          this.targetX = (e.touches[0].clientX / window.innerWidth) * 100;
          this.targetY = (e.touches[0].clientY / window.innerHeight) * 100;
        }
      };

      window.addEventListener('mousemove', this.mouseMoveListener);
      window.addEventListener('touchmove', this.touchMoveListener, { passive: true });
    });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smooth coordinate tracking transition (lerp) simulating CSS transition floaty lag (more fluid weight)
      this.smoothX += (this.targetX - this.smoothX) * 0.025;
      this.smoothY += (this.targetY - this.smoothY) * 0.025;

      // Calculate cursor speed/velocity and direction of travel for water warp distortion
      const dx = this.targetX - this.smoothX;
      const dy = this.targetY - this.smoothY;
      const speed = Math.sqrt(dx * dx + dy * dy);
      const travelAngle = Math.atan2(dy, dx);
      const cappedSpeed = Math.min(speed, 8);

      // Base radius oscillation simulating keyframe ring animation (lesser center whitespace)
      const radius = 40 + Math.sin(this.animationTime) * 10;
      this.animationTime += 0.0015;

      const thickness = 390;
      const rows = 11;
      const count = 45;
      const minAlpha = 0.22;
      const maxAlpha = 1.0;
      const size = 3.0;

      const outerRadius = radius + thickness;
      const innerRadius = radius;
      const middleRadius = thickness / 2;

      // Easing cubic bezier (ease-in: [.42, 0, 1, 1])
      const w = 0.42;
      const B = 0;
      const y = 1;
      const v = 1;

      const centerX = (canvas.width * this.smoothX) / 100;
      const centerY = (canvas.height * this.smoothY) / 100;
      const animationAngle = this.tick * Math.PI * 2;

      // Slow tick increment (calm wave speed)
      this.tick += 0.0002;

      for (let rIndex = 0; rIndex < rows; rIndex++) {
        const currentRadius = innerRadius + (rows > 1 ? rIndex / (rows - 1) : 0) * thickness;
        for (let cIndex = 0; cIndex < count; cIndex++) {
          const angle = (cIndex / count) * Math.PI * 2;
          const finalAngle = angle;
          const particleScale = size;

          const wave =
            Math.sin(finalAngle * this.M + animationAngle * this.I * this.S) +
            Math.sin(finalAngle * this.z + 1 * animationAngle * this.xDirection) +
            Math.sin(currentRadius * this.P + animationAngle);

          let intensity = (wave + 3) / 6;
          intensity = Math.pow(Math.max(0, intensity), 1.5);
          let alpha = minAlpha + intensity * (maxAlpha - minAlpha);

          // Directional water displacement warp: compresses front of travel vector, stretches rear (higher multiplier for stronger warp)
          const warp = Math.cos(finalAngle - travelAngle) * cappedSpeed * 8.0;
          // Ripple swells/stretches wave height slightly when moving fast, mimicking water resistance
          const activeWaveFactor = 18 + cappedSpeed * 2.8;

          const radiusWithWave = currentRadius + wave * activeWaveFactor - warp;
          const drawX = centerX + Math.cos(finalAngle) * radiusWithWave;
          const drawY = centerY + Math.sin(finalAngle) * radiusWithWave;

          // Fluid outer limit varies with the wave to make the entire ring boundary morph dynamically
          const fluidOuterRadius = outerRadius + wave * 36;
          let easeFactor =
            Math.min(radiusWithWave - innerRadius, fluidOuterRadius - radiusWithWave) /
            middleRadius;
          if (easeFactor < 0) easeFactor = 0;
          if (easeFactor > 1) easeFactor = 1;

          const resolvedBezier = this.solveBezierX(easeFactor, w, y);
          alpha *= this.getBezierValue(resolvedBezier, 0, B, v, 1);

          if (alpha < 0) alpha = 0;
          if (alpha > 1) alpha = 1;

          if (alpha > 0.01) {
            ctx.globalAlpha = alpha;

            // Progressive rainbow spectrum wrapping around the circle and rotating slowly over time
            const hue = ((finalAngle / (Math.PI * 2)) * 360 + this.tick * 30) % 360;
            ctx.fillStyle = `hsl(${hue < 0 ? hue + 360 : hue}, 85%, 62%)`;

            ctx.save();
            ctx.translate(drawX, drawY);
            ctx.rotate(finalAngle + Math.PI / 2); // Aligned tangent to the circular wave
            // Draw thicker confetti dash (width 2.6x scale, height 1.3x scale)
            ctx.fillRect(
              -particleScale * 1.3,
              -particleScale * 0.65,
              particleScale * 2.6,
              particleScale * 1.3,
            );
            ctx.restore();
          }
        }
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.ngZone.runOutsideAngular(() => {
      animate();
    });
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
}
