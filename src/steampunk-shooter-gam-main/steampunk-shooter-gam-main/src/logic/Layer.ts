// Layer class for a parallax background in a 2D game.
// This class manages a single, seamlessly scrolling background image.

interface Game {
  speed: number;
}

export class Layer {
  game: Game;
  speedModifier: number;
  width: number;
  height: number;
  x: number;
  y: number;
  image: HTMLImageElement;
  imageLoaded: boolean;

  // The constructor initializes a single background layer.
  // It needs the main 'game' object, the image URL, and a 'speedModifier'.
  constructor(game: Game, imageSrc: string, speedModifier: number) {
    this.game = game;
    this.speedModifier = speedModifier;
    
    // Image properties. The asset width is 1768px and height is 500px.
    this.width = 1768;
    this.height = 500;
    this.x = 0;
    this.y = 0;

    // Create and load the image for this layer.
    this.image = new Image();
    this.imageLoaded = false;
    this.image.onload = () => {
      this.imageLoaded = true;
    };
    this.image.src = imageSrc;
  }

  // The update method handles the horizontal scrolling logic.
  update() {
    // Calculate the scrolling speed based on the game's global speed and this layer's modifier.
    const speed = this.game.speed * this.speedModifier;

    // Move the layer to the left.
    this.x -= speed;

    // If the layer has scrolled completely off-screen, reset its position for a seamless loop.
    if (this.x < -this.width) {
      this.x = 0;
    }
  }

  // The draw method renders the layer on the canvas.
  draw(context: CanvasRenderingContext2D) {
    if (!this.imageLoaded) {
      return; // Don't draw if image hasn't loaded yet
    }

    // Draw the image twice, side-by-side, to prevent gaps during scrolling.
    context.drawImage(this.image, this.x, this.y, this.width, this.height);
    context.drawImage(this.image, this.x + this.width, this.y, this.width, this.height);
  }
}