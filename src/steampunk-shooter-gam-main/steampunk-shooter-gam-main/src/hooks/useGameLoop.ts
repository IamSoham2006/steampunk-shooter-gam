import { useEffect, useRef, useCallback } from 'react';

export function useGameLoop(callback: (deltaTime: number) => void, running = true) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      // Cap delta time to prevent large jumps (e.g., when tab is inactive)
      const cappedDeltaTime = Math.min(deltaTime, 16.67); // Cap at ~60fps
      callbackRef.current(cappedDeltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (running) {
      requestRef.current = requestAnimationFrame(animate);
      return () => {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
      };
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      previousTimeRef.current = undefined;
    }
  }, [animate, running]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);
}