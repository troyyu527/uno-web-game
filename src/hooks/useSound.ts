import { useEffect, useRef } from "react";
import { useGame, type GameEvent } from "@/store/gameStore";
import { asset } from "@/lib/assets";

const FILES: Record<GameEvent, string> = {
  deal: "audio/card-delt.mp3",
  play: "audio/card-play.mp3",
  action: "audio/card-action.mp3",
  draw: "audio/card-delt.mp3",
  reject: "audio/card-reject.mp3",
  uno: "audio/uno-call.mp3",
  gameover: "audio/game-win.mp3",
};
const VOLUME: Partial<Record<GameEvent, number>> = { uno: 0.6, gameover: 0.9 };

/** Plays a sound effect whenever the store emits a game event. */
export function useSound(enabled: boolean) {
  const event = useGame((s) => s.event);
  const cache = useRef<Record<string, HTMLAudioElement>>({});
  const lastPlayed = useRef(-1);

  useEffect(() => {
    if (!enabled || !event || event.n === lastPlayed.current) return;
    lastPlayed.current = event.n;
    const file = FILES[event.type];
    let audio = cache.current[file];
    if (!audio) {
      audio = new Audio(asset(file));
      cache.current[file] = audio;
    }
    audio.currentTime = 0;
    audio.volume = VOLUME[event.type] ?? 1;
    audio.play().catch(() => {
      /* autoplay may be blocked until first interaction — ignore */
    });
  }, [event, enabled]);
}
