interface TrailPoint {
  x: number;
  y: number;
}

export class Projectile {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  type: string;
  damage: number;
  width: number;
  height: number;
  trail: TrailPoint[];
  maxTrailLength: number;

  constructor(x: number, y: number, velocityX: number, velocityY: number, type = 'player', damage = 10) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.type = type; // 'player' or 'enemy'
    this.damage = damage;
    this.width = 8;
    this.height = 4;
    this.trail = [];
    this.maxTrailLength = 5;
    
    if (type === 'enemy') {
      this.width = 6;
      this.height = 6;
    }
  }

  update(deltaTime: number) {
    // Store previous position for trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    // Update position
    this.x += this.velocityX;
    this.y += this.velocityY;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Draw trail
    if (this.trail.length > 1) {
      for (let i = 0; i < this.trail.length - 1; i++) {
        const alpha = (i + 1) / this.trail.length * 0.3;
        if (this.type === 'player') {
          ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        } else {
          ctx.fillStyle = `rgba(255, 69, 0, ${alpha})`;
        }
        
        const size = (i + 1) / this.trail.length * (this.type === 'player' ? 4 : 3);
        ctx.fillRect(
          this.trail[i].x - size / 2, 
          this.trail[i].y - size / 2, 
          size, 
          size
        );
      }
    }

    // Draw main projectile
    if (this.type === 'player') {
      // Player projectile - golden energy bolt
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
      
      // Add glow effect
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(this.x - this.width / 4, this.y - this.height / 4, this.width / 2, this.height / 2);
    } else {
      // Enemy projectile - red energy orb
      ctx.fillStyle = '#FF4500';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Add inner glow
      ctx.fillStyle = '#FF6347';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.width / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  getBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }

  isOffScreen(canvasWidth: number, canvasHeight: number): boolean {
    return (
      this.x < -20 || 
      this.x > canvasWidth + 20 || 
      this.y < -20 || 
      this.y > canvasHeight + 20
    );
  }
}