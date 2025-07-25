// src/renderer/treeModel.ts
import path from "path-browserify";
import type { IFileNode } from "../types";

export class TreeModel {
  private nodes: Map<string, IFileNode> = new Map();
  private rootPath: string = "";
  private onUpdate: () => void = () => {};
  private activeNodePath: string | null = null;

  constructor(onUpdateCallback: () => void) {
    this.onUpdate = onUpdateCallback;
  }

  public async loadRoot(path: string): Promise<void> {
    this.rootPath = path;
    const rootChildren = await window.api.getDirectoryContent(path);

    const rootNode: IFileNode = {
      name: path,
      isDirectory: true,
      path: path,
      children: [],
      isExpanded: true,
    };
    this.nodes.set(path, rootNode);

    rootChildren.forEach((child) => {
      const childNode: IFileNode = {
        ...child,
        children: child.isDirectory ? [] : undefined,
      };
      this.nodes.set(childNode.path, childNode);
      rootNode.children!.push(childNode);
    });

    this.onUpdate();
  }

  public async toggleNodeExpansion(nodePath: string): Promise<void> {
    const node = this.nodes.get(nodePath);
    if (!node || !node.isDirectory) return;

    if (node.children && node.children.length === 0 && !node.isExpanded) {
      const children = await window.api.getDirectoryContent(nodePath);
      children.forEach((child) => {
        const childNode: IFileNode = {
          ...child,
          children: child.isDirectory ? [] : undefined,
        };
        this.nodes.set(child.path, childNode);
        node.children!.push(childNode);
      });
    }

    node.isExpanded = !node.isExpanded;
    this.onUpdate();
  }

  public setActiveNode(path: string | null) {
    if (this.activeNodePath === path) return;
    this.activeNodePath = path;
    this.onUpdate();
  }

  public getActiveNodePath(): string | null {
    return this.activeNodePath;
  }

  /**
   * Adds a new node to the tree model.
   * @param newNodePath The full path of the new file or directory.
   * @param isDirectory Whether the new node is a directory.
   */
  public addNode(newNodePath: string, isDirectory: boolean) {
    const parentPath = path.dirname(newNodePath);
    const parentNode = this.nodes.get(parentPath);

    if (parentNode && parentNode.children) {
      // Avoid adding duplicates
      if (parentNode.children.some((child) => child.path === newNodePath))
        return;

      const newNode: IFileNode = {
        name: path.basename(newNodePath),
        path: newNodePath,
        isDirectory,
        children: isDirectory ? [] : undefined,
      };
      this.nodes.set(newNodePath, newNode);
      parentNode.children.push(newNode);
      this.onUpdate();
    }
  }

  /**
   * Removes a node from the tree model.
   * @param nodePath The full path of the node to remove.
   */
  public removeNode(nodePath: string) {
    const nodeToRemove = this.nodes.get(nodePath);
    if (!nodeToRemove) return;

    const parentPath = path.dirname(nodePath);
    const parentNode = this.nodes.get(parentPath);

    if (parentNode && parentNode.children) {
      parentNode.children = parentNode.children.filter(
        (child) => child.path !== nodePath
      );
    }

    this.nodes.delete(nodePath);

    if (nodeToRemove.isDirectory && nodeToRemove.children) {
      const removeChildren = (children: IFileNode[]) => {
        for (const child of children) {
          this.nodes.delete(child.path);
          if (child.isDirectory && child.children) {
            removeChildren(child.children);
          }
        }
      };
      removeChildren(nodeToRemove.children);
    }

    this.onUpdate();
  }

  public getVisibleNodes(): (IFileNode & { depth: number })[] {
    const visibleNodes: (IFileNode & { depth: number })[] = [];
    const rootNode = this.nodes.get(this.rootPath);
    if (!rootNode) return [];

    const traverse = (node: IFileNode, depth: number) => {
      visibleNodes.push({ ...node, depth });
      if (node.isExpanded && node.children) {
        const sortedChildren = [...node.children].sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        for (const child of sortedChildren) {
          traverse(child, depth + 1);
        }
      }
    };

    if (rootNode.isExpanded && rootNode.children) {
      const sortedRootChildren = [...rootNode.children].sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      sortedRootChildren.forEach((child) => traverse(child, 0));
    }

    return visibleNodes;
  }
}
