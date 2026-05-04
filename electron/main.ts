import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { initDatabase, closeDatabase } from "./db/database";
import { reportQueries } from "./db/queries";
import fs from "fs";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: "default",
    show: false,
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Lazy-init DB after app is ready
  const db = initDatabase();
  console.log("[DB] Initialized at:", db.name);

  // IPC handlers
  ipcMain.handle("db:report:list", () => {
    return reportQueries.list();
  });

  ipcMain.handle("db:report:get", (_, id: number) => {
    return reportQueries.get(id);
  });

  ipcMain.handle("db:report:create", (_, report: any) => {
    return reportQueries.create(report);
  });

  ipcMain.handle("db:report:delete", (_, id: number) => {
    return reportQueries.delete(id);
  });

  ipcMain.handle("dialog:open-file", async (_, options: any) => {
    if (!mainWindow) return { canceled: true };
    const result = await dialog.showOpenDialog(mainWindow, {
      ...options,
      properties: ["openFile"],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }
    const filePath = result.filePaths[0];
    const buffer = fs.readFileSync(filePath);
    return {
      canceled: false,
      filePath,
      name: path.basename(filePath),
      buffer: Array.from(buffer),
    };
  });

  ipcMain.handle("dialog:save-file", async (_, options: any, buffer: number[]) => {
    if (!mainWindow) return { canceled: true };
    const result = await dialog.showSaveDialog(mainWindow, options);
    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }
    fs.writeFileSync(result.filePath, Buffer.from(buffer));
    return { canceled: false, filePath: result.filePath };
  });

  ipcMain.handle("app:info", () => ({
    version: app.getVersion(),
    platform: process.platform,
  }));

  createWindow();
});

app.on("window-all-closed", () => {
  closeDatabase();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
