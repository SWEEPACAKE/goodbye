import { Type } from "@angular/core";

// slot.model.ts
export type SlotSize = 'small' | 'medium' | 'large';

export interface Slot {
  size: SlotSize;
  component: Type<unknown> | null;
}