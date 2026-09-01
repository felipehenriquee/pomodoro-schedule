import { BrowserWindow, Notification } from "electron";
import { CH } from "../channels";
import { materializeAhead } from "./services/agenda";
import { getContext } from "./services/context";
import { dateStr, localRfc3339 } from "./util/time";

let timer: NodeJS.Timeout | undefined;
let lastAheadDay = "";

/** Runs `materializeAhead` at most once a day (cheap, but not every tick). */
function keepAhead(): void {
  const today = dateStr();
  if (lastAheadDay === today) return;
  lastAheadDay = today;
  try {
    materializeAhead(getContext());
  } catch (err) {
    console.error("[scheduler] materializeAhead", err);
  }
}

/**
 * Sleeps until the next block boundary; on arrival it emits `block-boundary`
 * (the renderer plays the sound) and fires the native notification. setTimeout
 * in the Electron main process is not throttled, so it keeps running while the
 * window is minimized to the tray. It also keeps ~120 days always materialized
 * so the schedule never "runs out".
 */
export function startScheduler(getWin: () => BrowserWindow | null): void {
  const schedule = (ms: number) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(tick, Math.max(200, ms));
  };

  const tick = () => {
    try {
      keepAhead();
      const { repos } = getContext();
      const now = new Date();
      const nowIso = localRfc3339(now);

      const nextEnd = repos.blocks.nextEndingAfter(nowIso);
      if (!nextEnd) {
        schedule(5 * 60_000);
        return;
      }

      const ms = new Date(nextEnd.end_ts).getTime() - now.getTime();
      if (ms > 1500) {
        schedule(Math.min(ms - 500, 15 * 60_000));
        return;
      }

      const boundary = nextEnd.kind === "work" ? "work_end" : "work_start";
      getWin()?.webContents.send(CH.evtBlockBoundary, { boundary });

      const [title, body] =
        boundary === "work_end"
          ? ["Fim do bloco de foco", "Hora da pausa"]
          : ["Fim da pausa", "Voltar ao foco"];
      if (Notification.isSupported()) new Notification({ title, body }).show();

      repos.blocks.markDoneBefore(nowIso);
      schedule(1500);
    } catch (err) {
      console.error("[scheduler]", err);
      schedule(60_000);
    }
  };

  tick();
}

export function stopScheduler(): void {
  if (timer) clearTimeout(timer);
  timer = undefined;
}
