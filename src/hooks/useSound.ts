import { useRef, useEffect } from 'react';
import { Howl } from 'howler';

type SoundMap = Record<string, string>;

export default function useSound(sounds: SoundMap, defaultVolume = 1) {
  const registry = useRef<Record<string, Howl>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // initialize
    Object.entries(sounds).forEach(([key, src]) => {
      try {
        // synth: keys use WebAudio synths (no Howl)
        if (key.startsWith('synth:')) {
          // nothing to preload, just register a marker
          registry.current[key] = null as any;
          return;
        }
        // Prefer WebAudio (html5:false) to avoid exhausting the HTML5 audio pool
        const h = new Howl({ src: [src], volume: defaultVolume, preload: true, html5: false });
        registry.current[key] = h;
        h.once('load', () => console.debug(`[useSound] loaded '${key}' -> ${src}`));
        h.on('loaderror', (id, err) => console.error(`[useSound] loaderror '${key}'`, id, err));
        h.on('playerror', (id, err) => console.error(`[useSound] playerror '${key}'`, id, err));
      } catch (e) {
        console.error('[useSound] failed to create Howl for', key, src, e);
      }
    });

    const onMute = (e: Event) => {
      const muted = (e as CustomEvent).detail as boolean;
      Object.values(registry.current).forEach(h => h.mute(Boolean(muted)));
    };
    window.addEventListener('game-audio-mute', onMute as EventListener);

    return () => {
      window.removeEventListener('game-audio-mute', onMute as EventListener);
      Object.values(registry.current).forEach(h => h.unload());
      registry.current = {};
    };
  }, [sounds, defaultVolume]);

  const play = (key: string, opts?: { loop?: boolean }) => {
    const h = registry.current[key];
    if (!h) {
      // support synths like 'synth:pew'
      if (key.startsWith('synth:')) {
        try {
          if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          const ctx = audioCtxRef.current!;
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1200, now);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.3, now + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.22);
          console.debug(`[useSound] synth play '${key}'`);
        } catch (e) {
          console.error(`[useSound] synth play failed for '${key}'`, e);
        }
        return;
      }
      console.warn(`[useSound] play: sound '${key}' not found`);
      return;
    }
    if (opts?.loop) h.loop(true);
    try {
      if (h.playing && h.playing()) {
        console.debug(`[useSound] already playing '${key}', skipping play call`);
        return;
      }
      console.debug(`[useSound] play '${key}'`);
      h.play();
    } catch (e) {
      console.error(`[useSound] play failed for '${key}'`, e);
    }
  };

  const stop = (key: string) => { const h = registry.current[key]; h?.stop(); };
  const pause = (key: string) => { const h = registry.current[key]; h?.pause(); };
  const muteAll = (m: boolean) => Object.values(registry.current).forEach(h => h.mute(m));
  const setVol = (v: number) => Object.values(registry.current).forEach(h => h.volume(v));

  return { play, stop, pause, muteAll, setVol };
}
