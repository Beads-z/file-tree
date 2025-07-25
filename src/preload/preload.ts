// src/preload/preload.ts

import { contextBridge, ipcRenderer } from "electron";
import type { IElectronAPI, IFileChangeEvent } from "../types";

const api: IElectronAPI = {
  getDirectoryContent: (path: string) => {
    return ipcRenderer.invoke("fs:getDirectoryContent", path);
  },
  onFileEvent: (callback: (event: IFileChangeEvent) => void) => {
    // Listen for the 'fs:file-event' channel from the main process.
    ipcRenderer.on("fs:file-event", (event, fileChangeEvent) => {
      // When an event is received, invoke the callback provided by the renderer.
      callback(fileChangeEvent);
    });
  },
  openDirectoryDialog: () => {
    return ipcRenderer.invoke("dialog:openDirectory");
  },
  showContextMenu: (path: string) => {
    // Send a message to the main process to show the context menu for a given path.
    ipcRenderer.send("file:show-context-menu", path);
  },
};

contextBridge.exposeInMainWorld("api", api);
