import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-emmanuel',
  imports: [CommonModule],
  templateUrl: './emmanuel.html',
  styleUrl: './emmanuel.scss',
})
export class Emmanuel implements OnInit {
  dateDepart: Date = new Date('2026-06-4');
  compteur: number = 0;
  maintenant: Date = new Date(Date.now());

  ngOnInit(): void {
    this.calculateDays();

    setInterval(() => this.calculateDays(), 86400000);
  }

  calculateDays(): void {
    const maintenant = new Date(Date.now());
    const timeDiff = maintenant.getTime() - this.dateDepart.getTime();
    this.compteur = Math.floor(timeDiff / (1000 * 3600 * 24));
  }
}
