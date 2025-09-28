import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useGameLoop } from '../hooks/useGameLoop.ts';
import { useKeyboardInput } from '../hooks/useKeyboardInput.ts';
import { Player } from '../logic/Player.ts';
import { Enemy, Angler1, Angler2, LuckyFish, HiveWhale, Drone } from '../logic/Enemy.ts';
import { Projectile } from '../logic/Projectile.ts';
import { Particle, createExplosion, createSparks } from '../logic/Particle.ts';
import { Background } from '../logic/Background.ts';
import { UI } from './UI.tsx';
import useSound from '../hooks/useSound.ts';

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 576;
const LEVEL_DURATION = 120000; // 2 minutes per level
const MAX_LEVELS = 5;
const TARGET_SCORE_PER_LEVEL = 500;

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef({
    player: new Player(100, CANVAS_HEIGHT / 2),
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    particles: [] as Particle[],
    background: new Background(CANVAS_WIDTH, CANVAS_HEIGHT),
    score: 0,
    ammo: 100,
    maxAmmo: 100,
    gameOver: false,
    gameWon: false,
  isPaused: false,
  muted: false,
  sfxMuted: false,
    currentLevel: 1,
    timeLeft: LEVEL_DURATION,
    totalScore: 0,
    levelComplete: false,
    levelTransition: false,
    levelTransitionTimer: 0,
    enemySpawnTimer: 0,
    ammoRegenTimer: 0,
    passiveHealingTimer: 0,
    keys: {} as Record<string, boolean>
  });

  const [uiState, setUIState] = useState({
    score: 0,
    timeLeft: LEVEL_DURATION,
    ammo: 100,
    maxAmmo: 100,
    health: 100,
    maxHealth: 100,
    gameOver: false,
  gameWon: false,
  isPaused: false,
  muted: false,
  sfxMuted: false,
    armor: 0,
    currentLevel: 1,
    totalScore: 0,
    levelComplete: false,
    levelTransition: false
  });

  // initialize SFX mute from localStorage
  useEffect(() => {
    try {
      const storedSfx = localStorage.getItem('sp_sfx_muted');
      const initialSfxMuted = storedSfx === 'true';
      setUIState(prev => ({ ...prev, sfxMuted: initialSfxMuted }));
      // store in gameStateRef for quick checks
      (gameStateRef.current as any).sfxMuted = initialSfxMuted;
    } catch (e) {}
  }, []);

  // initialize muted from localStorage if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sp_muted');
      const initialMuted = stored === 'true';
      gameStateRef.current.muted = initialMuted;
      setUIState(prev => ({ ...prev, muted: initialMuted }));
      // mute any existing audio elements
      document.querySelectorAll('audio').forEach(a => { (a as HTMLAudioElement).muted = initialMuted; });
      // notify any external audio managers
      window.dispatchEvent(new CustomEvent('game-audio-mute', { detail: initialMuted }));
    } catch (e) {
      // ignore (localStorage not available)
    }
  }, []);

  // Toggle pause state
  const togglePause = useCallback((paused?: boolean) => {
    const gameState = gameStateRef.current;
    const newPaused = typeof paused === 'boolean' ? paused : !gameState.isPaused;
    gameState.isPaused = newPaused;
    setUIState(prev => ({ ...prev, isPaused: newPaused }));
  }, []);

  // Jump to a specific level (1..MAX_LEVELS)
  const jumpToLevel = useCallback((level: number) => {
    const clamped = Math.max(1, Math.min(MAX_LEVELS, Math.floor(level)));
    const gameState = gameStateRef.current;
    gameState.currentLevel = clamped;
    gameState.timeLeft = LEVEL_DURATION;
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.score = 0;
    gameState.levelTransition = false;
    gameState.levelComplete = false;
    setUIState(prev => ({ ...prev, currentLevel: clamped, timeLeft: LEVEL_DURATION }));
  }, []);

  // Toggle mute (persisted)
  const toggleMute = useCallback((muted?: boolean) => {
    const gameState = gameStateRef.current;
    const newMuted = typeof muted === 'boolean' ? muted : !gameState.muted;
    gameState.muted = newMuted;
    setUIState(prev => ({ ...prev, muted: newMuted }));
    try {
      localStorage.setItem('sp_muted', newMuted ? 'true' : 'false');
    } catch (e) {
      // ignore
    }
    // mute any html audio elements and notify audio managers
    document.querySelectorAll('audio').forEach(a => { (a as HTMLAudioElement).muted = newMuted; });
    window.dispatchEvent(new CustomEvent('game-audio-mute', { detail: newMuted }));
  }, []);

  const toggleSfx = useCallback((muted?: boolean) => {
    const gameState = gameStateRef.current as any;
    const newMuted = typeof muted === 'boolean' ? muted : !Boolean(gameState.sfxMuted);
    gameState.sfxMuted = newMuted;
    try { localStorage.setItem('sp_sfx_muted', newMuted ? 'true' : 'false'); } catch (e) {}
    // no Howler muting here since SFX are synth-generated or managed separately
    setUIState(prev => ({ ...prev, /* sfx not part of UIState currently */ }));
  }, []);

  // Collision detection utility
  const checkCollision = useCallback((rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }, []);

  // Handle keyboard input
  const handleKeyInput = useCallback((keys: Record<string, boolean>) => {
    gameStateRef.current.keys = keys;
  }, []);

  useKeyboardInput(handleKeyInput);

  // Global keyboard shortcuts: ESC to toggle pause, 1-5 to jump levels
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        togglePause();
      }
      // Allow quick level jumps with number keys
      if (/^[1-5]$/.test(e.key)) {
        const lv = parseInt(e.key, 10);
        jumpToLevel(lv);
        // resume if paused
        togglePause(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [togglePause, jumpToLevel]);

  // Audio: background music using Howler via useSound
  // Memoize the sounds mapping so useSound's effect doesn't re-run on every render
  const sounds = useMemo(() => ({ bgm: '/sounds/bgm.mp3' } as Record<string, string>), []);
  const { play: playSound, pause: pauseSound, stop: stopSound, muteAll, setVol } = useSound(sounds, 0.6);
  const bgmPlayedRef = useRef(false);

  const ensurePlayBgm = useCallback(() => {
    if (bgmPlayedRef.current) return;
    if (gameStateRef.current.muted) return;
    try {
      playSound('bgm', { loop: true });
      bgmPlayedRef.current = true;
    } catch (e) {
      // ignore play failures (autoplay policies)
    }
  }, [playSound]);

  useEffect(() => {
    const onFirstGesture = () => {
      ensurePlayBgm();
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
    window.addEventListener('pointerdown', onFirstGesture);
    window.addEventListener('keydown', onFirstGesture);
    return () => {
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
  }, [ensurePlayBgm]);

  // Mobile touch handlers that map to keys
  const onTouchStartDirection = useCallback((dir: 'up'|'down'|'left'|'right') => {
    const keys = gameStateRef.current.keys;
    if (dir === 'up') { keys['ArrowUp'] = true; keys['w'] = true; }
    if (dir === 'down') { keys['ArrowDown'] = true; keys['s'] = true; }
    if (dir === 'left') { keys['ArrowLeft'] = true; keys['a'] = true; }
    if (dir === 'right') { keys['ArrowRight'] = true; keys['d'] = true; }
  }, []);

  const onTouchEndDirection = useCallback((dir: 'up'|'down'|'left'|'right') => {
    const keys = gameStateRef.current.keys;
    if (dir === 'up') { keys['ArrowUp'] = false; keys['w'] = false; }
    if (dir === 'down') { keys['ArrowDown'] = false; keys['s'] = false; }
    if (dir === 'left') { keys['ArrowLeft'] = false; keys['a'] = false; }
    if (dir === 'right') { keys['ArrowRight'] = false; keys['d'] = false; }
  }, []);

  const onTouchShoot = useCallback((down: boolean) => {
    const keys = gameStateRef.current.keys;
    keys[' '] = down; keys['Space'] = down;
    if (down) {
      // also try to play SFX via current logic when a shot is created
      try { if (!(gameStateRef.current as any).sfxMuted) playSound('synth:pew'); } catch (e) {}
    }
  }, [playSound]);

  // Keep BGM in sync with pause / mute UI state
  useEffect(() => {
    if (uiState.muted) {
      try { muteAll(true); } catch (e) {}
      return;
    }

    // unmute
    try { muteAll(false); } catch (e) {}

    if (uiState.isPaused) {
      try { pauseSound('bgm'); } catch (e) {}
    } else {
      // resume or start
      try {
        if (!bgmPlayedRef.current) {
          // will start on first user gesture
        } else {
          playSound('bgm', { loop: true });
        }
      } catch (e) {}
    }
  }, [uiState.isPaused, uiState.muted, muteAll, pauseSound, playSound]);

  // Spawn enemy with level-based difficulty
  const spawnEnemy = useCallback((level: number) => {
    // Create game object for enemy constructors
    const game = {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      speed: 1
    };

    // Higher levels spawn more challenging enemies
    const randomNumber = Math.random();
    let enemy: Enemy;
    
    if (level <= 2) {
      // Early levels: more basic enemies
      if (randomNumber < 0.4) {
        enemy = new Angler1(game);
      } else if (randomNumber < 0.7) {
        enemy = new Drone(game, CANVAS_WIDTH + 50, Math.random() * (CANVAS_HEIGHT - 100) + 50);
      } else if (randomNumber < 0.9) {
        enemy = new Angler2(game);
      } else {
        enemy = new LuckyFish(game);
      }
    } else if (level <= 4) {
      // Mid levels: balanced mix with occasional hive whale
      if (randomNumber < 0.25) {
        enemy = new Angler1(game);
      } else if (randomNumber < 0.45) {
        enemy = new Angler2(game);
      } else if (randomNumber < 0.65) {
        enemy = new Drone(game, CANVAS_WIDTH + 50, Math.random() * (CANVAS_HEIGHT - 100) + 50);
      } else if (randomNumber < 0.85) {
        enemy = new HiveWhale(game);
      } else {
        enemy = new LuckyFish(game);
      }
    } else {
      // Final level: more challenging enemies
      if (randomNumber < 0.2) {
        enemy = new Angler1(game);
      } else if (randomNumber < 0.45) {
        enemy = new Angler2(game);
      } else if (randomNumber < 0.7) {
        enemy = new HiveWhale(game);
      } else if (randomNumber < 0.9) {
        enemy = new Drone(game, CANVAS_WIDTH + 50, Math.random() * (CANVAS_HEIGHT - 100) + 50);
      } else {
        enemy = new LuckyFish(game);
      }
    }
    
    // Scale enemy health with level
    const healthMultiplier = 1 + (level - 1) * 0.3;
    enemy.lives = Math.floor(enemy.lives * healthMultiplier);
    
    return enemy;
  }, []);

  // Update UI state from game state
  const updateUIState = useCallback(() => {
    const gameState = gameStateRef.current;
    setUIState({
      score: gameState.score,
      timeLeft: gameState.timeLeft,
      ammo: gameState.ammo,
      maxAmmo: gameState.maxAmmo,
      health: gameState.player.health,
      maxHealth: gameState.player.maxHealth,
      gameOver: gameState.gameOver,
      gameWon: gameState.gameWon,
  isPaused: gameState.isPaused,
  muted: gameState.muted,
      sfxMuted: (gameState as any).sfxMuted || false,
      armor: gameState.player.armor,
      currentLevel: gameState.currentLevel,
      totalScore: gameState.totalScore,
      levelComplete: gameState.levelComplete,
      levelTransition: gameState.levelTransition
    });
  }, []);

  // Game update loop
  const updateGame = useCallback((deltaTime: number) => {
    const gameState = gameStateRef.current;
    
    if (gameState.gameOver) return;

    // Handle level transition
    if (gameState.levelTransition) {
      gameState.levelTransitionTimer -= deltaTime;
      if (gameState.levelTransitionTimer <= 0) {
        gameState.levelTransition = false;
        gameState.levelComplete = false;
      }
      updateUIState();
      return;
    }

    const newParticles = [...gameState.particles];
    const newProjectiles = [...gameState.projectiles];
    const newEnemies = [...gameState.enemies];

    // Update timer
    gameState.timeLeft = Math.max(0, gameState.timeLeft - deltaTime);
    
    // Check level completion
    if (gameState.timeLeft <= 0) {
      // Level completed
      gameState.totalScore += gameState.score;
      
      if (gameState.currentLevel >= MAX_LEVELS) {
        // Game won - all levels completed
        gameState.gameOver = true;
        gameState.gameWon = true;
        
        // Force immediate UI state update for game won
        setUIState(prevState => ({
          ...prevState,
          gameOver: true,
          gameWon: true,
          totalScore: gameState.totalScore
        }));
        
        updateUIState();
        return;
      } else {
        // Next level
        gameState.levelComplete = true;
        gameState.levelTransition = true;
        gameState.levelTransitionTimer = 3000; // 3 second transition
        gameState.currentLevel++;
        gameState.timeLeft = LEVEL_DURATION;
        gameState.score = 0; // Reset level score
        
        // Clear enemies and projectiles for new level
        gameState.enemies = [];
        gameState.projectiles = [];
        
        // Heal player partially between levels
        gameState.player.heal(30);
        
        updateUIState();
        return;
      }
    }

    // Check player death
    if (gameState.player.health <= 0) {
      gameState.gameOver = true;
      gameState.gameWon = false;
      gameState.totalScore += gameState.score;
      
      // Force immediate UI state update for game over
      setUIState(prevState => ({
        ...prevState,
        gameOver: true,
        gameWon: false,
        health: 0,
        totalScore: gameState.totalScore
      }));
      
      updateUIState();
      return;
    }

    // Update background
    gameState.background.update(deltaTime);

    // Update player
    gameState.player.update(deltaTime, gameState.keys, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Handle shooting
    if ((gameState.keys[' '] || gameState.keys['Space']) && gameState.ammo > 0 && gameState.player.canShoot()) {
      if (gameState.player.shoot()) {
        gameState.ammo = Math.max(0, gameState.ammo - 1);
        const projectile = new Projectile(
          gameState.player.x + gameState.player.width,
          gameState.player.y + gameState.player.height / 2,
          8, 0, 'player', 20
        );
        newProjectiles.push(projectile);
        try { if (!(gameStateRef.current as any).sfxMuted) playSound('synth:pew'); } catch (e) { /* ignore */ }
      }
    }

    // Regenerate ammo
    gameState.ammoRegenTimer = (gameState.ammoRegenTimer || 0) + deltaTime;
    if (gameState.ammoRegenTimer >= 100) { // Regen every 100ms
      gameState.ammo = Math.min(gameState.maxAmmo, gameState.ammo + 1);
      gameState.ammoRegenTimer = 0;
    }

    // Passive healing every 20 seconds
    gameState.passiveHealingTimer = (gameState.passiveHealingTimer || 0) + deltaTime;
    if (gameState.passiveHealingTimer >= 20000) { // 20 seconds = 20000ms
      const healAmount = Math.floor(gameState.player.maxHealth * 0.2); // 20% of max health
      if (gameState.player.health < gameState.player.maxHealth) {
        gameState.player.heal(healAmount);
      }
      gameState.passiveHealingTimer = 0;
    }

    // Spawn enemies with level-based difficulty
    gameState.enemySpawnTimer = (gameState.enemySpawnTimer || 0) + deltaTime;
    
    // Spawn rate gets faster with each level and over time within level
    const baseSpawnRate = Math.max(1000, 2500 - (gameState.currentLevel - 1) * 300);
    const timeBasedReduction = (LEVEL_DURATION - gameState.timeLeft) / 20;
    const spawnRate = Math.max(800, baseSpawnRate - timeBasedReduction);
    
    if (gameState.enemySpawnTimer >= spawnRate) {
      newEnemies.push(spawnEnemy(gameState.currentLevel));
      gameState.enemySpawnTimer = 0;
    }

    // Update enemies
    for (let i = newEnemies.length - 1; i >= 0; i--) {
      const enemy = newEnemies[i];
      enemy.update(deltaTime);

      // Enemy shooting (simplified - only certain enemies can shoot)
      if (enemy.canShoot(gameState.player.x, gameState.player.y) && enemy.shoot()) {
        const angle = Math.atan2(
          gameState.player.y - enemy.y,
          gameState.player.x - enemy.x
        );
        const speed = 4;
        const projectile = new Projectile(
          enemy.x,
          enemy.y + enemy.height / 2,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          'enemy',
          enemy.damage
        );
        newProjectiles.push(projectile);
      }

      // Remove off-screen enemies
      if (enemy.isOffScreen()) {
        newEnemies.splice(i, 1);
      }
    }

    // Update projectiles
    for (let i = newProjectiles.length - 1; i >= 0; i--) {
      const projectile = newProjectiles[i];
      projectile.update(deltaTime);

      // Remove off-screen projectiles
      if (projectile.isOffScreen(CANVAS_WIDTH, CANVAS_HEIGHT)) {
        newProjectiles.splice(i, 1);
        continue;
      }

      // Check collisions
      if (projectile.type === 'player') {
        // Player projectile vs enemies
        for (let j = newEnemies.length - 1; j >= 0; j--) {
          const enemy = newEnemies[j];
          if (checkCollision(projectile.getBounds(), enemy.getBounds())) {
            // Hit enemy
            if (enemy.takeDamage(projectile.damage)) {
              // Enemy destroyed
              const levelMultiplier = 1 + (gameState.currentLevel - 1) * 0.2;
              gameState.score += Math.floor(enemy.score * levelMultiplier);
              
              // Handle special enemy types
              if (enemy.type === 'hive') {
                // If a HiveWhale is destroyed, spawn 5 drones
                for (let k = 0; k < 5; k++) {
                  const game = {
                    width: CANVAS_WIDTH,
                    height: CANVAS_HEIGHT,
                    speed: 1
                  };
                  const drone = new Drone(
                    game,
                    enemy.x + Math.random() * enemy.width,
                    enemy.y + Math.random() * enemy.height * 0.5
                  );
                  newEnemies.push(drone);
                }
              }
              
              newParticles.push(...createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2));
              newEnemies.splice(j, 1);
            } else {
              // Enemy damaged
              newParticles.push(...createSparks(projectile.x, projectile.y));
            }
            newProjectiles.splice(i, 1);
            break;
          }
        }
      } else {
        // Enemy projectile vs player
        if (checkCollision(projectile.getBounds(), gameState.player.getBounds())) {
          if (gameState.player.takeDamage(projectile.damage)) {
            // Player died
            gameState.gameOver = true;
            gameState.gameWon = false;
          }
          newParticles.push(...createSparks(projectile.x, projectile.y));
          newProjectiles.splice(i, 1);
        }
      }
    }

    // Update particles
    for (let i = newParticles.length - 1; i >= 0; i--) {
      const particle = newParticles[i];
      particle.update(deltaTime);
      
      if (particle.isDead()) {
        newParticles.splice(i, 1);
      }
    }

    // Check enemy-player collisions
    for (let i = newEnemies.length - 1; i >= 0; i--) {
      const enemy = newEnemies[i];
      if (checkCollision(enemy.getBounds(), gameState.player.getBounds())) {
        if (enemy.type === 'lucky') {
          // Power-up collision
          gameState.player.powerUp('armor', 10000); // 10 seconds of armor
          gameState.score += enemy.score;
          newParticles.push(...createSparks(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2));
        } else {
          // Damage collision
          if (gameState.player.takeDamage(enemy.damage)) {
            gameState.gameOver = true;
            gameState.gameWon = false;
          }
          newParticles.push(...createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2));
        }
        
        // Remove enemy after collision
        newEnemies.splice(i, 1);
      }
    }

    gameState.enemies = newEnemies;
    gameState.projectiles = newProjectiles;
    gameState.particles = newParticles;

    // Update UI periodically (not every frame)
    if (Math.floor(Date.now() / 100) % 2 === 0) {
      updateUIState();
    }
  }, [checkCollision, spawnEnemy, updateUIState]);

  // Render game
  const renderGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameState = gameStateRef.current;
    
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Draw the background layers (behind the player)
    gameState.background.draw(ctx);

    // 2. Draw the player, enemies, projectiles, etc.
    gameState.player.draw(ctx);
    gameState.enemies.forEach(enemy => enemy.draw(ctx));
    gameState.projectiles.forEach(projectile => projectile.draw(ctx));
    gameState.particles.forEach(particle => particle.draw(ctx));

    // 3. Draw the foreground layer (in front of everything)
    gameState.background.drawForeground(ctx);
  }, []);

  // Game loop that both updates and renders
  const gameLoop = useCallback((deltaTime: number) => {
    updateGame(deltaTime);
    renderGame();
  }, [updateGame, renderGame]);

  // Use game loop
  useGameLoop(gameLoop, !uiState.gameOver && !uiState.isPaused);

  // Restart game
  const restartGame = useCallback(() => {
    gameStateRef.current = {
      player: new Player(100, CANVAS_HEIGHT / 2),
      enemies: [],
      projectiles: [],
      particles: [],
      background: new Background(CANVAS_WIDTH, CANVAS_HEIGHT),
      score: 0,
      ammo: 100,
      maxAmmo: 100,
      gameOver: false,
      gameWon: false,
  isPaused: false,
  muted: false,
    sfxMuted: false,
      currentLevel: 1,
      timeLeft: LEVEL_DURATION,
      totalScore: 0,
      levelComplete: false,
      levelTransition: false,
      levelTransitionTimer: 0,
      enemySpawnTimer: 0,
      ammoRegenTimer: 0,
      passiveHealingTimer: 0,
      keys: {}
    };
    updateUIState();
  }, [updateUIState]);

  // Safety check: Ensure modal appears when game is over
  useEffect(() => {
    const checkGameOver = () => {
      const gameState = gameStateRef.current;
      if (gameState.gameOver && !uiState.gameOver) {
        // Force UI state update if it got out of sync
        setUIState(prevState => ({
          ...prevState,
          gameOver: true,
          gameWon: gameState.gameWon,
          health: gameState.player.health,
          totalScore: gameState.totalScore
        }));
      }
    };

    // Check immediately and set up interval for safety
    checkGameOver();
    const interval = setInterval(checkGameOver, 100);

    return () => {
      clearInterval(interval);
    };
  }, [uiState.gameOver]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-gray-600 max-w-full max-h-full"
          style={{ 
            imageRendering: 'pixelated',
            width: 'auto',
            height: 'auto',
            maxWidth: '100%',
            maxHeight: '100vh'
          }}
        />
        <UI
          score={uiState.score}
          timeLeft={uiState.timeLeft}
          health={uiState.health}
          maxHealth={uiState.maxHealth}
          gameOver={uiState.gameOver}
          gameWon={uiState.gameWon}
          isPaused={uiState.isPaused}
          onTogglePause={togglePause}
          onJumpToLevel={jumpToLevel}
          armor={uiState.armor}
          currentLevel={uiState.currentLevel}
          totalScore={uiState.totalScore}
          levelComplete={uiState.levelComplete}
          levelTransition={uiState.levelTransition}
          onRestart={restartGame}
          muted={uiState.muted}
          onToggleMute={toggleMute}
          sfxMuted={uiState.sfxMuted}
          onToggleSfx={toggleSfx}
          onTouchStartDirection={onTouchStartDirection}
          onTouchEndDirection={onTouchEndDirection}
          onTouchShoot={onTouchShoot}
        />
      </div>
    </div>
  );
}