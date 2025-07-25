// src/renderer/iconService.ts

// A map for specific filenames that should have a unique icon.
// Keys should be lowercase.
const specificFilenameMap = new Map<string, string>([
  [".gitignore", "codicon-git-commit"],
  ["package.json", "codicon-json"],
  ["package-lock.json", "codicon-lock"],
  ["readme.md", "codicon-book"],
  ["license", "codicon-law"],
  ["vite.config.ts", "codicon-settings-gear"],
  ["vite.config.js", "codicon-settings-gear"],
]);

// A map for file extensions.
// Keys should be the extension name without the dot, in lowercase.
const extensionMap = new Map<string, string>([
  ["js", "codicon-javascript"],
  ["ts", "codicon-typescript"],
  ["json", "codicon-json"],
  ["css", "codicon-css"],
  ["html", "codicon-html"],
  ["md", "codicon-markdown"],
  ["png", "codicon-file-media"],
  ["jpg", "codicon-file-media"],
  ["jpeg", "codicon-file-media"],
  ["gif", "codicon-file-media"],
  ["svg", "codicon-file-media"],
  ["zip", "codicon-file-zip"],
  ["rar", "codicon-file-zip"],
  ["7z", "codicon-file-zip"],
  ["log", "codicon-file-text"],
  ["txt", "codicon-file-text"],
  ["rs", "codicon-rust"],
  ["toml", "codicon-gear"],
]);

export const iconService = {
  getIconClass(
    name: string,
    isDirectory: boolean,
    isExpanded?: boolean
  ): string {
    if (isDirectory) {
      return isExpanded ? "codicon-folder-opened" : "codicon-folder";
    }

    const lowerCaseName = name.toLowerCase();

    if (specificFilenameMap.has(lowerCaseName)) {
      return specificFilenameMap.get(lowerCaseName)!;
    }

    const parts = name.split(".");
    const extension = parts.length > 1 ? parts.pop()!.toLowerCase() : "";

    // --- THIS CONSOLE LOG IS CRITICAL FOR DEBUGGING ---
    console.log(
      `[Icon Service] File: "${name}", Detected Extension: "${extension}"`
    );
    // ---

    if (extension && extensionMap.has(extension)) {
      return extensionMap.get(extension)!;
    }

    return "codicon-file";
  },
};
