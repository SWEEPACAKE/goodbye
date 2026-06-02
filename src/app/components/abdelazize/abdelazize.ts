import { Component, OnInit, inject, HostListener, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlotRegistryService } from '../../services/slot-registry';

@Component({
  selector: 'app-abdelazize',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './abdelazize.html',
  styleUrl: './abdelazize.scss',
})
export class Abdelazize implements OnInit, AfterViewInit, OnDestroy {
  registry = inject(SlotRegistryService);
  cdr = inject(ChangeDetectorRef);

  currentPage = 0;
  totalPages = 6;
  isFlipping = false;
  flipDirection: 'next' | 'prev' = 'next';
  dragStartX = 0;
  isDragging = false;
  bootDone = false;
  charIndex = 0;
  lineIndex = 0;
  displayedLines: string[] = [];
  currentTyping = '';
  autoTimer: any = null;

  bootSequence = [
    'ABDELAZIZE_OS v1.0 — initialisation...',
    '> 61 ans. Reconversion totale. Aucune excuse.',
    '> Formation DWWM — 18 juin 2025',
    '> Chargement du caractère.............. OK',
    '> Chargement de l\'obstination.......... OK',
    '> Chargement du futur.................. OK',
    '> Système prêt.',
  ];

  months = [
    { date: 'Juin 2025',  label: 'La Décision', desc: 'Tout recommencer à 61 ans', gold: false },
    { date: 'Sept 2025',  label: 'Jour 1',       desc: 'HTML, CSS, JS, PHP, SQL', gold: false },
    { date: 'Nov 2025',   label: 'Angular',       desc: 'Frontend moderne, composants, SPA', gold: false },
    { date: 'Déc 2025',   label: 'Stage 1',       desc: 'Mairie d\'Yzeure', gold: true },
    { date: 'Janv 2026',  label: 'DevOps',        desc: 'Docker, Nginx, PHP-FPM, déploiement', gold: false },
    { date: 'Fév 2026',   label: 'Stage 2',       desc: 'Evolea — Moulins', gold: true },
    { date: 'Avr 2026',   label: 'Symfony',       desc: 'Backend, API REST, JWT RS256', gold: false },
    { date: 'Mai 2026',   label: 'Examen',        desc: 'MyCitizenAlert devant le jury', gold: true },
  ];

  skills = ['Angular 21', 'Symfony 7.4', 'Docker', 'JWT RS256', 'MySQL 8', 'TypeScript', 'PHP', 'Nginx'];

  nextSkills = [
    { label: 'Essentials IA', hours: '75h',  level: 'Débutant',     pct: 11 },
    { label: 'Fullstack IA',  hours: '450h', level: 'Intermédiaire', pct: 66 },
    { label: 'Lead IA',       hours: '150h', level: 'Expert',        pct: 23 },
  ];

  ngOnInit() {
    this.registry.register(Abdelazize);
  }

  ngAfterViewInit() {
    setTimeout(() => this.typeLine(), 400);
  }

  ngOnDestroy() {
    if (this.autoTimer) clearInterval(this.autoTimer);
  }

  typeLine() {
    if (this.lineIndex >= this.bootSequence.length) {
      setTimeout(() => {
        this.bootDone = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.goTo(1);
          setTimeout(() => this.startAutoPlay(), 1000);
        }, 500);
      }, 600);
      return;
    }
    const line = this.bootSequence[this.lineIndex];
    if (this.charIndex < line.length) {
      this.currentTyping += line[this.charIndex];
      this.charIndex++;
      this.cdr.detectChanges();
      setTimeout(() => this.typeLine(), 28);
    } else {
      this.displayedLines.push(this.currentTyping);
      this.currentTyping = '';
      this.charIndex = 0;
      this.lineIndex++;
      this.cdr.detectChanges();
      setTimeout(() => this.typeLine(), 120);
    }
  }

  startAutoPlay() {
    this.autoTimer = setInterval(() => {
      if (this.currentPage < this.totalPages - 1) {
        this.goTo(this.currentPage + 1);
      } else {
        this.goTo(1);
      }
    }, 4000);
  }

  stopAutoPlay() {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
  }

  goTo(page: number) {
    if (this.isFlipping || page === this.currentPage) return;
    if (page < 0 || page >= this.totalPages) return;
    this.flipDirection = page > this.currentPage ? 'next' : 'prev';
    this.isFlipping = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.currentPage = page;
      this.isFlipping = false;
      this.cdr.detectChanges();
    }, 700);
  }

  next() {
    this.stopAutoPlay();
    this.goTo(this.currentPage + 1);
  }

  prev() {
    this.stopAutoPlay();
    this.goTo(this.currentPage - 1);
  }

  onDragStart(e: MouseEvent | TouchEvent) {
    this.isDragging = true;
    this.dragStartX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
  }

  onDragEnd(e: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;
    this.isDragging = false;
    const endX = e instanceof MouseEvent ? e.clientX : e.changedTouches[0].clientX;
    const delta = this.dragStartX - endX;
    if (Math.abs(delta) > 50) {
      this.stopAutoPlay();
      delta > 0 ? this.goTo(this.currentPage + 1) : this.goTo(this.currentPage - 1);
    }
  }

  @HostListener('keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') { this.stopAutoPlay(); this.goTo(this.currentPage + 1); }
    if (e.key === 'ArrowLeft')  { this.stopAutoPlay(); this.goTo(this.currentPage - 1); }
  }

  range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i + 1);
  }
}
