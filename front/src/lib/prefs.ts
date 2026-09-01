// Small localStorage-backed preferences. Every access is wrapped in try/catch
// because storage can throw (private mode, disabled site data).
import { isoDate } from "./time";

const SOUND_KEY = "pomodoro:soundOn";
const debtKey = () => `pomodoro:debt:${isoDate(new Date())}`;

/** Sound on/off; on by default. */
export function loadSoundPref(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "0";
  } catch {
    return true;
  }
}

export function saveSoundPref(on: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** Paused-focus balance in ms, stored per day (resets when the date changes). */
export function loadDebt(): number {
  try {
    return Number(localStorage.getItem(debtKey())) || 0;
  } catch {
    return 0;
  }
}

export function saveDebt(ms: number): void {
  try {
    localStorage.setItem(debtKey(), String(Math.round(ms)));
  } catch {
    /* ignore */
  }
}
