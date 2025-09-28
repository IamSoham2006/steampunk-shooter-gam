// Background class that manages multiple Layer objects
// to create a complete parallax effect.

import { Layer } from './Layer';

interface Game {
  speed: number;
}

export class Background {
  game: Game;
  layers: Layer[];
  foregroundLayer: Layer;

  // The constructor initializes the entire parallax background scene.
  // It needs the canvas dimensions to set up the game interface.
  constructor(canvasWidth: number, canvasHeight: number) {
    // Create a game interface for the layers
    this.game = {
      speed: 1 // Global game speed
    };

    // Define the layer image URLs
    // Using placeholder URLs - you can replace these with your actual layer images
    const layerImageUrls = [
      'https://www.frankslaboratory.co.uk/downloads/103/layer1.png', // Layer 1 (Back)
      'https://www.frankslaboratory.co.uk/downloads/103/layer2.png', // Layer 2
      'https://www.frankslaboratory.co.uk/downloads/103/layer3.png', // Layer 3 (Ground)
      'https://www.frankslaboratory.co.uk/downloads/103/layer4.png'  // Layer 4 (Foreground)
    ];

    // Create the individual layers using the provided image URLs.
    // Assign a different speed modifier to each layer to create the parallax depth effect.
    // The first layer is the furthest back (slowest), and the last is the closest (fastest).
    this.layers = [
      new Layer(this.game, layerImageUrls[0], 0.2), // Layer 1 (Back)
      new Layer(this.game, layerImageUrls[1], 0.4), // Layer 2
      new Layer(this.game, layerImageUrls[2], 1),   // Layer 3 (Ground)
      new Layer(this.game, layerImageUrls[3], 1.5)  // Layer 4 (Foreground)
    ];

    // We will draw the foreground layer separately to have it appear in front of the player.
    this.foregroundLayer = this.layers[3];
  }

  // The update method updates all background layers.
  update(deltaTime: number) {
    // Update game speed based on deltaTime for smooth movement
    // You can adjust this multiplier to change overall scrolling speed
    this.game.speed = 1.5;

    // Update all layers including foreground
    this.layers.forEach(layer => {
      layer.update();
    });
  }

  // The draw method renders all background layers.
  draw(context: CanvasRenderingContext2D) {
    // Draw layers 1, 2, and 3 (the ones behind the player).
    this.layers.slice(0, 3).forEach(layer => {
      layer.draw(context);
    });
  }

  // A separate method to draw the foreground layer.
  drawForeground(context: CanvasRenderingContext2D) {
    this.foregroundLayer.draw(context);
  }
}