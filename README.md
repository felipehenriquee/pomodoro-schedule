# Pomodoro Schedule

Desktop app where you register **recurring schedules** and get an **audible alarm
+ notification** on every pomodoro block transition.

Example schedule: `Mon-Fri, 08:00-18:00, 50 min focus, 10 min break, long break
12:00-14:00`. Since `50 + 10 = 60`, the alarm always lands on `:50` (end of
focus) and `:00` (back to focus).

## Stack

```
pomodoro/
├─ front/       React + Vite + TypeScript + FullCalendar (UI, Web Audio)
└─ back-node/   Electron + TypeScript + better-sqlite3
```

- `back/` holds an earlier version of the backend in **Rust/Tauri**, kept only
  as reference (not part of this repo). See `back/TAURI.md`.

## Development

```bash
cd front && npm install && npm run gen-sounds && cd ..
cd back-node && npm install     # postinstall rebuilds better-sqlite3 for Electron
npm run dev                     # inside back-node/: starts the front Vite + the Electron window
```

Always run from a plain terminal, **not the VSCode integrated terminal** when
VSCode is installed via snap (it injects the snap's `LD_LIBRARY_PATH` and breaks
Electron).

## Building the installer

```bash
cd back-node
npm run package                 # -> back-node/dist/
```

Linux: `.AppImage` (portable) and `.deb` (`sudo apt install ./...deb`, installs
to `/opt/Pomodoro/`). Building a `.exe` (Windows) requires building on Windows/CI
because `better-sqlite3` is a native module.

## back-node architecture

| Piece | Where |
|---|---|
| Domain (block engine + recurrence), **with tests** (`npm test`) | `src/main/domain/` |
| Decoupled data layer (repository pattern) | `src/main/db/repositories/` — `types.ts` (interfaces) + `sqlite/` (impl). Swapping databases = a new folder implementing the same interface |
| Orchestration (materialize, updateBlock, createBlock, ...) | `src/main/services/agenda.ts` |
| Alarm scheduler | `src/main/scheduler.ts` — `setTimeout` in the main process (not throttled; keeps running when minimized to the tray) |
| IPC | `src/main/ipc.ts` (`ipcMain.handle`) + `src/preload/index.ts` (`window.api`) + `src/channels.ts` |
| Window, tray, close-to-tray, single instance | `src/main/index.ts` |

Database: `~/.config/Pomodoro/pomodoro.sqlite` (Linux) /
`%APPDATA%\Pomodoro\pomodoro.sqlite` (Windows). Created on first run; the user
installs no database at all. Schema applied via `user_version`
(`src/main/db/schema.ts` + migrations in `db/index.ts`).

## How the alarm works

The `scheduler` (main process) sleeps until the next block boundary. When it
arrives:

1. it emits `block-boundary` -> the renderer plays `alarm-end.wav` (`:50`) or
   `alarm-start.wav` (`:00`) through an `<audio>` element;
2. it fires the **native OS notification**;
3. it marks the block as done.

Audio is unlocked without a user gesture (`webPreferences.autoplayPolicy`) and
the preference (on/off) is stored in `localStorage` (`pomodoro:soundOn`, on by
default) — the app opens in the state you left it. Swap the sounds by dropping
your own files into `front/public/` with the same names.

**Closing the window = minimize to the tray** (the app stays alive alarming).
Tray menu -> "Sair" to actually quit. On GNOME the tray icon needs the
AppIndicator extension (Ubuntu usually ships it).

## Schedules

A schedule (template) is permanent and recurring — you never recreate it.

- Frequency: `Não repetir` (single date), `Todos os dias`, `Dias da semana`
  (toggles) or `Intervalo de dias` (every N days from a start date).
- Optional validity window: `válido de` / `válido até` (the "from" is locked
  when editing).
- `materialize` always keeps ~120 days ahead generated (on create/edit and once
  a day by the scheduler). Navigating the calendar loads the visible week.
- Agenda header: **"+ nova agenda"**, **"ver agendas"** (list with edit /
  delete), a **balance** button, and **⋮** -> "delete all cancelled events".

### Editing a schedule

Applies from **today onward** (the past never changes). For each future day not
hand-edited: if it still occurs -> regenerated with the new config; if it
**stops occurring** (recurrence/validity changed) -> events that haven't started
yet become **cancelled** (not deleted), coloured `#CE2D4F`.

## Events

Every block has a `seq` = 1-based position among blocks of the same kind on that
day (foco1, foco2, pausa1...). `block_slot(template_id, kind, seq)` stores a
per-position override for name / duration / offset.

- **Create** an ad-hoc event: click a time on the calendar. On collision, the
  day's following events are pushed ("park and place" so the UNIQUE isn't
  violated). It gets `block.manual = 1` and locks the day.
- **Edit** (side drawer): name + time. On save you choose **this event only** or
  **every day of this schedule**. An ongoing or past event: the time is locked
  (the name can still change).
- **Cancel** (popover button, with confirmation): a schedule event becomes
  `status = 'skipped'` (you can **restore** it later); an ad-hoc event is
  deleted.
- **Delete** an already-cancelled event: gone for good (with confirmation).

## Pause / focus balance

The "pause" button shows on any ongoing event (Focus screen and popover). It
doesn't touch times — it just mutes the alarm while paused.

Paused time **while the current event is a focus block** builds up a **balance**
(`localStorage` `pomodoro:debt:<date>`, resets daily). Short/long breaks don't
count. There's a balance button in the header; when the day's schedule ends with
a balance, a modal opens:

- **fazer agora** — a focus block starting now;
- **⋮** -> **add to the end of the day**, **pick a date + time**, **clear the
  balance**;
- **agora não** — keep it.

## To do

- Export/import (JSON) button in the UI — the commands already exist in the back
- Autostart-on-login toggle
- Statistics from `session_log`
