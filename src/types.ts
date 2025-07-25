// src/types.ts

export interface IFileNode {
  name: string;
  isDirectory: boolean;
  path: string;
  children?: IFileNode[];
  isExpanded?: boolean;
}

// Define the structure of a file system event
export interface IFileChangeEvent {
  type: "add" | "unlink";
  path: string;
  isDirectory?: boolean;
}

export interface IElectronAPI {
  getDirectoryContent: (path: string) => Promise<IFileNode[]>;
  // Allows the renderer to listen for events sent from the main process.
  onFileEvent: (callback: (event: IFileChangeEvent) => void) => void;
}

export interface IElectronAPI {
  getDirectoryContent: (path: string) => Promise<IFileNode[]>;
  onFileEvent: (callback: (event: IFileChangeEvent) => void) => void;
  openDirectoryDialog: () => Promise<string | null>;
  // --- ADD THIS NEW API METHOD ---
  showContextMenu: (path: string) => void;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}
