// src/renderer/treeView.ts
import type { IFileNode } from "../types";
import { iconService } from "./iconService";

export class TreeView {
  private container: HTMLElement;
  private onNodeClick: (path: string) => void;
  private onKeyDown: (event: KeyboardEvent) => void;
  private onContextMenu: (path: string) => void;

  private rowHeight = 22;
  private sizerElement: HTMLElement;
  private visibleNodes: (IFileNode & { depth: number })[] = [];

  constructor(
    container: HTMLElement,
    onNodeClick: (path: string) => void,
    onKeyDown: (event: KeyboardEvent) => void,
    onContextMenu: (path: string) => void
  ) {
    this.container = container;
    this.onNodeClick = onNodeClick;
    this.onKeyDown = onKeyDown;
    this.onContextMenu = onContextMenu;

    this.sizerElement = document.createElement("div");
    this.sizerElement.className = "tree-node-sizer";
    this.container.appendChild(this.sizerElement);

    this.container.addEventListener("click", this.handleClick.bind(this));
    this.container.addEventListener("keydown", (e) => this.onKeyDown(e));
    this.container.addEventListener(
      "contextmenu",
      this.handleContextMenu.bind(this)
    );
    this.container.addEventListener("scroll", () =>
      this.renderVisibleNodes(null)
    );
    new ResizeObserver(() => this.renderVisibleNodes(null)).observe(
      this.container
    );
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const nodeElement = target.closest<HTMLElement>(".tree-node");
    if (nodeElement && nodeElement.dataset.path) {
      this.onNodeClick(nodeElement.dataset.path);
    }
  }

  private handleContextMenu(event: MouseEvent): void {
    event.preventDefault(); // Prevent the default browser context menu
    const target = event.target as HTMLElement;
    const nodeElement = target.closest<HTMLElement>(".tree-node");

    if (nodeElement && nodeElement.dataset.path) {
      // If a node was right-clicked, invoke the context menu callback.
      this.onContextMenu(nodeElement.dataset.path);
    }
  }

  public updateNodes(
    nodes: (IFileNode & { depth: number })[],
    activeNodePath: string | null
  ): void {
    this.visibleNodes = nodes;
    this.sizerElement.style.height = `${
      this.visibleNodes.length * this.rowHeight
    }px`;
    this.renderVisibleNodes(activeNodePath);
  }

  private renderVisibleNodes(activeNodePath: string | null): void {
    while (this.sizerElement.firstChild) {
      this.sizerElement.removeChild(this.sizerElement.firstChild);
    }

    const scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;
    let startIndex = Math.floor(scrollTop / this.rowHeight);
    let endIndex = Math.min(
      this.visibleNodes.length - 1,
      Math.ceil((scrollTop + containerHeight) / this.rowHeight)
    );
    startIndex = Math.max(0, startIndex - 5);
    endIndex = Math.min(this.visibleNodes.length - 1, endIndex + 5);

    const fragment = document.createDocumentFragment();
    for (let i = startIndex; i <= endIndex; i++) {
      const node = this.visibleNodes[i];
      if (node) {
        const el = this.createNodeElement(node, node.path === activeNodePath);
        el.style.top = `${i * this.rowHeight}px`;
        el.style.height = `${this.rowHeight}px`;
        fragment.appendChild(el);
      }
    }
    this.sizerElement.appendChild(fragment);
  }

  private createNodeElement(
    node: IFileNode & { depth: number },
    isActive: boolean
  ): HTMLElement {
    const el = document.createElement("div");
    el.classList.add("tree-node");
    if (isActive) {
      el.classList.add("is-active");
    }
    el.dataset.path = node.path;
    el.style.paddingLeft = `${10 + node.depth * 20}px`;

    // --- ICON LOGIC UPDATE ---
    const icon = document.createElement("span");
    // We now add two classes: 'codicon' to enable the font,
    // and the specific icon class from our service.
    const iconClass = iconService.getIconClass(
      node.name,
      node.isDirectory,
      node.isExpanded
    );
    icon.className = `tree-node-icon codicon ${iconClass}`;
    // We no longer set textContent for the icon.
    // --- END ICON LOGIC UPDATE ---

    const label = document.createElement("span");
    label.classList.add("tree-node-label");
    label.textContent = node.name;

    el.appendChild(icon);
    el.appendChild(label);

    return el;
  }
}
