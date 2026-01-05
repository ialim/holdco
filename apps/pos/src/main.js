const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

function createWindow() {
  const preloadPath = path.join(app.getAppPath(), "src", "preload.js");
  const preloadExists = fs.existsSync(preloadPath);
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: preloadExists ? preloadPath : undefined
    }
  });

  win.loadFile(path.join(__dirname, "renderer", "index.html"));

  win.webContents.on("did-finish-load", async () => {
    try {
      const bridge = await win.webContents.executeJavaScript("typeof window.pos");
      if (bridge !== "object") {
        console.error("POS bridge missing. Preload path:", preloadPath);
      }
    } catch (error) {
      console.error("POS bridge check failed:", error);
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
