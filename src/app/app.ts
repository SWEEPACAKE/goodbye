import { Component, inject, OnInit, signal } from '@angular/core';
import { Banner } from "./components/banner/banner";
import { SlotRegistryService } from './services/slot-registry';
import { NgComponentOutlet } from '@angular/common';
import { Slot } from './models/slot';
@Component({
  selector: 'app-root',
  imports: [Banner, NgComponentOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('goodbye');

  registry = inject(SlotRegistryService);

    slots: Slot[] = [
    { size: 'large',  component: null },
    { size: 'small',  component: null },
    { size: 'medium', component: null },
    { size: 'medium', component: null },
    { size: 'small',  component: null },
    { size: 'large',  component: null },
    { size: 'small',  component: null },
    { size: 'large',  component: null },
  ];

  ngOnInit() {
    const shuffled = this.registry.getShuffled();
    // On assigne chaque composant à un slot dans l'ordre shufflé
    shuffled.forEach((comp, i) => {
      if (this.slots[i]) this.slots[i].component = comp;
    });
  }
}
