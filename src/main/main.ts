// src/main/main.ts

import { app, BrowserWindow, ipcMain, dialog, Menu } from "electron";
import path from "node:path";
import fs from "node:fs";
import * as chokidar from "chokidar";
import type { IFileNode } from "../types";

let watcher: chokidar.FSWatcher | null = null;
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.on("closed", () => {
    watcher?.close(); // Clean up watcher when window closes
    mainWindow = null;
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.on("browser-window-created", (e, window) => {
  mainWindow = window;
});

app.whenReady().then(() => {
  ipcMain.on("file:show-context-menu", (event, path: string) => {
    // Create the menu template.
    const template: (
      | Electron.MenuItemConstructorOptions
      | Electron.MenuItem
    )[] = [
      {
        label: "New File",
        click: () => {
          console.log(`ACTION: Create new file in ${path}`);
        }, // Placeholder action
      },
      {
        label: "New Folder",
        click: () => {
          console.log(`ACTION: Create new folder in ${path}`);
        }, // Placeholder action
      },
      { type: "separator" },
      {
        label: "Rename",
        click: () => {
          console.log(`ACTION: Rename ${path}`);
        }, // Placeholder action
      },
      {
        label: "Delete",
        click: () => {
          console.log(`ACTION: Delete ${path}`);
        }, // Placeholder action
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    // The menu needs to be shown in the window that sent the request.
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      menu.popup({ window });
    }
  });
  // --- THIS HANDLER IS NOW RESPONSIBLE FOR SETTING UP THE WATCHER ---
  ipcMain.handle("dialog:openDirectory", async () => {
    if (!mainWindow) return null;

    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
    });

    if (canceled || filePaths.length === 0) {
      return null;
    }

    const directoryPath = filePaths[0];

    // --- NEW LOGIC: Manage watcher lifecycle here ---
    // 1. Close any existing watcher before starting a new one.
    if (watcher) {
      console.log("Closing previous watcher...");
      await watcher.close();
    }

    // 2. Create and configure a new watcher for the selected path.
    console.log(`Initializing file watcher for: ${directoryPath}`);
    const pathsToIgnore = [/(^|[\/\\])\../, /node_modules/, /dist/];
    watcher = chokidar.watch(directoryPath, {
      ignored: pathsToIgnore,
      persistent: true,
      ignoreInitial: true,
      depth: 15, // Increased depth for more realistic usage
    });

    const sendEvent = (
      type: "add" | "unlink",
      path: string,
      isDirectory: boolean | undefined
    ) => {
      if (!mainWindow) return;
      mainWindow.webContents.send("fs:file-event", { type, path, isDirectory });
    };

    watcher
      .on("add", (path, stats) => sendEvent("add", path, stats?.isDirectory()))
      .on("addDir", (path, stats) => sendEvent("add", path, true))
      .on("unlink", (path) => sendEvent("unlink", path, undefined))
      .on("unlinkDir", (path) => sendEvent("unlink", path, true))
      .on("error", (err) => {
        if (err instanceof Error) {
          console.error(`Watcher error: ${err.message}`);
        }
      });
    // --- END NEW LOGIC ---

    return directoryPath;
  });

  // --- THIS HANDLER IS NOW SIMPLIFIED ---
  // Its only job is to read directory content on demand.
  ipcMain.handle(
    "fs:getDirectoryContent",
    async (event, directoryPath: string): Promise<IFileNode[]> => {
      try {
        const entries = await fs.promises.readdir(directoryPath, {
          withFileTypes: true,
        });
        return entries.map((entry) => ({
          name: entry.name,
          isDirectory: entry.isDirectory(),
          path: path.join(directoryPath, entry.name),
        }));
      } catch (err: unknown) {
        if (err instanceof Error && "code" in err) {
          const nodeError = err as NodeJS.ErrnoException;
          if (nodeError.code !== "EPERM" && nodeError.code !== "EACCES") {
            console.error(
              `Error reading directory ${directoryPath}:`,
              nodeError
            );
          }
        } else {
          console.error(
            `An unexpected error occurred reading ${directoryPath}:`,
            err
          );
        }
        return [];
      }
    }
  );

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
