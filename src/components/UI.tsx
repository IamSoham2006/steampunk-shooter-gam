import React, { useState, useEffect } from 'react';

interface UIProps {
  score: number;
  timeLeft: number;
  health: number;
  maxHealth: number;
  gameOver: boolean;
  gameWon: boolean;
  armor: number;
  currentLevel: number;
  totalScore: number;
  levelComplete: boolean;
  levelTransition: boolean;
  isPaused: boolean;
  onTogglePause: (paused: boolean) => void;
  onJumpToLevel: (level: number) => void;
  onRestart: () => void;
  muted: boolean;
  onToggleMute: (muted?: boolean) => void;
  sfxMuted: boolean;
  onToggleSfx: (muted?: boolean) => void;
  // Mobile touch handlers
  onTouchStartDirection?: (dir: 'up'|'down'|'left'|'right') => void;
  onTouchEndDirection?: (dir: 'up'|'down'|'left'|'right') => void;
  onTouchShoot?: (down: boolean) => void;
}

export function UI({ 
  score, 
  timeLeft, 
  health, 
  maxHealth, 
  gameOver, 
  gameWon, 
  armor,
  currentLevel,
  totalScore,
  levelComplete,
  levelTransition,
  isPaused,
  onTogglePause,
  onJumpToLevel,
  onRestart 
  , muted, onToggleMute, sfxMuted, onToggleSfx,
  onTouchStartDirection, onTouchEndDirection, onTouchShoot
}: UIProps) {
  const [isPortrait, setIsPortrait] = useState<boolean>(typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false);

  useEffect(() => {
    const onResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  // pressed state for mobile buttons to show visual feedback
  const [pressed, setPressed] = useState<Record<string, boolean>>({});
  // mapping from pointerId to control key so multiple touches don't clobber each other
  const pointerMapRef = React.useRef<Record<number, string>>({});

  const setPressedFor = (key: string, v: boolean) => setPressed(p => ({ ...p, [key]: v }));
  const handlePointerDown = (e: React.PointerEvent, cb?: () => void, key?: string) => {
    const target = e.currentTarget as Element;
    try { target.setPointerCapture(e.pointerId); } catch (err) {}
    if (key) {
      // register this pointerId with the key if not already
      pointerMapRef.current[e.pointerId] = key;
      setPressedFor(key, true);
    }
    cb?.();
  };
  const handlePointerUp = (e: React.PointerEvent, cb?: () => void, key?: string) => {
    const target = e.currentTarget as Element;
    try { target.releasePointerCapture(e.pointerId); } catch (err) {}
    // look up which key this pointerId was responsible for
    const mapped = pointerMapRef.current[e.pointerId];
    if (mapped) {
      setPressedFor(mapped, false);
      delete pointerMapRef.current[e.pointerId];
    } else if (key) {
      // fallback
      setPressedFor(key, false);
    }
    cb?.();
  };
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const healthPercentage = (health / maxHealth) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        {/* Left side - Health and Armor */}
        <div className="space-y-2">
          <div className="bg-black/60 p-3 rounded border border-gray-600">
            <div className="text-green-400 mb-1">HEALTH</div>
            <div className="w-32 h-4 bg-gray-800 border border-gray-600 rounded overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  healthPercentage > 60 ? 'bg-green-500' : 
                  healthPercentage > 30 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${healthPercentage}%` }}
              />
            </div>
            <div className="text-white/80 text-sm mt-1">{health}/{maxHealth}</div>
          </div>
          
          {armor > 0 && (
            <div className="bg-black/60 p-2 rounded border border-yellow-500">
              <div className="text-yellow-400 text-sm">ARMOR: +{armor}</div>
            </div>
          )}
        </div>

        {/* Center - Level and Score */}
        <div className="bg-black/60 p-3 rounded border border-gray-600 text-center">
          <div className="text-purple-400 text-sm">LEVEL {currentLevel}/5</div>
          <div className="text-cyan-400 text-sm">SCORE</div>
          <div className="text-white text-xl">{score.toLocaleString()}</div>
          {totalScore > 0 && (
            <div className="text-yellow-400 text-xs">Total: {(totalScore + score).toLocaleString()}</div>
          )}
        </div>

        {/* Right side - Timer */}
        <div className="bg-black/60 p-3 rounded border border-gray-600">
          <div className="text-orange-400 text-center">TIME LEFT</div>
          <div className={`text-xl ${timeLeft < 30000 ? 'text-red-400' : 'text-white'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
        {/* Mute + SFX toggles + Pause/Restart */}
        <div className="ml-3 flex items-center gap-2">
          <button
            className="bg-gray-800/60 p-2 rounded text-white/80 pointer-events-auto"
            onClick={() => onToggleMute(!muted)}
            title={muted ? 'Unmute BGM' : 'Mute BGM'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button
            className="bg-gray-800/60 p-2 rounded text-white/80 pointer-events-auto"
            onClick={() => onToggleSfx(!sfxMuted)}
            title={sfxMuted ? 'Enable SFX' : 'Mute SFX'}
          >
            {sfxMuted ? '🔕' : '🔈'}
          </button>
          <button
            className="bg-gray-800/60 p-2 rounded text-white/80 pointer-events-auto"
            onClick={() => onTogglePause?.(true)}
            title="Pause"
          >
            ⏸
          </button>
          <button
            className="bg-gray-800/60 p-2 rounded text-white/80 pointer-events-auto"
            onClick={() => onRestart?.()}
            title="Restart"
          >
            ⤴
          </button>
        </div>
      </div>

      {/* Bottom HUD removed (ammo) */}

      {/* Mobile controls - only show on small screens */}
      <div className="md:hidden">
        {/* Orientation overlay when portrait */}
        {isPortrait && (
          <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center pointer-events-auto">
            <div className="text-center text-white max-w-xs p-4">
              <div className="text-xl font-semibold mb-2">Please rotate your device</div>
              <div className="text-sm text-white/80">This game is best played in landscape. Rotate your phone to continue.</div>
            </div>
          </div>
        )}

        {/* On-screen D-Pad & Shoot - anchored bottom */}
        {!isPortrait && (
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none z-40">
            {/* Left D-pad: 3x3 grid with clear positions */}
            <div className="pointer-events-auto">
              <div className="w-56 h-56 grid grid-cols-3 grid-rows-3 gap-3 touch-none">
                <div className="col-start-1 row-start-1" />
                <button
                  aria-label="Move up"
                  title="Up"
                  className={`col-start-2 row-start-1 flex items-center justify-center w-16 h-16 md:w-18 md:h-18 rounded-full bg-black/70 border border-white/10 text-white transform-gpu drop-shadow-lg touch-manipulation ${pressed['up'] ? 'ring-2 ring-yellow-400 scale-95' : ''}`}
                  onPointerDown={(e) => handlePointerDown(e, () => onTouchStartDirection?.('up'), 'up')}
                  onPointerUp={(e) => handlePointerUp(e, () => onTouchEndDirection?.('up'), 'up')}
                  onPointerCancel={(e) => handlePointerUp(e, () => onTouchEndDirection?.('up'), 'up')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M12 5L5 13h14L12 5z" fill="#FFFFFF" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
                  </svg>
                </button>
                <div className="col-start-3 row-start-1" />

                <button
                  aria-label="Move left"
                  title="Left"
                  className={`col-start-1 row-start-2 flex items-center justify-center w-16 h-16 md:w-18 md:h-18 rounded-full bg-black/70 border border-white/10 text-white transform-gpu drop-shadow-lg touch-manipulation ${pressed['left'] ? 'ring-2 ring-yellow-400 scale-95' : ''}`}
                  onPointerDown={(e) => handlePointerDown(e, () => onTouchStartDirection?.('left'), 'left')}
                  onPointerUp={(e) => handlePointerUp(e, () => onTouchEndDirection?.('left'), 'left')}
                  onPointerCancel={(e) => handlePointerUp(e, () => onTouchEndDirection?.('left'), 'left')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M19 12L7 5v14l12-7z" fill="#FFFFFF" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
                  </svg>
                </button>

                <div className="col-start-2 row-start-2" />

                <button
                  aria-label="Move right"
                  title="Right"
                  className={`col-start-3 row-start-2 flex items-center justify-center w-16 h-16 md:w-18 md:h-18 rounded-full bg-black/70 border border-white/10 text-white transform-gpu drop-shadow-lg touch-manipulation ${pressed['right'] ? 'ring-2 ring-yellow-400 scale-95' : ''}`}
                  onPointerDown={(e) => handlePointerDown(e, () => onTouchStartDirection?.('right'), 'right')}
                  onPointerUp={(e) => handlePointerUp(e, () => onTouchEndDirection?.('right'), 'right')}
                  onPointerCancel={(e) => handlePointerUp(e, () => onTouchEndDirection?.('right'), 'right')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M5 12l12 7V5l-12 7z" fill="#FFFFFF" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
                  </svg>
                </button>

                <div className="col-start-1 row-start-3" />
                <button
                  aria-label="Move down"
                  title="Down"
                  className={`col-start-2 row-start-3 flex items-center justify-center w-16 h-16 md:w-18 md:h-18 rounded-full bg-black/70 border border-white/10 text-white transform-gpu drop-shadow-lg touch-manipulation ${pressed['down'] ? 'ring-2 ring-yellow-400 scale-95' : ''}`}
                  onPointerDown={(e) => handlePointerDown(e, () => onTouchStartDirection?.('down'), 'down')}
                  onPointerUp={(e) => handlePointerUp(e, () => onTouchEndDirection?.('down'), 'down')}
                  onPointerCancel={(e) => handlePointerUp(e, () => onTouchEndDirection?.('down'), 'down')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M12 19l7-8H5l7 8z" fill="#FFFFFF" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
                  </svg>
                </button>
                <div className="col-start-3 row-start-3" />
              </div>
            </div>

            {/* Right controls: FIRE */}
            <div className="pointer-events-auto flex flex-col items-end gap-3">
              <button
                className={`w-28 h-28 rounded-full bg-red-600 text-white text-lg font-bold shadow-lg ${pressed['fire'] ? 'scale-95' : ''}`}
                onPointerDown={(e) => handlePointerDown(e, () => onTouchShoot?.(true), 'fire')}
                onPointerUp={(e) => handlePointerUp(e, () => onTouchShoot?.(false), 'fire')}
                onPointerCancel={(e) => handlePointerUp(e, () => onTouchShoot?.(false), 'fire')}
              >FIRE</button>
            </div>
          </div>
        )}
      </div>

      {/* Level Transition Screen */}
      {levelTransition && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
          <div className="bg-black/95 p-8 rounded-lg border-2 border-green-500 text-center max-w-lg">
            <h2 className="text-4xl mb-4 text-green-400">
              LEVEL {currentLevel - 1} COMPLETE!
            </h2>
            
            <div className="space-y-3 mb-6 text-white/80">
              <p>Level Score: <span className="text-cyan-400">{totalScore.toLocaleString()}</span></p>
              <p>Total Score: <span className="text-yellow-400">{(totalScore + score).toLocaleString()}</span></p>
              <div className="text-green-400">
                {currentLevel <= 5 ? (
                  <>
                    <p>Proceeding to Level {currentLevel}...</p>
                    <p className="text-sm text-white/60">Get ready for increased difficulty!</p>
                  </>
                ) : (
                  <p>Preparing final statistics...</p>
                )}
              </div>
            </div>

            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentLevel - 1) / 5) * 100}%` }}
              />
            </div>
            <p className="text-sm text-white/60 mt-2">Level Progress</p>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-black/90 p-8 rounded-lg border-2 border-gray-600 text-center max-w-md">
            <h2 className={`text-4xl mb-4 ${
              gameWon ? 'text-green-400' : 'text-red-400'
            }`}>
              {gameWon ? 'MISSION COMPLETE!' : 'MISSION FAILED'}
            </h2>
            
            <div className="space-y-2 mb-6 text-white/80">
              <p>Level Reached: <span className="text-purple-400">{currentLevel}/5</span></p>
              <p>Final Score: <span className="text-cyan-400">{(totalScore + score).toLocaleString()}</span></p>
              {gameWon ? (
                <p className="text-green-400">
                  Outstanding! All 5 levels completed. The alien threat has been completely neutralized!
                </p>
              ) : (
                <p className="text-red-400">
                  The mechanical seahorse has fallen on level {currentLevel}. The alien planet claims another victim.
                </p>
              )}
            </div>

            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded border border-blue-500 transition-colors pointer-events-auto cursor-pointer"
              onClick={onRestart}
            >
              RESTART MISSION
            </button>
          </div>
        </div>
      )}

      {/* Pause Menu */}
      {isPaused && !gameOver && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-gradient-to-br from-gray-900/95 to-black/80 p-8 rounded-xl border-2 border-gray-700 text-center max-w-lg pointer-events-auto shadow-2xl">
            <h3 className="text-4xl font-bold text-white mb-3">PAUSED</h3>
            <p className="text-sm text-white/70 mb-4">Press <span className="font-semibold">Esc</span> to resume. Press keys <span className="font-semibold">1</span>-<span className="font-semibold">5</span> to jump to that level.</p>

            <div className="flex gap-3 justify-center mb-6">
              <button
                className="bg-green-500 hover:bg-green-600 text-black font-semibold px-5 py-2 rounded-lg shadow"
                onClick={() => onTogglePause(false)}
              >
                RESUME
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-lg shadow"
                onClick={onRestart}
              >
                RESTART
              </button>
            </div>

            <div className="grid grid-cols-5 gap-3 mb-2">
              {[1,2,3,4,5].map(lv => (
                <button
                  key={lv}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${lv === currentLevel ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-white'}`}
                  onClick={() => { onJumpToLevel(lv); onTogglePause(false); }}
                >
                  Level {lv}
                </button>
              ))}
            </div>

            <div className="text-xs text-white/60 mt-3">Tip: You can also use the number keys to jump levels quickly.</div>
          </div>
        </div>
      )}

      {/* Instructions (only shown at start) */}
      {!gameOver && !levelTransition && currentLevel === 1 && timeLeft > 115000 && (
        <div className="absolute bottom-20 left-4 bg-black/60 p-3 rounded border border-gray-600 max-w-sm">
          <div className="text-yellow-400 text-sm">CONTROLS:</div>
          <div className="text-white/80 text-xs space-y-1 mt-1">
            <div>WASD / Arrow Keys: Move</div>
            <div>Space: Shoot</div>
            <div>Complete 5 levels (2 min each) to win!</div>
            <div className="text-yellow-400">Difficulty increases each level!</div>
          </div>
        </div>
      )}
    </div>
  );
}