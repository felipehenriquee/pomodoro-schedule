import { useCallback, useEffect, useRef, useState } from "react";
import { AgendaView } from "./components/AgendaView";
import { FocusView } from "./components/FocusView";
import { RecoverPrompt } from "./components/RecoverPrompt";
import { SoundPrompt } from "./components/SoundPrompt";
import { useBlocks } from "./hooks/useBlocks";
import { api, isDesktop } from "./lib/ipc";
import { playAlarm, unlockAudio } from "./lib/audio";
import { isoDate, localRfc3339, weekRange } from "./lib/time";
import type { BlockKind, CurrentBlock } from "./lib/types";

type View = "focus" | "agenda";

const debtKey = () => `pomodoro:debt:${isoDate(new Date())}`;
const SOUND_KEY = "pomodoro:soundOn";

function loadDebt(): number {
  try {
    return Number(localStorage.getItem(debtKey())) || 0;
  } catch {
    return 0;
  }
}

/** saved preference; on by default */
function loadSoundPref(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "0";
  } catch {
    return true;
  }
}

function saveSoundPref(on: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export default function App() {
  const [view, setView] = useState<View>("focus");
  const [range, setRange] = useState(() => weekRange());
  const { blocks, error, reload } = useBlocks(range.from, range.to);

  // calendar navigation -> materializes/loads the visible range
  const onRangeChange = useCallback((from: string, to: string) => {
    setRange((r) => (r.from === from && r.to === to ? r : { from, to }));
  }, []);
  const [current, setCurrent] = useState<CurrentBlock | null>(null);

  // optimistic: assume the saved preference; the unlock on mount confirms/corrects
  const [soundOn, setSoundOn] = useState(() => isDesktop && loadSoundPref());
  const [paused, setPaused] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);

  // paused-focus balance (ms), per day, persisted in localStorage
  const [debtMs, setDebtMs] = useState<number>(loadDebt);
  const [recoverOpen, setRecoverOpen] = useState(false);
  const pauseStartRef = useRef<number | null>(null);

  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const curKindRef = useRef<BlockKind | undefined>(undefined);
  curKindRef.current = current?.current?.kind;

  useEffect(() => {
    try {
      localStorage.setItem(debtKey(), String(Math.round(debtMs)));
    } catch {
      /* ignore */
    }
  }, [debtMs]);

  const refreshCurrent = useCallback(async () => {
    if (!isDesktop) return;
    try {
      setCurrent(await api.getCurrentBlock());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refreshCurrent();
    const poll = window.setInterval(refreshCurrent, 15_000);
    const onVis = () => {
      if (document.visibilityState === "visible") refreshCurrent();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refreshCurrent]);

  // Alarm on block boundaries
  useEffect(() => {
    if (!isDesktop) return;
    return api.onBlockBoundary((p) => {
      if (soundOnRef.current && !pausedRef.current) playAlarm(p.boundary);
      refreshCurrent();
      reloadRef.current();
    });
  }, [refreshCurrent]);

  // New event -> prompt to turn the sound on if it is off
  const prevBlockId = useRef<number | null | undefined>(undefined);
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

  const enableSound = useCallback(async () => {
    try {
      await unlockAudio();
      setSoundOn(true);
      saveSoundPref(true);
    } catch (err) {
      console.error("audio", err);
      setSoundOn(false);
    }
  }, []);

  const toggleSound = useCallback(async () => {
    if (soundOnRef.current) {
      setSoundOn(false);
      saveSoundPref(false);
    } else {
      await enableSound();
    }
  }, [enableSound]);

  // On open: if the preference is "on", try to unlock audio automatically
  // (in Electron autoplay is unlocked via webPreferences.autoplayPolicy)
  useEffect(() => {
    if (!isDesktop || !loadSoundPref()) return;
    unlockAudio()
      .then(() => setSoundOn(true))
      .catch(() => setSoundOn(false));
  }, []);

  const togglePause = useCallback(() => {
    if (pausedRef.current) {
      setPaused(false); // the effect cleanup below does the final balance settle
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

  // Creates a "Recuperação" focus block (duration = balance) starting at `start`.
  const createRecovery = useCallback(
    async (date: string, start: Date) => {
      if (debtMs < 1000) {
        setRecoverOpen(false);
        return;
      }
      const end = new Date(start.getTime() + Math.max(60_000, debtMs));
      try {
        await api.createBlock({
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
      await api.materializeRange(d, d);
      for (const b of await api.getBlocks(d, d)) {
        const e = new Date(b.end_ts).getTime();
        if (latest === null || e > latest) latest = e;
      }
    } catch {
      /* ignore */
    }
    return latest !== null ? new Date(latest) : new Date(`${d}T18:00:00`);
  }, []);

  const todayStr = isoDate(new Date());

  return (
    <>
      {view === "focus" ? (
        <FocusView
          current={current}
          soundOn={soundOn}
          paused={paused}
          onToggleSound={toggleSound}
          onTogglePause={togglePause}
          onOpenAgenda={() => setView("agenda")}
        />
      ) : (
        <AgendaView
          blocks={blocks}
          error={error}
          current={current}
          soundOn={soundOn}
          paused={paused}
          debtMs={debtMs}
          onToggleSound={toggleSound}
          onTogglePause={togglePause}
          onOpenRecover={() => setRecoverOpen(true)}
          onReload={reload}
          onRangeChange={onRangeChange}
          onOpenFocus={() => setView("focus")}
        />
      )}

      <SoundPrompt
        open={promptOpen}
        onActivate={async () => {
          await enableSound();
          setPromptOpen(false);
        }}
        onDismiss={() => setPromptOpen(false)}
      />

      <RecoverPrompt
        open={recoverOpen}
        debtMs={debtMs}
        onClose={() => setRecoverOpen(false)}
        onClear={() => {
          setDebtMs(0);
          setRecoverOpen(false);
        }}
        onDoNow={() => createRecovery(todayStr, new Date())}
        onEndOfDay={async () =>
          createRecovery(todayStr, await endOfDayStart(todayStr))
        }
        onPickDateTime={(date, time) =>
          createRecovery(date, new Date(`${date}T${time}:00`))
        }
      />
    </>
  );
}
