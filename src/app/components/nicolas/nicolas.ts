import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { Fighter } from '../../models/fighter';
import { Projectile } from '../../models/projectile';



@Component({
  selector: 'app-nicolas',
  imports: [],
  templateUrl: './nicolas.html',
  styleUrl: './nicolas.scss',
})
export class Nicolas implements AfterViewInit, OnDestroy {

  /******************
   * 
   *      PROPRIÉTÉS
   * 
   *  ***************/




  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private animFrameId!: number;
  private keys = new Set<string>();

  private readonly GROUND_RATIO = 0.78;
  private readonly SPEED = 6;
  private readonly ATTACK_RANGE = 90;
  private readonly ATTACK_DURATION = 8;
  private readonly ATTACK_DAMAGE = 15;

  private player!: Fighter;
  private enemy!: Fighter;

  gameOver = false;
  victory = false;

  private inputBuffer: string[] = [];
  private readonly HADOKEN_SEQUENCE = ['ArrowDown', 'ArrowDown+ArrowRight', 'ArrowRight'];
  private readonly BUFFER_MAX = 10; // on garde les 10 dernières entrées
  private readonly BUFFER_WINDOW = 1000; // ms pour compléter le mouvement
  private lastInputTime = 0;

  private projectiles: Projectile[] = [];
  private readonly HADOKEN_SPEED = 10;
  private readonly HADOKEN_DAMAGE = 30;
  private hadokenImage!: HTMLImageElement;
  private readonly HADOKEN_DISPLAY_SIZE = 80;

  /******************
   * 
   *      FONCTIONS
   * 
   *  ***************/






  constructor(private ngZone: NgZone) {}

  private resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  private initFighters() {
    const canvas = this.canvasRef.nativeElement;
    const groundY = canvas.height * this.GROUND_RATIO;
    const fh = 80;

    this.player = {
      x: 80,
      y: groundY - fh,
      width: 50,
      height: fh,
      hp: 100,
      maxHp: 100,
      velocityX: 0,
      facing: 1,
      state: 'idle',
      isAttacking: false,
      attackTimer: 0,
      animTimer: 0,
      color: '#4fc3f7',
      label: 'Vous',
      knockbackTimer: 0,
    };

    this.enemy = {
      x: canvas.width - 130,
      y: groundY - fh,
      width: 50,
      height: fh,
      hp: 100,
      maxHp: 100,
      velocityX: 0,
      facing: -1,
      state: 'idle',
      isAttacking: false,
      attackTimer: 0,
      animTimer: 0,
      color: '#ef5350',
      label: 'Ennemi',
      knockbackTimer: 0,
    };
  }

  private getCurrentDirectional(): string | null {
    const down  = this.keys.has('ArrowDown');
    const right = this.keys.has('ArrowRight');
    if (down && right) return 'ArrowDown+ArrowRight';
    if (down)  return 'ArrowDown';
    if (right) return 'ArrowRight';
    return null;
  }

  private checkHadoken(): boolean {
    // On cherche la séquence dans le buffer (pas forcément contiguë)
    let seqIndex = 0;
    for (const input of this.inputBuffer) {
      if (input === this.HADOKEN_SEQUENCE[seqIndex]) {
        seqIndex++;
        if (seqIndex === this.HADOKEN_SEQUENCE.length) return true;
      }
    }
    return false;
  }
  
  private triggerAttack() {
    if (this.player.isAttacking || this.player.hp <= 0) return;
    this.player.isAttacking = true;
    this.player.attackTimer = this.ATTACK_DURATION;

    const dist = Math.abs(
      (this.player.x + this.player.width / 2) -
      (this.enemy.x + this.enemy.width / 2)
    );
    if (dist < this.ATTACK_RANGE) {
      this.enemy.hp = Math.max(0, this.enemy.hp - this.ATTACK_DAMAGE);
      this.enemy.knockbackTimer = 10;
    }
  }
  private triggerHadoken() {
    if (this.player.hp <= 0) return;
    const cx = this.player.x + this.player.width / 2;
    const cy = this.player.y + this.player.height * 0.4; // hauteur du torse
    this.projectiles.push({
      x: cx,
      y: cy,
      velocityX: this.HADOKEN_SPEED * this.player.facing,
      radius: 18,
      life: 120,
    });
  }

  
  // --- Update ---

  private update() {
    const canvas = this.canvasRef.nativeElement;
    if (this.enemy.knockbackTimer > 0) this.enemy.knockbackTimer--;
    if (this.player.hp <= 0 || this.enemy.hp <= 0) return;

    // Mouvement
    if (this.keys.has('ArrowLeft')) {
      this.player.velocityX = -this.SPEED;
      this.player.facing = -1;
    } else if (this.keys.has('ArrowRight')) {
      this.player.velocityX = this.SPEED;
      this.player.facing = 1;
    } else {
      this.player.velocityX = 0;
    }

    this.player.x += this.player.velocityX;
    this.player.x = Math.max(0, Math.min(canvas.width - this.player.width, this.player.x));

    // Timer d'attaque
    if (this.player.isAttacking) {
      this.player.attackTimer--;
      if (this.player.attackTimer <= 0) {
        this.player.isAttacking = false;
      }
    }

    // État de l'animation
    if (this.player.isAttacking) {
      this.player.state = 'attack';
    } else if (this.player.velocityX !== 0) {
      this.player.state = 'walk';
    } else {
      this.player.state = 'idle';
    }
    this.projectiles = this.projectiles.filter(p => {
      p.x += p.velocityX;
      p.life--;

      // Collision avec l'ennemi
      const ex = this.enemy.x + this.enemy.width / 2;
      const ey = this.enemy.y + this.enemy.height / 2;
      const dist = Math.hypot(p.x - ex, p.y - ey);
      if (dist < p.radius + 30) {
        this.enemy.hp = Math.max(0, this.enemy.hp - this.HADOKEN_DAMAGE);
        this.enemy.knockbackTimer = 30;
        return false; // supprime le projectile
      }

      return p.life > 0; // supprime si expiré
    });

    // Timer d'animation (toujours incrémenté)
    this.player.animTimer++;
    this.enemy.animTimer++;
  }





  /******************
   * 
   *      ÉVENEMENTS
   * 
   *  ***************/




  ngAfterViewInit() {
    const book = document.getElementById('myBook');
    if(book) {
      book.addEventListener('click', () => {
        book.classList.toggle('open');
      });
    }
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();
    this.initFighters();
    this.hadokenImage = new Image();
    this.hadokenImage.src = 'images/hadoken.gif';
    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        this.update();
        this.draw();
        this.animFrameId = requestAnimationFrame(loop);
      };
      this.animFrameId = requestAnimationFrame(loop);
    });
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animFrameId);
  }

  
  // --- Inputs ---

  onKeyDown(e: KeyboardEvent) {
    this.keys.add(e.code);

    // Enregistrement dans le buffer
    const now = Date.now();
    if (now - this.lastInputTime > this.BUFFER_WINDOW) {
      this.inputBuffer = []; // trop long entre les inputs, on repart à zéro
    }
    this.lastInputTime = now;

    // Construit l'entrée courante (combinaison de touches)
    const current = this.getCurrentDirectional();
    if (current) {
      this.inputBuffer.push(current);
      if (this.inputBuffer.length > this.BUFFER_MAX) {
        this.inputBuffer.shift();
      }
    }

    if (e.code === 'Space') {
      if (this.checkHadoken()) {
        this.triggerHadoken();
        this.inputBuffer = [];
      } else {
        this.triggerAttack();
      }
    }
  }


  onKeyUp(e: KeyboardEvent) {
    this.keys.delete(e.code);
  }



  restart() {
    this.gameOver = false;
    this.victory = false;
    this.keys.clear();
    this.resizeCanvas();
    this.initFighters();
  }



  /******************
   * 
   *      RENDU DANS LE CANVAS
   * 
   *  ***************/

  // Rendu général
  private draw() {
    const canvas = this.canvasRef.nativeElement;
    const { width, height } = canvas;
    const groundY = height * this.GROUND_RATIO;

    this.ctx.clearRect(0, 0, width, height);

    this.drawBackground(width, height, groundY);
    this.drawFighter(this.player);
    this.drawFighter(this.enemy);
    this.projectiles.forEach(p => this.drawHadoken(p));
    this.drawHUD(width);
    this.drawControls(width, height);

    if (this.enemy.hp <= 0) this.drawVictory(width, height);
    if (this.player.hp <= 0) this.drawDefeat(width, height);
  }

  // Rendu du hadoken si il est détecté
  private drawHadoken(p: Projectile) {
    if (!this.hadokenImage.complete) return; // image pas encore chargée

    const size = this.HADOKEN_DISPLAY_SIZE + Math.sin(p.life * 0.4) * 4;
    
    this.ctx.save();
    
    // Flip si la boule va vers la gauche
    if (p.velocityX < 0) {
      this.ctx.translate(p.x * 2, 0);
      this.ctx.scale(-1, 1);
    }

    this.ctx.drawImage(this.hadokenImage, p.x - size / 2, p.y - size / 2, size, size);

    this.ctx.restore();
  }

  // Rendu de l'arrière-plan
  private drawBackground(w: number, h: number, groundY: number) {
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#1a1a2e');
    skyGrad.addColorStop(1, '#16213e');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, w, groundY);

    this.ctx.fillStyle = '#0f3460';
    this.ctx.fillRect(0, groundY, w, h - groundY);

    this.ctx.strokeStyle = '#e94560';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, groundY);
    this.ctx.lineTo(w, groundY);
    this.ctx.stroke();
  }

  // Rendu des personnages
  private drawFighter(f: Fighter) {
    if (f.hp <= 0) {
      this.drawDefeatedFighter(f);
      return;
    }

    const cx = f.x + f.width / 2;
    const gy = f.y + f.height;
    const t = f.animTimer;

    this.ctx.save();

    if (f.facing === -1) {
      this.ctx.translate(cx * 2, 0);
      this.ctx.scale(-1, 1);
    }

    if (f.knockbackTimer > 0) {
      const angle = (f.facing * -1) * -0.3; // inclinaison vers l'arrière
      this.ctx.translate(cx, gy);
      this.ctx.rotate(angle);
      this.ctx.translate(-cx, -gy);
    }
    switch (f.state) {
      case 'idle':   this.drawIdle(f, cx, gy, t);   break;
      case 'walk':   this.drawWalk(f, cx, gy, t);   break;
      case 'attack': this.drawAttack(f, cx, gy, t); break;
    }

    this.ctx.restore();

    // Label (hors du flip)
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 12px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(f.label, f.x + f.width / 2, f.y - 10);
  }

  // Rendu de l'idle animation
  private drawIdle(f: Fighter, cx: number, gy: number, t: number) {
    const bob = Math.sin(t * 0.05) * 2;
    this.drawLegs(f.color, cx, gy, 0, 0);
    this.drawBody(f.color, cx, gy - 30 + bob);
    this.drawHead(f.color, cx, gy - 68 + bob);
    this.drawArms(f.color, cx, gy - 48 + bob, 5, -5);
  }

  // Rendu de l'animation de marche
  private drawWalk(f: Fighter, cx: number, gy: number, t: number) {
    const legSwing = Math.sin(t * 0.25) * 14;
    const armSwing = Math.sin(t * 0.25) * 10;
    const bob = Math.abs(Math.sin(t * 0.25)) * -2;
    this.drawLegs(f.color, cx, gy, legSwing, -legSwing);
    this.drawBody(f.color, cx, gy - 30 + bob);
    this.drawHead(f.color, cx, gy - 68 + bob);
    this.drawArms(f.color, cx, gy - 48 + bob, -armSwing, armSwing);
  }

  // Rendu de l'animation coup de poing
  private drawAttack(f: Fighter, cx: number, gy: number, t: number) {
    const progress = 1 - (f.attackTimer / this.ATTACK_DURATION);
    const punchExtend = Math.sin(progress * Math.PI) * 38;
    this.drawLegs(f.color, cx, gy, 12, -12);
    this.drawBody(f.color, cx, gy - 30);
    this.drawHead(f.color, cx, gy - 68);
    this.drawArms(f.color, cx, gy - 48, -8, punchExtend);
  }

  // Rendu du personnage battu
  private drawDefeatedFighter(f: Fighter) {
    const cx = f.x + f.width / 2;
    const gy = f.y + f.height;
    // Personnage couché sur le sol
    this.ctx.save();
    this.ctx.globalAlpha = 0.6;
    this.ctx.fillStyle = '#555';
    // Corps horizontal
    this.ctx.fillRect(cx - 35, gy - 14, 70, 14);
    // Tête sur le côté
    this.ctx.fillRect(cx + 30, gy - 20, 20, 20);
    this.ctx.restore();
  }

  // Rendu du corps par rapport à la position du personnage
  private drawBody(color: string, cx: number, baseY: number) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(cx - 13, baseY - 32, 26, 32);
  }

  // Rendu de la tête par rapport à la position du personnage
  private drawHead(color: string, cx: number, baseY: number) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(cx - 12, baseY - 26, 24, 24);
    // Yeux
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(cx - 7, baseY - 18, 4, 4);
    this.ctx.fillRect(cx + 3, baseY - 18, 4, 4);
    // Bouche
    this.ctx.fillRect(cx - 4, baseY - 8, 8, 2);
  }

  // Rendu des jambes par rapport à la position du personnage
  private drawLegs(color: string, cx: number, gy: number, angleL: number, angleR: number) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 9;
    this.ctx.lineCap = 'round';

    // Jambe gauche
    this.ctx.beginPath();
    this.ctx.moveTo(cx - 7, gy - 32);
    this.ctx.lineTo(cx - 7 + angleL * 0.6, gy);
    this.ctx.stroke();

    // Jambe droite
    this.ctx.beginPath();
    this.ctx.moveTo(cx + 7, gy - 32);
    this.ctx.lineTo(cx + 7 + angleR * 0.6, gy);
    this.ctx.stroke();
  }

  // Rendu des bras par rapport à la position du personnage
  private drawArms(color: string, cx: number, baseY: number, angleL: number, angleR: number) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 8;
    this.ctx.lineCap = 'round';

    // Bras arrière
    this.ctx.beginPath();
    this.ctx.moveTo(cx - 13, baseY - 12);
    this.ctx.lineTo(cx - 13 + angleL, baseY + 18);
    this.ctx.stroke();

    // Bras avant
    this.ctx.beginPath();
    this.ctx.moveTo(cx + 13, baseY - 12);
    this.ctx.lineTo(cx + 13 + angleR, baseY - 3);
    this.ctx.stroke();

    // Poing au bout du bras avant
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(cx + 13 + angleR, baseY -3, 7, 0, Math.PI * 2);
    this.ctx.fill();
  }

  // Rendu de l'interface
  private drawHUD(w: number) {
    this.drawHealthBar(16, 14, Math.min(200, w * 0.3), this.player);
    this.drawHealthBar(w - 16 - Math.min(200, w * 0.3), 14, Math.min(200, w * 0.3), this.enemy);
  }

  // Rendu d'une barre de vie en fonction du personnage
  private drawHealthBar(x: number, y: number, barWidth: number, f: Fighter) {
    const barHeight = 16;
    const ratio = f.hp / f.maxHp;

    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(x, y, barWidth, barHeight);

    const color = ratio > 0.5 ? '#4caf50' : ratio > 0.25 ? '#ff9800' : '#f44336';
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, barWidth * ratio, barHeight);

    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, barWidth, barHeight);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 10px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${f.label}  ${f.hp}/${f.maxHp}`, x, y + barHeight + 12);
  }

  // Rendu des contrôles en bas de l'écran
  private drawControls(w: number, h: number) {
    this.ctx.fillStyle = 'rgba(255,255,255,0.25)';
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('← → : se déplacer   |   ESPACE : attaquer   |   ↓↘→ + ESPACE : HADOUKEN   |   cliquer pour activer', w / 2, h - 8);
  }

  // Rendu de l'écran de victoire
  private drawVictory(w: number, h: number) {
    this.ctx.fillStyle = 'rgba(0,0,0,0.55)';
    this.ctx.fillRect(0, 0, w, h);
    this.ctx.fillStyle = '#ffd700';
    this.ctx.font = `bold ${Math.max(24, w * 0.07)}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('VICTOIRE !', w / 2, h / 2 - 10);
    this.ngZone.run(() => { this.victory = true; this.gameOver = true; });
  }

  // Rendu de l'écran de défaite (impossible à obtenir vu que l'adversaire se défend pas mais bon)
  private drawDefeat(w: number, h: number) {
    this.ctx.fillStyle = 'rgba(0,0,0,0.55)';
    this.ctx.fillRect(0, 0, w, h);
    this.ctx.fillStyle = '#ef5350';
    this.ctx.font = `bold ${Math.max(24, w * 0.07)}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('DÉFAITE...', w / 2, h / 2 - 10);
    this.ngZone.run(() => { this.victory = false; this.gameOver = true; });
  }
}