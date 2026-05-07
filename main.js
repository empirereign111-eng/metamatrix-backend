const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let serverProcess;

/* =========================
   START BACKEND
========================= */
function startBackend() {

  serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, 'src', 'server'),
    shell: true,
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`SERVER: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`SERVER ERROR: ${data}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`SERVER CLOSED: ${code}`);
  });
}

/* =========================
   CREATE WINDOW
========================= */
function createWindow() {

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,

    autoHideMenuBar: true,
    title: 'MetaMatrix',

    icon: path.join(__dirname, 'icon.ico'),

    backgroundColor: '#0B0314',

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
    },
  });

  /* =========================
     LOAD PRODUCTION BUILD
  ========================= */

  const indexPath = path.join(
    __dirname,
    'dist',
    'index.html'
  );

  win.loadFile(indexPath);

  /* =========================
     ERROR HANDLING
  ========================= */

  win.webContents.on('did-fail-load', () => {
    console.log('❌ Failed to load UI');
  });

  win.webContents.on(
    'render-process-gone',
    (event, details) => {
      console.log(
        '❌ Renderer crashed:',
        details
      );
    }
  );
}

/* =========================
   APP READY
========================= */

app.whenReady().then(() => {

  // START BACKEND
  startBackend();

  // WAIT SERVER START
  setTimeout(() => {
    createWindow();
  }, 3000);

  app.on('activate', () => {

    if (
      BrowserWindow.getAllWindows().length === 0
    ) {
      createWindow();
    }

  });
});

/* =========================
   CLOSE APP
========================= */

app.on('window-all-closed', () => {

  // KILL BACKEND
  if (serverProcess) {
    serverProcess.kill();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});