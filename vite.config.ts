import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";

export default defineConfig({
  plugins: [
    electron([
      {
        // 主进程 (Main Process) 的入口文件
        entry: "src/main/main.ts",
      },
      {
        // 预加载脚本 (Preload Script) 的入口文件
        entry: "src/preload/preload.ts",
        onstart(options) {
          // 当预加载脚本改变时，让渲染进程重新加载
          options.reload();
        },
      },
    ]),
    renderer(),
  ],
});
