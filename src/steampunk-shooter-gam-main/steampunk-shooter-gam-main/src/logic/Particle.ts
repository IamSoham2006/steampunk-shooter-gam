export class Particle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  type: string;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  gravity: number;
  friction: number;

  constructor(x: number, y: number, velocityX: number, velocityY: number, type = 'explosion', color = '#FFD700') {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.type = type;
    this.color = color;
    this.life = 1.0;
    this.maxLife = 1.0;
    this.size = Math.random() * 4 + 2;
    this.gravity = 0.1;
    this.friction = 0.95;
    
    // Set properties based on type
    switch (type) {
      case 'explosion':
        this.life = 0.8 + Math.random() * 0.4;
        this.maxLife = this.life;
        this.size = Math.random() * 6 + 3;
        this.gravity = 0.05;
        break;
      case 'steam':
        this.life = 0.6 + Math.random() * 0.3;
        this.maxLife = this.life;
        this.size = Math.random() * 8 + 4;
        this.velocityY -= Math.random() * 2;
        this.gravity = -0.02; // Steam rises
        this.friction = 0.98;
        break;
      case 'spark':
        this.life = 0.4 + Math.random() * 0.3;
        this.maxLife = this.life;
        this.size = Math.random() * 3 + 1;
        this.gravity = 0.2;
        break;
    }
  }

  update(deltaTime: number) {
    // Update position
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Apply physics
    this.velocityY += this.gravity;
    this.velocityX *= this.friction;
    this.velocityY *= this.friction;
    
    // Update life
    this.life -= deltaTime / 1000;
    
    // Shrink over time
    if (this.type === 'steam') {
      this.size += 0.1; // Steam expands
    } else {
      this.size *= 0.995; // Other particles shrink
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.life <= 0) return;
    
    ctx.save();
    
    const alpha = this.life / this.maxLife;
    
    switch (this.type) {
      case 'explosion':
        // Explosion particles - bright colors that fade
        const hue = Math.floor((1 - alpha) * 60); // Red to yellow
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'steam':
        // Steam particles - white/gray that fades
        ctx.fillStyle = `rgba(220, 220, 220, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'spark':
        // Spark particles - bright yellow/white
        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
        ctx.fillRect(
          this.x - this.size / 2, 
          this.y - this.size / 2, 
          this.size, 
          this.size
        );
        break;
    }
    
    ctx.restore();
  }

  isDead(): boolean {
    return this.life <= 0 || this.size <= 0.5;
  }
}

// Explosion utility function
export function createExplosion(x: number, y: number, particleCount = 15): Particle[] {
  const particles: Particle[] = [];
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
    const speed = Math.random() * 4 + 2;
    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;
    
    particles.push(new Particle(x, y, velocityX, velocityY, 'explosion'));
  }
  
  return particles;
}

// Steam utility function
export function createSteam(x: number, y: number, particleCount = 8): Particle[] {
  const particles: Particle[] = [];
  
  for (let i = 0; i < particleCount; i++) {
    const velocityX = (Math.random() - 0.5) * 2;
    const velocityY = Math.random() * -3 - 1;
    
    particles.push(new Particle(x, y, velocityX, velocityY, 'steam'));
  }
  
  return particles;
}

// Sparks utility function
export function createSparks(x: number, y: number, particleCount = 6): Particle[] {
  const particles: Particle[] = [];
  
  for (let i = 0; i < particleCount; i++) {
    const velocityX = (Math.random() - 0.5) * 6;
    const velocityY = (Math.random() - 0.5) * 6;
    
    particles.push(new Particle(x, y, velocityX, velocityY, 'spark'));
  }
  
  return particles;
}