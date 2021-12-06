const { app, BrowserWindow } = require("electron");
const path = require("path");
require('./public/build/ipc');

app.on("ready", () => {
    createWindow();
});

app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

function createWindow() {
    const main = new BrowserWindow({
        icon: 'public/favicon.png',
        show: false,
        minWidth: 300,
        minHeight: 320,
        webPreferences: {
            nodeIntegration: false,
            sandbox: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'public/build/preload.js')
        }
    });
    main.loadFile(path.join(__dirname, "public/index.html"));
    main.once('ready-to-show', () => {
        main.show();
        main.focus();
    });
}

