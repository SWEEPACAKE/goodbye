import { Component, OnDestroy, ElementRef, ViewChild, AfterViewInit, NgZone } from "@angular/core";

interface Obstacle { x: number; y: number; w: number; h: number; imgIdx: number; }

const BOARD_CODES: string[][] = [
  ["const x = undefined;", "x.map(v => v + 1);", "// TypeError !"],
  ["function chk(a) {", "  return a === NaN;", "} // faux a jamais"],
  ["<div class='broken'>", "  <span>pas ferme", "// tag orphelin"],
  ["fetch('/api/data')", ".then(r => r.jsn())", "// typo : .jsn()"],
  ["if (user = null) {", "  login();", "} // = pas ==="],
  ["npm install react@18", "react@17 --save", "// conflit versions"],
];

@Component({
  selector: "app-dylan",
  imports: [],
  templateUrl: "./dylan.html",
  styleUrl: "./dylan.scss",
})
export class Dylan implements AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private animId = 0;
  private boundKey!: (e: KeyboardEvent) => void;

  state: "menu" | "playing" | "victory" | "end" | "gameover" = "menu";
  readonly TARGET = 10;

  private nicolasImg  = new Image();
  private dylanImg    = new Image();
  private endImg      = new Image();
  private gameOverImg = new Image();
  private bugImgs: HTMLImageElement[] = [];
  private dylanArrived = false;

  private nic = { x: 100, y: 0, vy: 0, jumping: false, w: 80, h: 100 };
  private dyl = { x: 9999, y: 0, w: 90, h: 110 };

  private obstacles: Obstacle[] = [];
  private bgX = 0;
  private frame = 0;
  private spawnTimer = 0;
  private spawnIndex = 0;
  private totalToSpawn = 10;
  private victoryTimer = 0;
  private cleared = 0;
  private lives = 3;
  private invincible = 0;
  private speed = 6;
  private nextInterval = 100;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx    = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.nicolasImg.src  = "/images/run_nicolas_run.png";
    this.dylanImg.src    = "/images/dylan_hourra.png";
    this.dylanImg.onload = () => {
      if (this.dylanImg.naturalHeight > 0) {
        const h = 120;
        this.dyl.h = h;
        this.dyl.w = Math.round(this.dylanImg.naturalWidth * h / this.dylanImg.naturalHeight);
        this.dyl.y = this.groundY() - h;
      }
    };
    this.endImg.src      = "/images/fin_du_jeux%20.png";
    this.gameOverImg.src = "/images/game_over.png";
    ['bug1.jpg', 'bug2.jpg', 'bug3.jpg', 'bug4.jpg', 'bug5.png'].forEach(n => {
      const img = new Image(); img.src = '/images/' + n; this.bugImgs.push(img);
    });
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.boundKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); this.jump(); }
    };
    document.addEventListener("keydown", this.boundKey);
    this.ngZone.runOutsideAngular(() => this.loop());
  }

  private resize() {
    const p = this.canvas.parentElement as HTMLElement;
    this.canvas.width  = p.clientWidth  || 800;
    this.canvas.height = p.clientHeight || 380;
    this.nic.y = this.groundY() - this.nic.h;
    this.dyl.y = this.groundY() - this.dyl.h;
  }

  private groundY() { return this.canvas.height - 110; }

  onCanvasClick() {
    if (this.state === "gameover" || this.state === "end") { this.restartGame(); return; }
    if (this.state === "playing") this.jump();
  }

  startGame()   { this.reset(); this.state = "playing"; }
  restartGame() { this.reset(); this.state = "playing"; }

  private reset() {
    this.cleared = 0; this.obstacles = []; this.bgX = 0;
    this.frame = 0; this.spawnTimer = 0; this.spawnIndex = 0; this.victoryTimer = 0;
    this.lives = 3; this.invincible = 0; this.speed = 6;
    this.totalToSpawn = this.TARGET;
    this.nextInterval = 80 + Math.floor(Math.random() * 100);
    this.nic.y = this.groundY() - this.nic.h; this.nic.vy = 0; this.nic.jumping = false;
    this.nic.x = 100;
    this.dyl.x = 9999;
    this.dyl.y = this.groundY() - this.dyl.h;
    this.dylanArrived = false;
  }

  private jump() {
    if (!this.nic.jumping) { this.nic.vy = -17; this.nic.jumping = true; }
  }

  private loop() {
    this.update(); this.draw();
    this.animId = requestAnimationFrame(() => this.loop());
  }

  private update() {
    this.frame++;
    if (this.state === "end" || this.state === "menu" || this.state === "gameover") return;
    const ground = this.groundY() - this.nic.h;

    if (this.state === "playing") {
      this.nic.vy += 0.85;
      this.nic.y  += this.nic.vy;
      if (this.nic.y >= ground) { this.nic.y = ground; this.nic.vy = 0; this.nic.jumping = false; }
      this.bgX -= this.speed;
      if (this.invincible > 0) this.invincible--;

      if (++this.spawnTimer >= this.nextInterval && this.spawnIndex < this.totalToSpawn) {
        this.spawnTimer = 0;
        this.nextInterval = 80 + Math.floor(Math.random() * 100);
        const imgIdx1 = Math.floor(Math.random() * 5);
        this.obstacles.push({ x: this.canvas.width + 20, y: this.groundY() - 60, w: 60, h: 60, imgIdx: imgIdx1 });
        this.spawnIndex++;
        // 25% chance de double bug
        if (Math.random() < 0.25 && this.spawnIndex < this.totalToSpawn) {
          const imgIdx2 = Math.floor(Math.random() * 5);
          this.obstacles.push({ x: this.canvas.width + 100, y: this.groundY() - 60, w: 60, h: 60, imgIdx: imgIdx2 });
          this.spawnIndex++;
        }
      }

      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        this.obstacles[i].x -= this.speed;
        const o = this.obstacles[i];

        if (this.invincible === 0) {
          const mg = 10;
          const nx = this.nic.x + mg, ny = this.nic.y + mg;
          const nw = this.nic.w - mg * 2, nh = this.nic.h - mg * 2;
          if (nx < o.x + o.w && nx + nw > o.x && ny < o.y + o.h && ny + nh > o.y) {
            this.lives--;
            this.invincible = 90;
            this.totalToSpawn++;
            this.obstacles.splice(i, 1);
            if (this.lives <= 0) this.ngZone.run(() => { this.state = "gameover"; });
            continue;
          }
        }

        if (o.x + o.w < this.nic.x) {
          this.obstacles.splice(i, 1);
          this.cleared++;
          this.speed = 6 + this.cleared * 0.3;
          if (this.cleared >= this.TARGET) {
            this.ngZone.run(() => { this.state = "victory"; });
            this.dyl.x = this.canvas.width + 60;
          }
        }
      }
    }

    if (this.state === "victory") {
      this.victoryTimer++;
      // Phase 1 (0-60) : Dylan court depuis la droite vers son poste
      if (!this.dylanArrived) {
        this.dyl.x -= 12;
        if (this.dyl.x <= this.canvas.width - 210) {
          this.dyl.x = this.canvas.width - 210;
          this.dylanArrived = true;
        }
      }
      // Phase 2 (dylanArrived, timer < 140) : Nicolas court vers Dylan
      if (this.dylanArrived && this.victoryTimer < 140) {
        const target = this.dyl.x - 140;
        if (this.nic.x < target) {
          this.nic.x += 5;
          this.bgX   -= 5;
        }
      }
      // Fin apres 280 frames
      if (this.victoryTimer > 280) this.ngZone.run(() => { this.state = "end"; });
    }
  }

  private draw() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;

    if (this.state === "end") {
      if (this.endImg.complete && this.endImg.naturalWidth > 0) {
        ctx.drawImage(this.endImg, 0, 0, W, H);
      } else {
        ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, W, H);
      }
      ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0, H - 90, W, 90);
      ctx.fillStyle = "#FFD700"; ctx.font = "bold 18px Arial, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      this.wrapText(ctx, "Et voila comment on resoud les bugs ! Maintenant tu es un dev Harry heuu Dylan Pardon", W / 2, H - 45, W - 60, 24);
      // Bouton Rejouer en haut a gauche sur le canvas
      ctx.fillStyle = "#43a047"; ctx.fillRect(20, 14, 164, 48);
      ctx.fillStyle = "#fff"; ctx.font = "bold 18px Arial";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("\uD83D\uDD04 Rejouer", 102, 38);
      return;
    }

    if (this.state === "gameover") {
      if (this.gameOverImg.complete && this.gameOverImg.naturalWidth > 0) {
        ctx.drawImage(this.gameOverImg, 0, 0, W, H);
      } else {
        ctx.fillStyle = "#1a0000"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ff3333"; ctx.font = "bold 60px Arial";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("GAME OVER", W / 2, H / 2 - 30);
      }
      ctx.fillStyle = "rgba(0,0,0,0.78)"; ctx.fillRect(0, H - 80, W, 80);
      ctx.fillStyle = "#ff6b6b"; ctx.font = "bold 20px Arial";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("Les bugs ont gagne ! Score : " + this.cleared + " / " + this.TARGET, W / 2, H - 40);
      // Bouton Rejouer en haut a gauche sur le canvas
      ctx.fillStyle = "#43a047"; ctx.fillRect(20, 14, 164, 48);
      ctx.fillStyle = "#fff"; ctx.font = "bold 18px Arial";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("\uD83D\uDD04 Rejouer", 102, 38);
      return;
    }

    this.drawBg(ctx, W, H);

    if (this.state === "menu") {
      const bob = Math.sin(this.frame * 0.05) * 3;
      if (this.nicolasImg.complete && this.nicolasImg.naturalWidth > 0) {
        ctx.drawImage(this.nicolasImg, W / 2 - 40, this.groundY() - this.nic.h + bob, this.nic.w, this.nic.h);
      }
      return;
    }

    for (const o of this.obstacles) {
      const img = this.bugImgs[o.imgIdx];
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, o.x, o.y, o.w, o.h);
      } else {
        ctx.fillStyle = "#ff3333"; ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = "#fff"; ctx.font = "bold 10px Arial";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("BUG", o.x + o.w / 2, o.y + o.h / 2);
      }
    }

    // Celebration : saut commun quand Dylan est arrive ET Nicolas l'a rejoint
    const nicAtDylan = this.nic.x >= this.dyl.x - 160;
    const celebrating = this.state === "victory" && this.dylanArrived && nicAtDylan;
    const celebBounce = celebrating ? Math.abs(Math.sin(this.frame * 0.26)) * 30 : 0;

    const bob = celebrating ? 0 : (this.nic.jumping ? 0 : Math.sin(this.frame * 0.3) * 3);
    if (this.invincible > 0 && Math.floor(this.frame / 4) % 2 === 0) {
      // flash: skip frame
    } else if (this.nicolasImg.complete && this.nicolasImg.naturalWidth > 0) {
      ctx.drawImage(this.nicolasImg, this.nic.x, this.nic.y - celebBounce + bob, this.nic.w, this.nic.h);
    } else {
      ctx.fillStyle = "#3498db"; ctx.fillRect(this.nic.x, this.nic.y - celebBounce + bob, this.nic.w, this.nic.h);
    }

    if (this.state === "victory") {
      const dylBounce = (this.dylanArrived && nicAtDylan) ? celebBounce : 0;
      if (this.dylanImg.complete && this.dylanImg.naturalWidth > 0) {
        ctx.drawImage(this.dylanImg, this.dyl.x, this.dyl.y - dylBounce, this.dyl.w, this.dyl.h);
      } else {
        ctx.fillStyle = "#2ecc71"; ctx.fillRect(this.dyl.x, this.dyl.y - dylBounce, this.dyl.w, this.dyl.h);
      }
    }

    // HUD score
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(8, 8, 215, 34);
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px Arial";
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText("Bugs evites : " + this.cleared + " / " + this.TARGET, 16, 25);

    // HUD vies (coeurs)
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < this.lives ? "#e74c3c" : "#555";
      ctx.font = "22px Arial";
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText("❤", W - 14 - i * 30, 25);
    }

    // Hint de debut
    if (this.frame < 180 && this.cleared === 0 && this.spawnIndex === 0) {
      ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(W / 2 - 160, H / 2 - 22, 320, 44);
      ctx.fillStyle = "#FFD700"; ctx.font = "bold 16px Arial";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("ESPACE ou CLIC pour sauter !", W / 2, H / 2);
    }
  }

  private drawBg(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const ground = this.groundY();

    // Mur blanc casse / creme
    ctx.fillStyle = "#f4efe5"; ctx.fillRect(0, 0, W, ground);

    // Plinthe en bas du mur
    ctx.fillStyle = "#d4c9b0"; ctx.fillRect(0, ground - 10, W, 10);

    // Tableaux + fenetres (meme parallaxe = pas de decalage relatif)
    const bGap = 440, bOff = ((this.bgX * 0.6) % bGap + bGap) % bGap;
    let bi = 0;
    for (let bx = bOff - bGap; bx < W + bGap; bx += bGap) {
      // --- Tableau vert ---
      ctx.fillStyle = "#1e5631"; ctx.fillRect(bx, 15, 300, 135);
      ctx.strokeStyle = "#6d4c1f"; ctx.lineWidth = 7; ctx.strokeRect(bx, 15, 300, 135);
      ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = "#e8e8e8";
      ctx.font = "12px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "top";
      BOARD_CODES[bi % BOARD_CODES.length].forEach((l, idx) => ctx.fillText(l, bx + 12, 28 + idx * 22));
      ctx.restore();
      // --- Fenetre dans le gap apres le tableau ---
      const wx = bx + 316;
      // Cadre exterieur
      ctx.fillStyle = "#e0dbd0"; ctx.fillRect(wx - 4, 20, 82, 130);
      // Vitre
      ctx.fillStyle = "#bdd8ec"; ctx.fillRect(wx, 24, 74, 122);
      // Reflet
      ctx.fillStyle = "rgba(255,255,255,0.42)"; ctx.fillRect(wx + 5, 28, 14, 45);
      // Montants
      ctx.strokeStyle = "#c8c2b5"; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(wx + 37, 24); ctx.lineTo(wx + 37, 146);
      ctx.moveTo(wx, 85); ctx.lineTo(wx + 74, 85);
      ctx.stroke();
      bi++;
    }

    // Parquet bois clair - lames horizontales
    const plankH = 18;
    const plankPalette = ["#cba06a", "#be925c", "#d4aa72", "#c09862"];
    for (let py = ground; py < H; py += plankH) {
      ctx.fillStyle = plankPalette[Math.floor((py - ground) / plankH) % plankPalette.length];
      ctx.fillRect(0, py, W, plankH);
    }
    // Joints horizontaux
    ctx.strokeStyle = "#9a6430"; ctx.lineWidth = 1;
    for (let py = ground; py < H; py += plankH) {
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
    }
    // Joints verticaux scrollants
    const vJoint = 120, vOff = ((this.bgX * 1.2) % vJoint + vJoint) % vJoint;
    for (let vx = vOff - vJoint; vx < W; vx += vJoint) {
      ctx.beginPath(); ctx.moveTo(vx, ground); ctx.lineTo(vx, H); ctx.stroke();
    }

    // Bureaux + chaises + eleves (un bureau sur deux a un eleve)
    const dGap = 240, dOff = ((this.bgX * 1.5) % dGap + dGap) % dGap;
    let di = 0;
    for (let dx = dOff - dGap; dx < W + dGap; dx += dGap) {
      if (dx + 160 < this.nic.x - 10 || dx > this.nic.x + this.nic.w + 10) {
        const deskY = ground + 18;
        const sx = dx + 90;

        // === DOSSIER CHAISE (derriere l'eleve, dessine en premier) ===
        ctx.fillStyle = "#7a5232";
        ctx.fillRect(dx + 76, deskY - 22, 9, 22);

        // === ELEVE (corps de deskY-26 a deskY+32, couvre tout jusqu'a l'assise) ===
        if (di % 2 === 0) {
          // Corps complet: chest visible au-dessus du bureau, bas jusqu'a l'assise
          ctx.fillStyle = (di % 4 === 0) ? "#3a86c8" : "#e07820";
          ctx.fillRect(sx - 13, deskY - 26, 26, 58);
          // Tete
          ctx.fillStyle = "#f0c8a0";
          ctx.beginPath(); ctx.arc(sx, deskY - 40, 13, 0, Math.PI * 2); ctx.fill();
          // Cheveux
          ctx.fillStyle = (di % 6 === 0) ? "#1a1a1a" : "#6B3A1F";
          ctx.fillRect(sx - 13, deskY - 52, 26, 13);
          // Yeux
          ctx.fillStyle = "#2a2a2a";
          ctx.fillRect(sx - 6, deskY - 43, 3, 3);
          ctx.fillRect(sx + 3, deskY - 43, 3, 3);
        }

        // === PLATEAU DU BUREAU (recouvre la partie mediane du corps) ===
        ctx.fillStyle = "#d4a843"; ctx.fillRect(dx + 38, deskY, 124, 16);
        ctx.strokeStyle = "#b08020"; ctx.lineWidth = 1; ctx.strokeRect(dx + 38, deskY, 124, 16);

        // === PIEDS DU BUREAU ===
        ctx.fillStyle = "#a07030";
        ctx.fillRect(dx + 48, deskY + 16, 11, 47);
        ctx.fillRect(dx + 141, deskY + 16, 11, 47);

        // === CHAISE (assise au niveau du corps bas, pieds) ===
        ctx.fillStyle = "#8B5E3C";
        // Assise au meme niveau que le bas du corps de l'eleve
        ctx.fillRect(dx + 54, deskY + 32, 72, 9);
        // Pieds
        ctx.fillRect(dx + 58, deskY + 41, 9, 38);
        ctx.fillRect(dx + 111, deskY + 41, 9, 38);
      }
      di++;
    }
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
    const words = text.split(" "); let line = ""; const lines: string[] = [];
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    const total = lines.length * lh;
    lines.forEach((l, i) => ctx.fillText(l, x, y - total / 2 + i * lh + lh / 2));
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animId);
    document.removeEventListener("keydown", this.boundKey);
  }
}
