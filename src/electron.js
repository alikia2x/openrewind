import windowStateManager from 'electron-window-state';
import { app, BrowserWindow, ipcMain, screen, globalShortcut } from 'electron';
import contextMenu from 'electron-context-menu';
import serve from 'electron-serve';

try {
    require('electron-reloader')(module);
} catch (e) {
    console.error(e);
}

const serveURL = serve({ directory: '.' });
const port = process.env.PORT || 5173;
const dev = !app.isPackaged;
let mainWindow;

function createWindow() {
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.bounds;
    let windowState = windowStateManager({
        defaultWidth: width,
        defaultHeight: height,
    });

    const mainWindow = new BrowserWindow({
        width,
        height,
        x: 0,
        y: 0,
        frame: false,
        resizable: false,
        fullscreenable: false,
        transparent: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        roundedCorners: false
    });

    windowState.manage(mainWindow);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
        mainWindow.setBounds({ x: 0, y: 0, width, height });
        mainWindow.focus();
    });

    mainWindow.on('close', () => {
        windowState.saveState(mainWindow);
    });

    return mainWindow;
}

contextMenu({
    showLookUpSelection: true,
    showSearchWithGoogle: true,
    showCopyImage: true,
});

function loadVite(port) {
    mainWindow.loadURL(`http://localhost:${port}`).catch((e) => {
        console.log('Error loading URL, retrying', e);
        setTimeout(() => {
            loadVite(port);
        }, 200);
    });
}

function createMainWindow() {
    mainWindow = createWindow();
    mainWindow.once('close', () => {
        mainWindow = null;
    });

    if (dev) loadVite(port);
    else serveURL(mainWindow);
}

app.once('ready', createMainWindow);
app.on('activate', () => {
    if (!mainWindow) {
        createMainWindow();
    }
});
app.on('ready', () => {
    globalShortcut.register('Escape', () => {
        app.quit();
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('to-main', (event, count) => {
    return mainWindow.webContents.send('from-main', `next count is ${count + 1}`);
});