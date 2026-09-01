import { useCallback, useEffect, useRef, useState } from "react";
import { blockService } from "../services";
import { localRfc3339 } from "../lib/time";
import { loadDebt, saveDebt } from "../lib/prefs";
import type { CurrentBlock } from "../models";

/**
 * Pause = mute-only. While paused during a focus block, real elapsed time is
 * accrued into a per-day balance (`debtMs`). When the day's schedule ends with
 * a balance still pending, `recoverOpen` turns true so the user can schedule a
 * make-up focus block.
 */
export function useFocusBalance(
  current: CurrentBlock | null,
  reload: () => void
) {
  const [paused, setPaused] = useState(false);
  const [debtMs, setDebtMs] = useState<number>(loadDebt);
  const [recoverOpen, setRecoverOpen] = useState(false);
  const pauseStartRef = useRef<number | null>(null);

  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const curKindRef = useRef(current?.current?.kind);
  curKindRef.current = current?.current?.kind;

  // persist the balance (per-day key; resets when the date changes)
  useEffect(() => {
    saveDebt(debtMs);
  }, [debtMs]);

  const togglePause = useCallback(() => {
    if (pausedRef.current) {
      setPaused(false); // the effect cleanup below settles the final balance
    } else {
      pauseStartRef.current = Date.now();
      setPaused(true);
    }
  }, []);

  // While paused, accrue time into the balance -- but ONLY while the current
  // event is a focus block. Short/long breaks don't count.
  useEffect(() => {
    if (!paused) return;
    const accrue = (stop: boolean) => {
      if (pauseStartRef.current == null) return;
      const d = Date.now() - pauseStartRef.current;
      pauseStartRef.current = stop ? null : Date.now();
      if (curKindRef.current === "work" && d > 0) setDebtMs((x) => x + d);
    };
    const iv = window.setInterval(() => accrue(false), 1000);
    return () => {
      window.clearInterval(iv);
      accrue(true);
    };
  }, [paused]);

  // End of the day's schedule (nothing ongoing, nothing next) + pending balance
  const hadCurrentRef = useRef(false);
  useEffect(() => {
    const has = !!current?.current;
    const nothingAhead = !current?.next;
    if (hadCurrentRef.current && !has && nothingAhead && debtMs > 1000) {
      setRecoverOpen(true);
    }
    hadCurrentRef.current = has;
  }, [current, debtMs]);

  const clear = useCallback(() => {
    setDebtMs(0);
    setRecoverOpen(false);
  }, []);

  // Creates a "Recuperação" focus block (duration = balance) starting at `start`.
  const createRecovery = useCallback(
    async (date: string, start: Date) => {
      if (debtMs < 1000) {
        setRecoverOpen(false);
        return;
      }
      const end = new Date(start.getTime() + Math.max(60_000, debtMs));
      try {
        await blockService.create({
          date,
          kind: "work",
          label: "Recuperação",
          start_ts: localRfc3339(start),
          end_ts: localRfc3339(end),
        });
      } catch (e) {
        console.error(e);
      }
      setDebtMs(0);
      setRecoverOpen(false);
      reload();
    },
    [debtMs, reload]
  );

  // End of day `d`: right after the last event; if the day is empty, 18:00.
  const endOfDayStart = useCallback(async (d: string): Promise<Date> => {
    let latest: number | null = null;
    try {
      await blockService.materialize(d, d);
      for (const b of await blockService.range(d, d)) {
        const e = new Date(b.end_ts).getTime();
        if (latest === null || e > latest) latest = e;
      }
    } catch {
      /* ignore */
    }
    return latest !== null ? new Date(latest) : new Date(`${d}T18:00:00`);
  }, []);

  return {
    paused,
    togglePause,
    debtMs,
    clear,
    recoverOpen,
    openRecover: () => setRecoverOpen(true),
    closeRecover: () => setRecoverOpen(false),
    createRecovery,
    endOfDayStart,
  };
}
