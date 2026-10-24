import { Component, NgZone, inject, OnInit, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { TranslationService } from '../services/translation.service';

/**
 * A single capsule dash in the Antigravity-style field.
 * Each particle owns a "home" slot on a ring that is centred on the (smoothed) cursor,
 * and chases that slot with its own underdamped spring. Inner particles are stiff and
 * catch up quickly; outer particles are soft and lag behind — this differential lag is
 * what makes the whole ring warp, smear and wobble like a fluid when the cursor moves.
 */
interface FieldParticle {
  band: number; // 0 = inner edge of the ring, 1 = outer edge
  angle: number;
  spin: number;
  phase: number;
  stiffness: number;
  damping: number;
  length: number;
  thickness: number;
  alpha: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  // Confetti tumble state
  restTilt: number; // resting angle offset from the radial direction
  tilt: number;
  tiltVel: number;
  tumbleDir: number;
  flip: number; // 3D flip phase → apparent length = |cos(flip)|
  agitation: number; // smoothed 0..1 measure of how hard the piece is being thrown around
}

interface DustMote {
  x: number;
  y: number;
  size: number;
  alpha: number;
  phase: number;
  depth: number;
}

const TAU = Math.PI * 2;

// Screen-angle colour wheel (degrees, r, g, b) in Google tones — 0° = right, 90° = down.
const COLOR_STOPS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 142, 108, 242],
  [55, 234, 67, 53],
  [100, 249, 138, 29],
  [140, 251, 188, 4],
  [195, 236, 91, 122],
  [250, 161, 66, 244],
  [300, 66, 133, 244],
  [360, 142, 108, 242],
];

function buildColorLut(): string[] {
  const lut: string[] = [];
  const lastStop = COLOR_STOPS[COLOR_STOPS.length - 1];
  for (let deg = 0; deg < 360; deg++) {
    let lower = COLOR_STOPS[0];
    let upper = lastStop;
    for (const stop of COLOR_STOPS) {
      if (stop[0] <= deg) {
        lower = stop;
      } else {
        upper = stop;
        break;
      }
    }
    const span = upper[0] - lower[0] || 1;
    const t = (deg - lower[0]) / span;
    const r = Math.round(lower[1] + (upper[1] - lower[1]) * t);
    const g = Math.round(lower[2] + (upper[2] - lower[2]) * t);
    const b = Math.round(lower[3] + (upper[3] - lower[3]) * t);
    lut.push(`rgb(${r}, ${g}, ${b})`);
  }
  return lut;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly ngZone = inject(NgZone);
  protected readonly ts = inject(TranslationService);

  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private animationFrameId?: number;
  private visibilityObserver?: IntersectionObserver;
  private isCanvasVisible = true;
  private isLoopRunning = false;
  private lastFrameTime = 0;
  private time = 0;
  private reducedMotion = false;

  // Canvas geometry
  private viewWidth = 0;
  private viewHeight = 0;
  private innerRadius = 60;
  private outerRadius = 480;

  // Field centre (eases toward the cursor, or idles around the avatar)
  private restX = 0;
  private restY = 0;
  private centerX = 0;
  private centerY = 0;

  // Last known pointer position in viewport coordinates
  private pointerClientX = 0;
  private pointerClientY = 0;
  private hasPointer = false;

  private particles: FieldParticle[] = [];
  private dust: DustMote[] = [];
  private readonly colorLut = buildColorLut();

  private readonly handleResize = (): void => {
    this.resizeCanvas(false);
  };

  private readonly handlePointerMove = (e: PointerEvent): void => {
    this.pointerClientX = e.clientX;
    this.pointerClientY = e.clientY;
    this.hasPointer = true;
  };

  private readonly handleTouchMove = (e: TouchEvent): void => {
    const touch = e.touches.item(0);
    if (touch) {
      this.pointerClientX = touch.clientX;
      this.pointerClientY = touch.clientY;
      this.hasPointer = true;
    }
  };

  private readonly handlePointerLeave = (): void => {
    this.hasPointer = false;
  };

  private readonly handlePointerDown = (e: PointerEvent): void => {
    this.emitPulse(e.clientX, e.clientY);
  };

  private readonly renderFrame = (now: number): void => {
    if (!this.isCanvasVisible) {
      this.isLoopRunning = false;
      return;
    }
    this.step(now);
    this.animationFrameId = requestAnimationFrame(this.renderFrame);
  };

  constructor() {
    effect(() => {
      // Re-trigger text liftoff animation on language switch
      this.ts.currentLang();
      setTimeout(() => {
        this.initHeroTextAnimation();
      }, 0);
    });
  }

  ngOnInit() {
    // Initial setup
  }

  ngAfterViewInit() {
    this.initParticleCanvas();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handlePointerLeave);
    window.removeEventListener('pointerdown', this.handlePointerDown);
    document.documentElement.removeEventListener('pointerleave', this.handlePointerLeave);
    this.visibilityObserver?.disconnect();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.isLoopRunning = false;
  }

  private initParticleCanvas() {
    const canvas = document.getElementById('particleCanvas');
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.canvas = canvas;
    this.ctx = ctx;
    this.reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.ngZone.runOutsideAngular(() => {
      this.resizeCanvas(true);

      window.addEventListener('resize', this.handleResize, { passive: true });
      window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
      window.addEventListener('touchmove', this.handleTouchMove, { passive: true });
      window.addEventListener('touchend', this.handlePointerLeave, { passive: true });
      window.addEventListener('pointerdown', this.handlePointerDown, { passive: true });
      document.documentElement.addEventListener('pointerleave', this.handlePointerLeave);

      // Pause the render loop while the hero is scrolled out of view
      if (typeof IntersectionObserver !== 'undefined') {
        this.visibilityObserver = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            this.isCanvasVisible = entry.isIntersecting;
          }
          if (this.isCanvasVisible) {
            this.startLoop();
          }
        });
        this.visibilityObserver.observe(canvas);
      }

      this.startLoop();
    });
  }

  private startLoop() {
    if (this.isLoopRunning) return;
    this.isLoopRunning = true;
    this.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.renderFrame);
  }

  private resizeCanvas(isFirstLayout: boolean) {
    const canvas = this.canvas;
    const ctx = this.ctx;
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
    const height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
    this.viewWidth = width;
    this.viewHeight = height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const minDim = Math.min(width, height);
    const maxDim = Math.max(width, height);
    this.innerRadius = clamp(minDim * 0.08, 36, 80);
    this.outerRadius = clamp(maxDim * 0.27, 190, 500);

    // Idle around the profile avatar when the cursor is elsewhere
    const canvasRect = canvas.getBoundingClientRect();
    const avatar = canvas.parentElement?.querySelector('.hero-avatar-container');
    if (avatar) {
      const avatarRect = avatar.getBoundingClientRect();
      this.restX = avatarRect.left + avatarRect.width / 2 - canvasRect.left;
      this.restY = avatarRect.top + avatarRect.height / 2 - canvasRect.top;
    } else {
      this.restX = width * 0.5;
      this.restY = height * 0.5;
    }

    if (isFirstLayout) {
      this.centerX = this.restX;
      this.centerY = this.restY;
    }

    this.initParticles(isFirstLayout);
    this.initDust();
  }

  private initParticles(bloomFromCenter: boolean) {
    this.particles = [];
    const count = Math.round(clamp((this.viewWidth * this.viewHeight) / 3000, 180, 560));
    const bandWidth = this.outerRadius - this.innerRadius;

    for (let i = 0; i < count; i++) {
      const band = Math.pow(Math.random(), 0.75);
      const angle = Math.random() * TAU;
      const radius = this.innerRadius + band * bandWidth;

      // On first load every dash starts in the core and springs outward (bloom intro)
      const startRadius = bloomFromCenter ? Math.random() * 12 : radius;

      this.particles.push({
        band,
        angle,
        // Differential rotation: inner dashes orbit faster, so the field shears organically
        spin: (0.0016 - band * 0.0009) * (0.7 + Math.random() * 0.6),
        phase: Math.random() * TAU,
        // Inner = stiff (follows instantly), outer = soft (trails behind) → fluid warp
        stiffness: (0.07 - band * 0.048) * (0.8 + Math.random() * 0.4),
        damping: 0.84 + Math.random() * 0.06,
        length: 5 + Math.random() * 6,
        thickness: 2 + Math.random() * 1.2,
        alpha: 0.55 + Math.random() * 0.45,
        x: this.centerX + Math.cos(angle) * startRadius,
        y: this.centerY + Math.sin(angle) * startRadius,
        vx: 0,
        vy: 0,
        restTilt: (Math.random() - 0.5) * 0.6,
        tilt: (Math.random() - 0.5) * TAU,
        tiltVel: 0,
        tumbleDir: Math.random() < 0.5 ? -1 : 1,
        flip: Math.random() * TAU,
        agitation: bloomFromCenter ? 1 : 0,
      });
    }
  }

  private initDust() {
    this.dust = [];
    const count = Math.round(clamp((this.viewWidth * this.viewHeight) / 9000, 60, 220));
    for (let i = 0; i < count; i++) {
      this.dust.push({
        x: Math.random() * this.viewWidth,
        y: Math.random() * this.viewHeight,
        size: 0.6 + Math.random() * 0.9,
        alpha: 0.18 + Math.random() * 0.3,
        phase: Math.random() * TAU,
        depth: 0.3 + Math.random() * 0.7,
      });
    }
  }

  private step(now: number) {
    const canvas = this.canvas;
    const ctx = this.ctx;
    if (!canvas || !ctx) return;

    const dt = clamp((now - this.lastFrameTime) / 16.667, 0.2, 3);
    this.lastFrameTime = now;
    this.time += dt * 0.016;
    const motion = this.reducedMotion ? 0.25 : 1;
    const t = this.time;

    // ---- 1. Move the field centre toward the cursor (or idle around the avatar) ----
    const rect = canvas.getBoundingClientRect();
    const px = this.pointerClientX - rect.left;
    const py = this.pointerClientY - rect.top;
    const pointerInside =
      this.hasPointer &&
      !this.reducedMotion &&
      px >= 0 &&
      py >= 0 &&
      px <= rect.width &&
      py <= rect.height;

    const minDim = Math.min(this.viewWidth, this.viewHeight);
    let targetX: number;
    let targetY: number;
    let followRate: number;
    if (pointerInside) {
      targetX = px;
      targetY = py;
      followRate = 0.14;
    } else {
      targetX = this.restX + Math.sin(t * 0.42) * minDim * 0.025;
      targetY = this.restY + Math.cos(t * 0.33) * minDim * 0.03;
      followRate = 0.025;
    }

    const follow = 1 - Math.pow(1 - followRate, dt);
    const prevCenterX = this.centerX;
    const prevCenterY = this.centerY;
    this.centerX += (targetX - this.centerX) * follow;
    this.centerY += (targetY - this.centerY) * follow;
    const centerVx = (this.centerX - prevCenterX) / dt;
    const centerVy = (this.centerY - prevCenterY) / dt;
    const centerSpeed = Math.hypot(centerVx, centerVy);

    ctx.clearRect(0, 0, this.viewWidth, this.viewHeight);

    // ---- 2. Background dust (slight counter-parallax for depth) ----
    const parallaxX = (this.centerX - this.restX) * -0.03;
    const parallaxY = (this.centerY - this.restY) * -0.03;
    ctx.fillStyle = 'rgb(110, 120, 140)';
    for (const mote of this.dust) {
      ctx.globalAlpha = mote.alpha * (0.6 + 0.4 * Math.sin(t * 1.5 + mote.phase));
      ctx.fillRect(
        mote.x + parallaxX * mote.depth,
        mote.y + parallaxY * mote.depth,
        mote.size,
        mote.size,
      );
    }

    // ---- 3. Fluid particle ring ----
    const inner = this.innerRadius;
    const outer = this.outerRadius;
    const bandWidth = outer - inner;
    const breathe = Math.sin(t * 0.9) * 0.04 * motion;
    const hueShift = t * 6;
    const partRadius = inner * 1.4;
    const partRadiusSq = partRadius * partRadius;
    ctx.lineCap = 'round';

    for (const p of this.particles) {
      p.angle += p.spin * dt * motion;

      // Travelling ripples around the ring keep the silhouette irregular and alive
      const ripple =
        (Math.sin(p.angle * 3 + t * 1.1 + p.phase) * 0.07 +
          Math.sin(p.angle * 5 - t * 1.7 + p.phase * 2) * 0.035) *
        motion;
      const radius = (inner + p.band * bandWidth) * (1 + ripple + breathe);
      const homeX = this.centerX + Math.cos(p.angle) * radius;
      const homeY = this.centerY + Math.sin(p.angle) * radius;

      // Spring toward the home slot
      let ax = (homeX - p.x) * p.stiffness;
      let ay = (homeY - p.y) * p.stiffness;

      // Turbulent wake: moving field sheds sideways eddies, strongest at the soft outer rim
      if (centerSpeed > 0.2) {
        const eddy = Math.sin(p.phase * 3 + t * 4 + p.band * 6) * 0.035 * (0.4 + p.band);
        ax += -centerVy * eddy;
        ay += centerVx * eddy;
      }

      // The cursor tip gently parts any dashes that drift through the core
      if (pointerInside) {
        const dx = p.x - px;
        const dy = p.y - py;
        const distSq = dx * dx + dy * dy;
        if (distSq < partRadiusSq && distSq > 0.01) {
          const d = Math.sqrt(distSq);
          const push = (1 - d / partRadius) * 1.6;
          ax += (dx / d) * push;
          ay += (dy / d) * push;
        }
      }

      const drag = Math.pow(p.damping, dt);
      p.vx = (p.vx + ax * dt) * drag;
      p.vy = (p.vy + ay * dt) * drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // ---- Render ----
      const rx = p.x - this.centerX;
      const ry = p.y - this.centerY;
      const dist = Math.hypot(rx, ry) || 1;
      const edgeFade =
        smoothstep(0, 80, p.x) *
        smoothstep(0, 80, this.viewWidth - p.x) *
        smoothstep(0, 60, p.y) *
        smoothstep(0, 60, this.viewHeight - p.y);
      const alpha =
        p.alpha *
        edgeFade *
        smoothstep(inner * 0.4, inner * 1.3, dist) *
        (1 - smoothstep(outer * 0.92, outer * 1.3, dist));
      if (alpha < 0.02) continue;

      // Confetti tumble: each piece spins and flips with its own speed and direction,
      // then settles back to a near-radial resting tilt once the field calms down
      const speed = Math.hypot(p.vx, p.vy);
      p.agitation += (Math.min(speed / 4, 1) - p.agitation) * Math.min(0.08 * dt, 1);
      p.tiltVel += p.tumbleDir * p.agitation * 0.035 * dt;
      let tiltError = (p.restTilt - p.tilt) % Math.PI;
      if (tiltError > Math.PI / 2) tiltError -= Math.PI;
      if (tiltError < -Math.PI / 2) tiltError += Math.PI;
      p.tiltVel += tiltError * 0.02 * (1 - p.agitation) * dt;
      p.tiltVel *= Math.pow(0.9, dt);
      p.tilt += p.tiltVel * dt;
      p.flip += (0.012 + p.agitation * 0.22) * p.tumbleDir * dt * motion;

      const orientation = Math.atan2(ry, rx) + p.tilt;
      const dirX = Math.cos(orientation);
      const dirY = Math.sin(orientation);
      // Flipping piece: at rest it shows (almost) full length, when tumbling it flickers
      const flipAmount = 0.15 + p.agitation * 0.7;
      const flipScale = 1 - flipAmount * (1 - Math.abs(Math.cos(p.flip)));

      // Pieces grow toward the rim
      const scale = 0.35 + 0.85 * smoothstep(0, outer, dist);
      const half = Math.max(p.length * scale * flipScale, 1.2) * 0.5;
      const screenDeg = (Math.atan2(ry, rx) * 180) / Math.PI + hueShift;
      const deg = Math.floor((screenDeg % 360) + 360) % 360;

      ctx.globalAlpha = alpha;
      // eslint-disable-next-line security/detect-object-injection
      ctx.strokeStyle = this.colorLut[deg];
      ctx.lineWidth = p.thickness * (0.55 + 0.45 * scale);
      ctx.beginPath();
      ctx.moveTo(p.x - dirX * half, p.y - dirY * half);
      ctx.lineTo(p.x + dirX * half, p.y + dirY * half);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  /** Click / tap sends a radial impulse through the field; the springs pull it back together. */
  private emitPulse(clientX: number, clientY: number) {
    const canvas = this.canvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

    const reach = this.outerRadius * 0.9;
    for (const p of this.particles) {
      const dx = p.x - x;
      const dy = p.y - y;
      const d = Math.hypot(dx, dy);
      if (d < reach && d > 0.01) {
        const force = Math.pow(1 - d / reach, 2) * 18;
        p.vx += (dx / d) * force;
        p.vy += (dy / d) * force;
      }
    }
  }

  private initHeroTextAnimation() {
    const heroTitle = document.getElementById('heroTitle');
    if (!heroTitle) return;

    heroTitle.classList.remove('liftoff');
    const originalText = this.ts.t().hero.title;
    heroTitle.textContent = '';

    // Split Chinese by character, others by whitespace
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
        letterSpan.style.transitionDelay = `${(wordIndex * 2 + letterIndex) * 25}ms`;
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
    }, 80);
  }
}
