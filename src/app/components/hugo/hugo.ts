import { Component, signal, computed, HostListener, OnDestroy, ElementRef } from '@angular/core';
import { NgClass } from '@angular/common';

type GameState = 'start' | 'playing' | 'dead' | 'win';
type AnimState  = 'none' | 'coucou' | 'monster' | 'splat';

interface Boss {
  x:      number;
  y:      number;
  phase:  number;
  passes: number;
}

interface Obstacle {
  id:        number;
  x:         number;
  y:         number;
  speed:     number;
  icon:      string;
  label:     string;
  color:     string;
  textColor: string;
  danger:    1 | 2 | 3;
  rotation:  number;
}

@Component({
  selector: 'app-hugo',
  imports: [NgClass],
  templateUrl: './hugo.html',
  styleUrl: './hugo.scss',
})
export class Hugo implements OnDestroy {
  readonly gameState     = signal<GameState>('start');
  readonly animState     = signal<AnimState>('none');
  readonly lives         = signal(3);
  readonly rocketX       = signal(50);
  readonly rocketY       = signal(55);
  readonly obstacles     = signal<Obstacle[]>([]);
  readonly isInvincible  = signal(false);
  readonly score         = signal(0);
  readonly boss          = signal<Boss | null>(null);

  readonly livesArray    = computed(() =>
    Array.from({ length: 3 }, (_, i) => i < this.lives() ? 'full' : 'lost')
  );
  readonly rocketDamage  = computed(() => 3 - this.lives());
  readonly bossPassesLeft = computed(() => {
    const b = this.boss();
    return b ? 5 - b.passes : 5;
  });
  readonly diffLevel = computed(() => {
    const s = this.score();
    if (s < 20) return 1;
    if (s < 40) return 2;
    return 3;
  });

  private keysPressed    = new Set<string>();
  private animFrameId: number | null = null;
  private lastTime       = 0;
  private obstacleTimer  = 0;
  private obstacleId     = 0;
  private focused        = false;
  private pausedForAnim  = false;
  private bossTriggerred = false;

  private get spawnInterval(): number {
    const s = this.score();
    if (s < 20) return 1200;
    if (s < 40) return 900;
    return 650;
  }

  private get speedMult(): number {
    const s = this.score();
    if (s < 20) return 1.0;
    if (s < 40) return 1.35;
    return 1.75;
  }

  private readonly OBSTACLES: { icon: string; label: string; color: string; textColor: string; danger: 1 | 2 | 3 }[] = [
    { icon: 'JS',   label: 'TypeError',    color: '#F7DF1E', textColor: '#222', danger: 2 },
    { icon: 'JS',   label: 'undefined',    color: '#F7DF1E', textColor: '#222', danger: 1 },
    { icon: 'JS',   label: 'null',         color: '#F7DF1E', textColor: '#222', danger: 1 },
    { icon: 'JS',   label: 'NaN',          color: '#F7DF1E', textColor: '#222', danger: 1 },
    { icon: 'TS',   label: 'any',          color: '#3178C6', textColor: '#fff', danger: 2 },
    { icon: 'TS',   label: 'Type error',   color: '#3178C6', textColor: '#fff', danger: 2 },
    { icon: '⚛',   label: 'Hook err',     color: '#61DAFB', textColor: '#222', danger: 2 },
    { icon: 'HTML', label: '<table>',      color: '#E34F26', textColor: '#fff', danger: 1 },
    { icon: 'HTML', label: '<div>',        color: '#E34F26', textColor: '#fff', danger: 1 },
    { icon: 'CSS',  label: '!important',   color: '#1572B6', textColor: '#fff', danger: 2 },
    { icon: 'CSS',  label: 'float',        color: '#1572B6', textColor: '#fff', danger: 1 },
    { icon: 'CSS',  label: 'z-index:9999', color: '#1572B6', textColor: '#fff', danger: 2 },
    { icon: 'NPM',  label: 'ERR!',         color: '#CB3837', textColor: '#fff', danger: 3 },
    { icon: 'GIT',  label: 'conflict',     color: '#F05032', textColor: '#fff', danger: 3 },
    { icon: 'NODE', label: 'CORS',         color: '#339933', textColor: '#fff', danger: 2 },
    { icon: '404',  label: 'Not Found',    color: '#E53E3E', textColor: '#fff', danger: 2 },
    { icon: '500',  label: 'Server Err',   color: '#9B2335', textColor: '#fff', danger: 3 },
    { icon: 'NG',   label: 'DI error',     color: '#DD0031', textColor: '#fff', danger: 2 },
  ];

  constructor(private el: ElementRef) {}

  startGame(): void {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.lives.set(3);
    this.rocketX.set(50);
    this.rocketY.set(75);
    this.obstacles.set([]);
    this.keysPressed.clear();
    this.isInvincible.set(false);
    this.score.set(0);
    this.boss.set(null);
    this.bossTriggerred = false;
    this.lastTime       = 0;
    this.obstacleTimer  = 0;
    this.focused        = true;
    this.gameState.set('playing');
    this.animFrameId    = requestAnimationFrame(t => this.loop(t));
  }

  launchAnimation(): void {
    if (this.animState() !== 'none') return;

    if (this.gameState() === 'playing') {
      this.pausedForAnim = true;
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
    }

    this.animState.set('coucou');
    setTimeout(() => this.animState.set('monster'), 2500);
    setTimeout(() => this.animState.set('splat'),   5500);
    setTimeout(() => {
      this.animState.set('none');
      if (this.pausedForAnim && this.gameState() === 'playing') {
        this.lastTime    = 0;
        this.animFrameId = requestAnimationFrame(t => this.loop(t));
      }
      this.pausedForAnim = false;
    }, 8500);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.focused = this.el.nativeElement.contains(event.target as Node);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.focused || this.gameState() !== 'playing' || this.animState() !== 'none') return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      this.keysPressed.add(event.key);
      event.preventDefault();
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    this.keysPressed.delete(event.key);
  }

  private spawnObstacle(): void {
    if (Math.random() < 0.15) {
      this.spawnCluster();
      return;
    }
    const tmpl = this.OBSTACLES[Math.floor(Math.random() * this.OBSTACLES.length)];
    this.obstacles.update(obs => [...obs, {
      id:        this.obstacleId++,
      x:         8 + Math.random() * 84,
      y:         -6,
      speed:     (0.018 + Math.random() * 0.012) * tmpl.danger * this.speedMult,
      icon:      tmpl.icon,
      label:     tmpl.label,
      color:     tmpl.color,
      textColor: tmpl.textColor,
      danger:    tmpl.danger,
      rotation:  (Math.random() - 0.5) * 40,
    }]);
  }

  private spawnCluster(): void {
    const count = 3 + Math.floor(Math.random() * 2);
    const baseX = 15 + Math.random() * 70;
    const templates = this.OBSTACLES.filter(o => o.danger === 1);
    const newObs: Obstacle[] = Array.from({ length: count }, (_, i) => {
      const tmpl = templates[Math.floor(Math.random() * templates.length)];
      return {
        id:        this.obstacleId++,
        x:         baseX + (Math.random() - 0.5) * 18,
        y:         -6 - i * 6,
        speed:     (0.016 + Math.random() * 0.008) * this.speedMult,
        icon:      tmpl.icon,
        label:     tmpl.label,
        color:     tmpl.color,
        textColor: tmpl.textColor,
        danger:    1 as const,
        rotation:  (Math.random() - 0.5) * 30,
      };
    });
    this.obstacles.update(obs => [...obs, ...newObs]);
  }

  private loop(ts: number): void {
    if (this.gameState() !== 'playing' || this.animState() !== 'none') return;
    const dt = this.lastTime ? Math.min(ts - this.lastTime, 50) : 16;
    this.lastTime = ts;

    // ── Mouvement fusée (smooth) ──
    const spd = 0.05 * dt;
    if (this.keysPressed.has('ArrowUp'))    this.rocketY.update(y => Math.max(3,  y - spd));
    if (this.keysPressed.has('ArrowDown'))  this.rocketY.update(y => Math.min(92, y + spd));
    if (this.keysPressed.has('ArrowLeft'))  this.rocketX.update(x => Math.max(3,  x - spd));
    if (this.keysPressed.has('ArrowRight')) this.rocketX.update(x => Math.min(92, x + spd));

    // ── Phase boss ──
    const currentBoss = this.boss();
    if (currentBoss !== null) {
      const newPhase = currentBoss.phase + 0.0025 * dt;
      const newX     = 50 + Math.sin(newPhase) * 38;
      const newY     = currentBoss.y + 0.022 * dt;
      if (newY > 110) {
        const newPasses = currentBoss.passes + 1;
        if (newPasses >= 5) {
          this.boss.set(null);
          this.gameState.set('win');
          return;
        }
        this.boss.set({ x: 50, y: -15, phase: 0, passes: newPasses });
      } else {
        this.boss.set({ x: newX, y: newY, phase: newPhase, passes: currentBoss.passes });
      }
      if (!this.isInvincible()) {
        const rx = this.rocketX(), ry = this.rocketY();
        if (Math.abs(currentBoss.x - rx) < 10 && Math.abs(currentBoss.y - ry) < 10) {
          const newLives = this.lives() - 1;
          this.lives.set(newLives);
          if (newLives <= 0) { this.gameState.set('dead'); return; }
          this.isInvincible.set(true);
          setTimeout(() => this.isInvincible.set(false), 2000);
        }
      }
      this.animFrameId = requestAnimationFrame(t => this.loop(t));
      return;
    }

    // ── Déclenchement boss ──
    if (!this.bossTriggerred && this.score() >= 60) {
      this.bossTriggerred = true;
      this.obstacles.set([]);
      this.obstacleTimer = 0;
      this.boss.set({ x: 50, y: -15, phase: 0, passes: 0 });
      this.animFrameId = requestAnimationFrame(t => this.loop(t));
      return;
    }

    // ── Spawn obstacles ──
    this.obstacleTimer += dt;
    if (this.obstacleTimer >= this.spawnInterval) {
      this.obstacleTimer = 0;
      this.spawnObstacle();
    }

    // ── Déplacement, pruning & score ──
    let scoreGain = 0;
    const remaining: Obstacle[] = [];
    for (const o of this.obstacles().map(o => ({ ...o, y: o.y + o.speed * dt }))) {
      if (o.y > 110) { scoreGain += o.danger; }
      else           { remaining.push(o); }
    }
    this.obstacles.set(remaining);
    if (scoreGain > 0) this.score.update(s => s + scoreGain);

    // ── Collision ──
    if (!this.isInvincible()) {
      const rx = this.rocketX(), ry = this.rocketY();
      const hit = this.obstacles().find(o => {
        const r = o.danger * 3;
        return Math.abs(o.x - rx) < r && Math.abs(o.y - ry) < r;
      });
      if (hit) {
        this.obstacles.update(obs => obs.filter(o => o.id !== hit.id));
        const newLives = this.lives() - 1;
        this.lives.set(newLives);
        if (newLives <= 0) { this.gameState.set('dead'); return; }
        this.isInvincible.set(true);
        setTimeout(() => this.isInvincible.set(false), 2000);
      }
    }

    this.animFrameId = requestAnimationFrame(t => this.loop(t));
  }

  ngOnDestroy(): void {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }
}

