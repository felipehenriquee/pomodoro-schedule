import { useEffect, useRef } from "react";
import { blockService, isDesktop } from "../services";
import { playAlarm } from "../lib/audio";

type Opts = {
  soundOn: boolean;
  paused: boolean;
  /** Runs on every boundary (refresh current + reload blocks). */
  onBoundary: () => void;
};

/** Subscribes to backend block-boundary events: plays the alarm and notifies. */
export function useAlarm({ soundOn, paused, onBoundary }: Opts) {
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const onBoundaryRef = useRef(onBoundary);
  onBoundaryRef.current = onBoundary;

  useEffect(() => {
    if (!isDesktop) return;
    return blockService.onBoundary((p) => {
      if (soundOnRef.current && !pausedRef.current) playAlarm(p.boundary);
      onBoundaryRef.current();
    });
  }, []);
}
