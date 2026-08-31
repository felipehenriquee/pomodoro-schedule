import { join } from "node:path";
import {
  app,
  BrowserWindow,
  Menu,
  nativeImage,
  Tray,
} from "electron";
import { registerIpc } from "./ipc";
import { startScheduler, stopScheduler } from "./scheduler";
import { closeDb } from "./db/index";

const DEV_URL = "http://localhost:1420";
const isDev = !app.isPackaged;

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let quitting = false;

app.setAppUserModelId("com.felipe.pomodoro");

// instancia unica
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      win.show();
      win.focus();
    }
  });
  app.whenReady().then(start);
}

function iconPath(): string {
  // dev: resources/ na raiz do projeto; prod: empacotado em resources/
  return isDev
    ? join(app.getAppPath(), "resources", "icon.png")
    : join(process.resourcesPath, "icon.png");
}

function createWindow(): void {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Pomodoro",
    icon: iconPath(),
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // libera o Web Audio sem gesto do usuario -> som "lembrado" toca ao abrir
      autoplayPolicy: "no-user-gesture-required",
    },
  });

  win.once("ready-to-show", () => win?.show());

  win.on("close", (e) => {
    if (!quitting) {
      e.preventDefault();
      win?.hide();
    }
  });

  win.on("closed", () => {
    win = null;
  });

  if (isDev) {
    loadDevWithRetry();
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

function loadDevWithRetry(attempt = 0): void {
  if (!win) return;
  win.loadURL(DEV_URL).catch(() => {
    if (attempt < 60) setTimeout(() => loadDevWithRetry(attempt + 1), 400);
  });
}

function createTray(): void {
  const img = nativeImage.createFromPath(iconPath()).resize({ width: 18, height: 18 });
  tray = new Tray(img.isEmpty() ? nativeImage.createEmpty() : img);
  tray.setToolTip("Pomodoro");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Abrir Pomodoro",
        click: () => {
          win?.show();
          win?.focus();
        },
      },
      { type: "separator" },
      {
        label: "Sair",
        click: () => {
          quitting = true;
          app.quit();
        },
      },
    ])
  );
  tray.on("click", () => {
    win?.show();
    win?.focus();
  });
}

function start(): void {
  registerIpc();
  createWindow();
  createTray();
  startScheduler(() => win);
}

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
  else win?.show();
});

app.on("before-quit", () => {
  quitting = true;
});

app.on("will-quit", () => {
  stopScheduler();
  closeDb();
});

// nao encerra ao fechar todas as janelas (fica na bandeja)
app.on("window-all-closed", () => {
  if (process.platform === "darwin") return;
  // no-op: mantido vivo pela bandeja
});
