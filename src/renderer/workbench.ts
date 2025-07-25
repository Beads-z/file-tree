// src/renderer/workbench.ts
import { TreeModel } from "./treeModel";
import { TreeView } from "./treeView";
import type { IFileChangeEvent } from "../types";

class Workbench {
  private treeModel: TreeModel;
  private treeView: TreeView;

  constructor() {
    const container = document.getElementById("file-tree-container");
    if (!container)
      throw new Error("UI container #file-tree-container not found.");

    this.treeModel = new TreeModel(() => this.renderTree());
    this.treeView = new TreeView(
      container,
      (path) => this.handleNodeClick(path),
      (event) => this.handleKeyDown(event),
      (path) => this.handleContextMenu(path) // Pass the new handler
    );

    this.init();
  }

  private handleContextMenu(nodePath: string) {
    // A node was right-clicked. Tell the main process to show the menu.
    window.api.showContextMenu(nodePath);
  }

  private async init() {
    // Start listening for file system events from the main process.
    window.api.onFileEvent((event) => this.handleFileChangeEvent(event));

    await this.treeModel.loadRoot("/");
  }

  private handleFileChangeEvent(event: IFileChangeEvent) {
    console.log("File event received from main process:", event);
    switch (event.type) {
      case "add":
        // The isDirectory flag from chokidar can sometimes be undefined for files.
        // We ensure it's a boolean.
        this.treeModel.addNode(event.path, !!event.isDirectory);
        break;
      case "unlink":
        this.treeModel.removeNode(event.path);
        break;
    }
  }

  private renderTree() {
    const visibleNodes = this.treeModel.getVisibleNodes();
    const activeNodePath = this.treeModel.getActiveNodePath();
    this.treeView.updateNodes(visibleNodes, activeNodePath);
  }

  private handleNodeClick(nodePath: string) {
    this.treeModel.setActiveNode(nodePath);
    this.treeModel.toggleNodeExpansion(nodePath);
  }

  private handleKeyDown(event: KeyboardEvent) {
    const activePath = this.treeModel.getActiveNodePath();
    if (!activePath) {
      const firstNode = this.treeModel.getVisibleNodes()[0];
      if (firstNode) this.treeModel.setActiveNode(firstNode.path);
      return;
    }

    const visibleNodes = this.treeModel.getVisibleNodes();
    const currentIndex = visibleNodes.findIndex(
      (node) => node.path === activePath
    );
    if (currentIndex === -1) return;

    event.preventDefault();

    switch (event.key) {
      case "ArrowUp": {
        const prevIndex = Math.max(0, currentIndex - 1);
        if (visibleNodes[prevIndex])
          this.treeModel.setActiveNode(visibleNodes[prevIndex].path);
        break;
      }
      case "ArrowDown": {
        const nextIndex = Math.min(visibleNodes.length - 1, currentIndex + 1);
        if (visibleNodes[nextIndex])
          this.treeModel.setActiveNode(visibleNodes[nextIndex].path);
        break;
      }
      case "ArrowRight": {
        const currentNode = visibleNodes[currentIndex];
        if (currentNode.isDirectory && !currentNode.isExpanded) {
          this.treeModel.toggleNodeExpansion(currentNode.path);
        }
        break;
      }
      case "ArrowLeft": {
        const currentNode = visibleNodes[currentIndex];
        if (currentNode.isDirectory && currentNode.isExpanded) {
          this.treeModel.toggleNodeExpansion(currentNode.path);
        }
        break;
      }
    }
  }
}

new Workbench();
