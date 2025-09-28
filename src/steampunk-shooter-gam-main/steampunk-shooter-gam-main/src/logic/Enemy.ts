// Parent Enemy class and several child classes for each enemy type.
// Each class handles its own state, appearance, and behavior for our 2D game.

interface Game {
  width: number;
  height: number;
  speed: number;
  debug?: boolean;
}

// ===================================================================================
// ## PARENT ENEMY CLASS (Shared Logic) ##
// ===================================================================================
export class Enemy {
  game: Game;
  x: number;
  y: number;
  width: number;
  height: number;
  markedForDeletion: boolean;
  speedX: number;
  lives: number;
  score: number;
  type?: string;
  
  // Sprite animation properties
  frameX: number;
  maxFrame: number;
  frameTimer: number;
  fps: number;
  frameInterval: number;
  frameY: number;
  image: HTMLImageElement;
  imageLoaded: boolean;

  // The constructor initializes properties shared by all enemies.
  constructor(game: Game) {
    this.game = game;
    this.x = this.game.width; // All enemies start off-screen to the right.
    this.markedForDeletion = false;
    
    // Default values - will be overridden by child classes
    this.width = 50;
    this.height = 50;
    this.speedX = 1;
    this.lives = 1;
    this.score = 1;
    this.y = 0;
    
    // Sprite animation properties.
    this.frameX = 0;
    this.maxFrame = 37;
    this.frameTimer = 0;
    this.fps = 20;
    this.frameInterval = 1000 / this.fps;
    this.frameY = 0;
    
    // Image will be set by child classes
    this.image = new Image();
    this.imageLoaded = false;
  }

  // The update method handles movement and animation.
  update(deltaTime: number) {
    // Move the enemy from right to left, accounting for game speed.
    this.x -= this.speedX + this.game.speed;

    // Mark for deletion if it moves off-screen.
    if (this.x + this.width < 0) this.markedForDeletion = true;

    // Handle sprite animation timing.
    if (this.frameTimer > this.frameInterval) {
      if (this.frameX < this.maxFrame) this.frameX++;
      else this.frameX = 0;
      this.frameTimer = 0;
    } else {
      this.frameTimer += deltaTime;
    }
  }

  // The draw method renders the enemy.
  draw(context: CanvasRenderingContext2D) {
    // If in debug mode, draw the hitbox and lives.
    if (this.game.debug) {
      context.strokeRect(this.x, this.y, this.width, this.height);
      context.fillStyle = 'black';
      context.font = '20px Helvetica';
      context.fillText(this.lives.toString(), this.x, this.y);
    }

    if (this.imageLoaded) {
      // Draw the current sprite frame.
      context.drawImage(this.image, 
        this.frameX * this.width, 
        this.frameY * this.height, 
        this.width, 
        this.height, 
        this.x, 
        this.y, 
        this.width, 
        this.height
      );
    }
  }

  // Methods that child classes might override
  takeDamage(damage: number): boolean {
    this.lives -= damage;
    return this.lives <= 0;
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  isOffScreen(): boolean {
    return this.x < -this.width - 50;
  }

  // For compatibility with existing game code
  canShoot(playerX: number, playerY: number): boolean {
    // Only certain enemy types can shoot
    return false;
  }

  shoot(): boolean {
    return false;
  }

  // Properties for compatibility
  get health() { return this.lives; }
  set health(value: number) { this.lives = value; }
  get maxHealth() { return this.lives; }
  get damage() { return 10; }
}

// ===================================================================================
// ## CHILD ENEMY CLASSES ##
// ===================================================================================

// ### Angler 1: Basic enemy ###
export class Angler1 extends Enemy {
  constructor(game: Game) {
    super(game);
    this.width = 228;
    this.height = 169;
    this.y = Math.random() * (this.game.height * 0.95 - this.height);
    this.image = new Image();
    this.image.onload = () => {
      this.imageLoaded = true;
    };
    this.image.src = 'https://www.frankslaboratory.co.uk/downloads/103/angler1.png';
    this.frameY = Math.floor(Math.random() * 3); // 3 animation rows
    this.lives = 5;
    this.score = this.lives;
    this.speedX = Math.random() * 1 + 1;
    this.type = 'angler1';
  }

  get damage() { return 15; }
}

// ### Angler 2: Slightly tougher enemy ###
export class Angler2 extends Enemy {
  constructor(game: Game) {
    super(game);
    this.width = 213;
    this.height = 165;
    this.y = Math.random() * (this.game.height * 0.95 - this.height);
    this.image = new Image();
    this.image.onload = () => {
      this.imageLoaded = true;
    };
    this.image.src = 'https://www.frankslaboratory.co.uk/downloads/103/angler2.png';
    this.frameY = Math.floor(Math.random() * 2); // 2 animation rows
    this.lives = 6;
    this.score = this.lives;
    this.speedX = Math.random() * 2 + 0.2;
    this.type = 'angler2';
  }

  get damage() { return 18; }
}

// ### Lucky Fish: Power-up enemy ###
export class LuckyFish extends Enemy {
  constructor(game: Game) {
    super(game);
    this.width = 99;
    this.height = 95;
    this.y = Math.random() * (this.game.height * 0.95 - this.height);
    this.image = new Image();
    this.image.onload = () => {
      this.imageLoaded = true;
    };
    this.image.src = 'https://www.frankslaboratory.co.uk/downloads/103/lucky.png';
    this.frameY = Math.floor(Math.random() * 2); // 2 animation rows
    this.lives = 5;
    this.score = 15;
    this.speedX = Math.random() * 1 + 1;
    this.type = 'lucky'; // Special type for power-up logic
  }

  get damage() { return 0; } // Lucky fish don't damage player
}

// ### Hive Whale: Large, slow boss that spawns drones ###
export class HiveWhale extends Enemy {
  constructor(game: Game) {
    super(game);
    this.width = 400;
    this.height = 227;
    this.y = Math.random() * (this.game.height * 0.95 - this.height);
    this.image = new Image();
    this.image.onload = () => {
      this.imageLoaded = true;
    };
    this.image.src = 'https://www.frankslaboratory.co.uk/downloads/103/hivewhale.png';
    this.frameY = 0; // Only 1 animation row
    this.lives = 20;
    this.score = this.lives;
    this.speedX = Math.random() * 0.5 + 0.2; // Moves very slowly
    this.type = 'hive'; // Special type for drone spawning logic
  }

  get damage() { return 30; }
}

// ### Drone: Small, fast enemies spawned by the Hive Whale ###
export class Drone extends Enemy {
  // Drones are spawned at a specific location, not off-screen.
  constructor(game: Game, x: number, y: number) {
    super(game);
    this.width = 115;
    this.height = 95;
    this.x = x;
    this.y = y;
    this.image = new Image();
    this.image.onload = () => {
      this.imageLoaded = true;
    };
    this.image.src = 'https://www.frankslaboratory.co.uk/downloads/103/drone.png';
    this.frameY = Math.floor(Math.random() * 2); // 2 animation rows
    this.lives = 3;
    this.score = this.lives;
    this.speedX = Math.random() * 3 + 2; // Moves very fast
    this.type = 'drone';
  }

  get damage() { return 12; }
}

// For backward compatibility, export a factory function
export function createEnemy(x: number, y: number, type: string, game?: Game): Enemy {
  // Create a simple game object if not provided
  const gameObj = game || { width: 1024, height: 576, speed: 1 };
  
  switch (type) {
    case 'angler1':
    case 'anglerfish':
      return new Angler1(gameObj);
    case 'angler2':
      return new Angler2(gameObj);
    case 'lucky':
      return new LuckyFish(gameObj);
    case 'hive':
    case 'whale':
      return new HiveWhale(gameObj);
    case 'drone':
      return new Drone(gameObj, x, y);
    default:
      return new Angler1(gameObj);
  }
}