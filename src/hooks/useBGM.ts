import { useEffect, useRef } from "react";
import { asset } from "@/lib/assets";

/** Looped background music (the original a-small-miracle.mp3). */
export function useBGM(enabled: boolean, volume = 0.3) {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!ref.current) {
      const audio = new Audio(asset("audio/a-small-miracle.mp3"));
      audio.loop = true;
      audio.volume = volume;
      ref.current = audio;
    }
    const audio = ref.current;
    audio.volume = volume;

    if (!enabled) {
      audio.pause();
      return;
    }

    // Autoplay is blocked until the first user gesture — start then. The
    // listener has to be torn down with the effect: left behind, it would
    // resume the music on the next click even after the player muted it.
    let start: (() => void) | null = null;
    audio.play().catch(() => {
      start = () => {
        if (ref.current === audio) audio.play().catch(() => {});
      };
      window.addEventListener("pointerdown", start, { once: true });
    });
    return () => {
      if (start) window.removeEventListener("pointerdown", start);
    };
  }, [enabled, volume]);

  // Stop when leaving the game.
  useEffect(() => () => ref.current?.pause(), []);
}
