/**
 * Confetti animation utility for celebration effects.
 * Creates a burst of confetti particles at a given position.
 */

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  life: number;
}

export class ConfettiEffect {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: ConfettiParticle[] = [];
  private animationId: number | null = null;
  private readonly colors = [
    '#FF6B6B', // Coral
    '#4ECDC4', // Turquoise
    '#FFE66D', // Yellow
    '#95E1D3', // Mint
    '#FF8787', // Soft coral
    '#5DD9D1', // Bright turquoise
  ];

  constructor(private container: HTMLElement) {
    this.setupCanvas();
  }

  private setupCanvas(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '10000';
    this.canvas.id = 'confetti-canvas';

    document.body.appendChild(this.canvas);

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.ctx = this.canvas.getContext('2d');
    
    console.log('[ConfettiEffect] Canvas setup complete', this.canvas.width, 'x', this.canvas.height);
  }

  /**
   * Trigger confetti burst at specific coordinates.
   * Coordinates should be in viewport coordinates.
   */
  burst(x: number, y: number, particleCount: number = 20): void {
    if (!this.ctx || !this.canvas) {
      console.warn('[ConfettiEffect] Cannot burst: canvas not ready');
      return;
    }

    console.log(`[ConfettiEffect] Bursting ${particleCount} particles at (${x}, ${y})`);

    // Create particles with more spread
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.8;
      const velocity = 4 + Math.random() * 5;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 4, // Strong upward bias
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.5,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        size: 8 + Math.random() * 8, // Larger particles
        life: 1,
      });
    }

    // Start animation if not already running
    if (!this.animationId) {
      this.animate();
    }
  }

  private animate(): void {
    if (!this.ctx || !this.canvas) {
      console.warn('[ConfettiEffect] Animation stopped: no ctx or canvas');
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw particles
    let drawnCount = 0;
    this.particles = this.particles.filter((p) => {
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // Gravity
      p.rotation += p.rotationSpeed;
      p.life -= 0.015; // Slower fade out

      // Draw particle
      if (this.ctx) {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        this.ctx.globalAlpha = Math.max(0, p.life);
        this.ctx.fillStyle = p.color;

        // Draw confetti piece (rectangle)
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);

        this.ctx.restore();
        drawnCount++;
      }

      // Keep particle if still alive
      return p.life > 0;
    });

    // Continue animation if particles exist
    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.animate());
    } else {
      this.animationId = null;
      console.log('[ConfettiEffect] Animation complete');
    }
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.particles = [];
    this.canvas = null;
    this.ctx = null;
  }
}

