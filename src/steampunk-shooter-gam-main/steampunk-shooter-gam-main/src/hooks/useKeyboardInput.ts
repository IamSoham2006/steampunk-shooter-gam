import { useEffect, useRef } from 'react';

export function useKeyboardInput(callback: (keys: Record<string, boolean>) => void) {
  const keysRef = useRef<Record<string, boolean>>({});
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!keysRef.current[event.key]) {
        keysRef.current[event.key] = true;
        callbackRef.current(keysRef.current);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (keysRef.current[event.key]) {
        keysRef.current[event.key] = false;
        callbackRef.current(keysRef.current);
      }
    };

    const handleBlur = () => {
      // Clear all keys when window loses focus
      keysRef.current = {};
      callbackRef.current(keysRef.current);
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return keysRef.current;
}