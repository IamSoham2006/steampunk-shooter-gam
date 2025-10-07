import { useEffect } from 'react';
import { Game } from './components/Game.tsx';

export default function App() {
  useEffect(() => {
    // Prevent default scroll behaviors
    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    const preventTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    const preventWheel = (e: WheelEvent) => {
      e.preventDefault();
    };

    const preventKeyScroll = (e: KeyboardEvent) => {
      // Prevent arrow keys, spacebar, page up/down from scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.code)) {
        e.preventDefault();
      }
    };

    // Add event listeners to prevent scrolling
    document.addEventListener('wheel', preventWheel, { passive: false });
    document.addEventListener('touchmove', preventTouchMove, { passive: false });
    document.addEventListener('keydown', preventKeyScroll, { passive: false });
    document.addEventListener('scroll', preventDefault, { passive: false });

    // Cleanup event listeners
    return () => {
      document.removeEventListener('wheel', preventWheel);
      document.removeEventListener('touchmove', preventTouchMove);
      document.removeEventListener('keydown', preventKeyScroll);
      document.removeEventListener('scroll', preventDefault);
    };
  }, []);

  return (
    <div className="size-full flex items-center justify-center bg-black overflow-hidden">
      <Game />
    </div>
  );
}