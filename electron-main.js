const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');

let mainWindow;
let isProcessing = false;
let processQueue = [];

function createWindow() {

  const isDev = !app.isPackaged;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    title: "MetaMatrix",

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // ✅ DEV MODE
  if (isDev) {

    mainWindow.loadURL('http://localhost:3000');

  }

  // ✅ PRODUCTION BUILD
  else {

    mainWindow.loadFile(
      path.join(__dirname, 'dist', 'index.html')
    );

  }

  // Optional Debug
  // mainWindow.webContents.openDevTools();

  // Error Handle
  mainWindow.webContents.on('did-fail-load', () => {
    console.log('❌ Failed to load UI');
  });
}

/* =========================
   APP READY
========================= */

app.whenReady().then(() => {

  createWindow();

  app.on('activate', () => {

    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }

  });

});

/* =========================
   CLOSE APP
========================= */

app.on('window-all-closed', () => {

  if (process.platform !== 'darwin') {
    app.quit();
  }

});

/* =========================
   START BATCH
========================= */

ipcMain.handle('start-batch', async (event, payload) => {

  if (isProcessing) {

    return {
      success: false,
      message: 'Batch already running'
    };

  }

  isProcessing = true;

  processQueue = payload.groups || [];

  const total = processQueue.length;

  let completed = 0;
  let successCount = 0;

  event.sender.send('notify', {
    type: 'success',
    message: 'Batch processing started in background'
  });

  for (const group of processQueue) {

    if (!isProcessing) break;

    try {

      // =========================
      // AI GENERATION PLACE
      // =========================

      // Example:
      // const metadata = await generateMetadata(...)

      const metadata = {
        title: 'Generated',
        description: 'Generated',
        tags: 'Generated'
      };

      successCount++;

      event.sender.send('batch-progress', {
        type: 'progress',
        groupId: group.id,
        status: 'completed',
        metadata
      });

    }

    catch (err) {

      event.sender.send('batch-progress', {
        type: 'progress',
        groupId: group.id,
        status: 'error',
        error: err.message
      });

      event.sender.send('notify', {
        type: 'error',
        message: `Error processing ${group.baseName}`
      });

    }

    completed++;

    event.sender.send('batch-progress', {
      type: 'stats',
      completed,
      total,
      success: successCount
    });

  }

  isProcessing = false;

  event.sender.send('batch-progress', {
    type: 'done'
  });

  // Desktop Notification
  if (Notification.isSupported()) {

    new Notification({
      title: "MetaMatrix",
      body:
        completed === total
          ? "Batch processing completed successfully"
          : "Batch processing stopped"
    }).show();

  }

  return {
    success: true
  };

});

/* =========================
   STOP BATCH
========================= */

ipcMain.handle('stop-batch', (event) => {

  isProcessing = false;

  event.sender.send('notify', {
    type: 'warning',
    message: 'Batch processing stopped'
  });

  if (Notification.isSupported()) {

    new Notification({
      title: "MetaMatrix",
      body: "Batch processing stopped by user"
    }).show();

  }

  return {
    success: true
  };

});

/* =========================
   DESKTOP NOTIFICATION
========================= */

ipcMain.handle('notify-desktop', (event, payload) => {

  if (Notification.isSupported()) {

    new Notification({
      title: payload.title || "MetaMatrix",
      body: payload.body || "Notification"
    }).show();

  }

  return {
    success: true
  };

});