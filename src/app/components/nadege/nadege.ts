import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nadege',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nadege.html',
  styleUrls: ['./nadege.scss'],
})
export class Nadege {
  logoUrl = '/images/Wish_Cats_Surprised.webp';
  farewellMessage = 'Merci pour tous ces moments informatiquement instructifs partagés.';
  farewellDetails = [
    'Que la suite soit rempli de réussite et de belles aventures technologiques pour vous tous.',
    
    'À bientôt !',
    '🎀 Nadège 🎀',
    '😸'
  ];
}
