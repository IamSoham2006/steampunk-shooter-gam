
# Steampunk Shooter Game

A retro-styled steampunk space shooter game built with React, TypeScript, and Tailwind CSS. Fight through 5 increasingly difficult levels as a mechanical seahorse defending against alien threats.


## Features

- **5 Progressive Levels**: Each level increases in difficulty with more enemies and faster gameplay
- **Mobile-Friendly Controls**: Touch-optimized D-pad and fire button for mobile devices
- **Responsive Design**: Automatic orientation detection and landscape mode optimization
- **Audio System**: Background music and sound effects with mute controls
- **Power-ups**: Armor boosts and enhanced weaponry
- **Score System**: Level-based scoring with total score tracking
- **Pause & Resume**: In-game pause menu with level jumping capabilities

## Controls

### Desktop
- **WASD** or **Arrow Keys**: Move
- **Space**: Shoot
- **Escape**: Pause/Resume
- **1-5**: Jump to specific levels (when paused)

### Mobile
- **D-pad**: Touch controls for movement
- **Fire Button**: Shoot
- **On-screen buttons**: Pause, restart, and audio controls

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/IamSoham2006/steampunk-shooter-gam.git
cd steampunk-shooter-gam
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the displayed local URL (usually `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `build/` directory.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety and better development experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Howler.js** - Web audio library for sound effects and music

## Game Mechanics

- **Health System**: Start with full health, take damage from enemy contact
- **Armor System**: Collect armor power-ups for additional protection
- **Progressive Difficulty**: Each level introduces more enemies and faster movement
- **Time Limits**: 2 minutes per level to complete objectives
- **Multi-touch Support**: Simultaneous diagonal movement and firing on mobile

## Deployment

The game is configured for easy deployment to:
- **Netlify**: Includes `netlify.toml` and `_redirects` for SPA routing
- **Vercel**: Works out of the box with Vite
- **GitHub Pages**: Can be deployed using GitHub Actions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
  