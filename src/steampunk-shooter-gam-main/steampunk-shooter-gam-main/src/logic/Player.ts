export class Player {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  speed: number;
  maxSpeed: number;
  health: number;
  maxHealth: number;
  shootCooldown: number;
  shootDelay: number;
  armor: number;
  powerUpTimer: number;
  invulnerable: boolean;
  invulnerableTimer: number;
  
  // Sprite sheet properties
  image: HTMLImageElement;
  imageLoaded: boolean;
  frameX: number;
  frameY: number;
  maxFrame: number;
  
  // Animation properties
  fps: number;
  frameTimer: number;
  frameInterval: number;
  
  // Power-up state
  hasPowerUp: boolean;
  powerUpLimit: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    
    // Set the dimensions of a single frame from the sprite sheet
    this.width = 120;
    this.height = 190;
    
    // Movement properties
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = 5;
    this.maxSpeed = 8;
    
    // Health and combat properties
    this.health = 100;
    this.maxHealth = 100;
    this.shootCooldown = 0;
    this.shootDelay = 150; // milliseconds
    this.armor = 0;
    this.powerUpTimer = 0;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    
    // Load the player's sprite sheet image
    this.image = new Image();
    this.imageLoaded = false;
    this.image.onload = () => {
      this.imageLoaded = true;
    };
    this.image.src = 'https://www.frankslaboratory.co.uk/downloads/103/player.png';
    
    // Set up properties for sprite animation
    this.frameX = 0; // Current horizontal frame
    this.frameY = 0; // Current vertical row (0 for normal, 1 for power-up)
    this.maxFrame = 37; // The last frame index in a row
    
    // Add properties to control animation speed (20 frames per second)
    this.fps = 20;
    this.frameTimer = 0;
    this.frameInterval = 1000 / this.fps;
    
    // Set up properties for the power-up mode
    this.hasPowerUp = false;
    this.powerUpLimit = 10000; // 10 seconds
  }

  update(deltaTime: number, keys: Record<string, boolean>, canvasWidth: number, canvasHeight: number) {
    // 1. Handle player movement based on input
    this.velocityX = 0;
    this.velocityY = 0;

    // If the 'ArrowUp' key is pressed, move up
    if (keys.ArrowUp || keys['w'] || keys['W']) {
      this.velocityY = -this.speed;
    }
    // If the 'ArrowDown' key is pressed, move down
    if (keys.ArrowDown || keys['s'] || keys['S']) {
      this.velocityY = this.speed;
    }
    // Left and right movement
    if (keys.ArrowLeft || keys['a'] || keys['A']) {
      this.velocityX = -this.speed;
    }
    if (keys.ArrowRight || keys['d'] || keys['D']) {
      this.velocityX = this.speed;
    }

    // Apply diagonal movement normalization
    if (this.velocityX !== 0 && this.velocityY !== 0) {
      this.velocityX *= 0.707; // 1/sqrt(2)
      this.velocityY *= 0.707;
    }

    // Apply speed to the player's position
    this.x += this.velocityX;
    this.y += this.velocityY;

    // 2. Enforce boundaries to keep the player on screen
    // Don't let the player move past the top of the canvas
    if (this.y < 0) {
      this.y = 0;
    }
    // Don't let the player move past the bottom of the canvas
    if (this.y > canvasHeight - this.height) {
      this.y = canvasHeight - this.height;
    }
    // Don't let the player move past the left edge
    if (this.x < 0) {
      this.x = 0;
    }
    // Don't let the player move past the right edge
    if (this.x > canvasWidth - this.width) {
      this.x = canvasWidth - this.width;
    }

    // 3. Handle power-up state logic
    // If hasPowerUp is true, manage the powerUpTimer
    if (this.hasPowerUp) {
      this.powerUpTimer += deltaTime;
      // When the timer exceeds the limit, reset hasPowerUp to false
      if (this.powerUpTimer >= this.powerUpLimit) {
        this.hasPowerUp = false;
        this.powerUpTimer = 0;
        this.armor = 0; // Remove armor when power-up ends
      }
    }
    // Set frameY to 1 if powered up, otherwise set it to 0
    this.frameY = this.hasPowerUp ? 1 : 0;

    // 4. Handle sprite animation logic based on deltaTime
    this.frameTimer += deltaTime;
    // If the frameTimer exceeds the frameInterval, advance to the next frame
    if (this.frameTimer >= this.frameInterval) {
      this.frameX++;
      // Reset the frameX to 0 if it exceeds maxFrame
      if (this.frameX > this.maxFrame) {
        this.frameX = 0;
      }
      this.frameTimer = 0;
    }

    // Update existing timers
    if (this.shootCooldown > 0) {
      this.shootCooldown -= deltaTime;
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= deltaTime;
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
      }
    }
  }

  draw(context: CanvasRenderingContext2D) {
    context.save();
    
    // Flash when invulnerable
    if (this.invulnerable && Math.floor(Date.now() / 100) % 2) {
      context.globalAlpha = 0.5;
    }

    if (this.imageLoaded) {
      // Draw the current frame of the player sprite sheet
      // Use the 9-argument version of drawImage to clip the correct frame from the sheet
      // context.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
      // sx, sy, sw, sh: The source rectangle on the sprite sheet
      // dx, dy, dw, dh: The destination rectangle on the canvas
      context.drawImage(
        this.image,
        this.frameX * 120, // sx: source x (frame width is 120px)
        this.frameY * 190, // sy: source y (frame height is 190px)
        120, // sw: source width
        190, // sh: source height
        this.x, // dx: destination x
        this.y, // dy: destination y
        this.width, // dw: destination width (scaled to fit game)
        this.height // dh: destination height (scaled to fit game)
      );
    } else {
      // Fallback: Draw mechanical seahorse body while sprite loads
      context.fillStyle = '#2D4A3A'; // Dark steampunk green
      context.fillRect(this.x + 10, this.y + 15, this.width - 30, this.height - 30);

      // Draw seahorse head/snout
      context.fillStyle = '#3A5F4A';
      context.beginPath();
      context.ellipse(this.x + this.width - 15, this.y + this.height / 2, 18, 12, 0, 0, Math.PI * 2);
      context.fill();

      // Draw mechanical gears
      context.fillStyle = '#B8860B'; // Dark golden rod
      context.beginPath();
      context.arc(this.x + 20, this.y + 25, 6, 0, Math.PI * 2);
      context.fill();
      
      context.beginPath();
      context.arc(this.x + 35, this.y + 20, 4, 0, Math.PI * 2);
      context.fill();

      // Draw dorsal fin elements
      context.fillStyle = '#4CAF50'; // Bright green
      context.beginPath();
      context.moveTo(this.x + 15, this.y + 8);
      context.lineTo(this.x + 25, this.y + 2);
      context.lineTo(this.x + 35, this.y + 5);
      context.lineTo(this.x + 30, this.y + 15);
      context.closePath();
      context.fill();

      // Draw tail fin
      context.fillStyle = '#66BB6A';
      context.beginPath();
      context.moveTo(this.x, this.y + this.height / 2);
      context.lineTo(this.x - 20, this.y + 8);
      context.lineTo(this.x - 15, this.y + this.height / 2);
      context.lineTo(this.x - 20, this.y + this.height - 8);
      context.closePath();
      context.fill();
    }

    // Draw power-up glow
    if (this.hasPowerUp || this.armor > 0) {
      context.strokeStyle = '#FFD700';
      context.lineWidth = 3;
      context.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
    }

    context.restore();
  }

  // Existing methods preserved
  canShoot(): boolean {
    return this.shootCooldown <= 0;
  }

  shoot(): boolean {
    if (this.canShoot()) {
      this.shootCooldown = this.shootDelay;
      return true;
    }
    return false;
  }

  takeDamage(damage: number): boolean {
    if (this.invulnerable) return false;

    const actualDamage = Math.max(1, damage - this.armor);
    this.health -= actualDamage;
    this.invulnerable = true;
    this.invulnerableTimer = 500; // 0.5 seconds of invulnerability

    if (this.health <= 0) {
      this.health = 0;
      return true; // Player died
    }
    return false;
  }

  heal(amount: number) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  powerUp(type: string, duration = 10000) {
    if (type === 'armor') {
      this.armor = 5;
      this.hasPowerUp = true;
      this.powerUpTimer = 0; // Reset timer when getting new power-up
      this.powerUpLimit = duration;
    }
  }

  // Add method for shooting projectiles (referenced in original template)
  shootTop() {
    // This method would be used if implementing a projectile system within the player class
    // For now, projectile creation is handled in the main game loop
    return this.shoot();
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}