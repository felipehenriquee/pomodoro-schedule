import { useEffect, useRef, useState } from "react";
import type { CurrentBlock } from "../models";

/**
 * One-off nudge to turn the sound on: opens when a new block starts while the
 * sound is off (and we're not paused).
 */
export function useSoundPrompt(
  current: CurrentBlock | null,
  soundOn: boolean,
  paused: boolean
) {
  const [promptOpen, setPromptOpen] = useState(false);
  const prevBlockId = useRef<number | null | undefined>(undefined);
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const id = current?.current?.id ?? null;
    if (prevBlockId.current === undefined) {
      prevBlockId.current = id;
      return;
    }
    if (id !== prevBlockId.current) {
      const started = id !== null;
      prevBlockId.current = id;
      if (started && !soundOnRef.current && !pausedRef.current) setPromptOpen(true);
    }
  }, [current]);

  return { promptOpen, dismiss: () => setPromptOpen(false) };
}
