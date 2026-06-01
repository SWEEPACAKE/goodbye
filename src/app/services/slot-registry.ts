import { computed, Injectable, signal, Type } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SlotRegistryService {
  private components = signal<Type<unknown>[]>([]);
  shuffled = computed(() => [...this.components()].sort(() => Math.random() - 0.5));

  register(component: Type<unknown>) {
    this.components.update(list => [...list, component]);
  }
  
  getShuffled(): Type<unknown>[] {
    return [...this.components()].sort(() => Math.random() - 0.5);
  }
}