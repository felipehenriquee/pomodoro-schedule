import { useCallback, useEffect, useState } from "react";
import { blockService, isDesktop } from "../services";
import type { CurrentBlock } from "../models";

/** Polls the backend for the current/next block (every 15s + when the tab regains focus). */
export function useCurrentBlock() {
  const [current, setCurrent] = useState<CurrentBlock | null>(null);

  const refresh = useCallback(async () => {
    if (!isDesktop) return;
    try {
      setCurrent(await blockService.current());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
    const poll = window.setInterval(refresh, 15_000);
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  return { current, refresh };
}
