class Workbench {
  private container: HTMLElement;
  constructor() {
    const container = document.getElementById("file-tree-container");
    if (!container) {
      throw new Error("UI container #file-tree-container not found.");
    }
    this.container = container;
    this.init();
  }

  private init() {
    this.container.innerHTML = `<h1>Project Initialized!</h1><p>We will build our file tree here using pure DOM APIs.</p>`;
    console.log("Workbench initialized successfully.");
  }
}

new Workbench();
