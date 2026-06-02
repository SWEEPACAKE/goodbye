type FighterState = 'idle' | 'walk' | 'attack';

export interface Fighter {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  velocityX: number;
  facing: 1 | -1;
  state: FighterState;
  isAttacking: boolean;
  attackTimer: number;
  animTimer: number;
  color: string;
  label: string;
  knockbackTimer: number;
}