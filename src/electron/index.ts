import windowStateManager from 'electron-window-state';
import { app, BrowserWindow, screen,ipcMain, globalShortcut, Tray, Menu, nativeImage } from 'electron';
import contextMenu from 'electron-context-menu';
import { join } from "path";
import i18n from "i18next";
import "./i18n.js";
const t = i18n.t;

const port = process.env.PORT || "5173";
const dev = !app.isPackaged;

let tray = null

function createTray() {
    const pathRoot: string = dev ? "./src/electron/assets/" : "./assets/";
    const icon = nativeImage.createFromPath(pathRoot + 'TrayIconTemplate@2x.png');
    icon.resize({ width: 32, height: 32 })
    tray = new Tray(pathRoot + 'TrayIcon.png');
    tray.setImage(icon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: t('tray.showMainWindow'),
            click: () => {
                if (!mainWindow) createMainWindow();
                mainWindow!.show();
            }
        },
        {
            label: t('tray.showSettingsWindow'),
            click: () => {
                if (!settingsWindow) createSettingsWindow();
                settingsWindow!.show();
            }
        },
        { type: 'separator' },
        {
            label: t('tray.quit'),
            click: () => {
                app.quit()
            }
        }
    ])

    tray.setContextMenu(contextMenu)
    tray.setToolTip('OpenRewind')
}

let mainWindow: BrowserWindow | null;
let settingsWindow: BrowserWindow | null;


function createSettingsWindow() {
    const window = new BrowserWindow({
        width: 650,
        height: 550,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true
        },
        titleBarStyle: 'hiddenInset',
        resizable: false,
    });
    window.once('ready-to-show', () => {
        window.show();
        window.focus();
    });

    settingsWindow = window;

    if (dev) loadVite(window ,port, "settings");
    else settingsWindow.loadFile(join(__dirname, '../renderer/index.html/settings'));
}

contextMenu({
    showLookUpSelection: true,
    showSearchWithGoogle: true,
    showCopyImage: true,
});

function loadVite(window: BrowserWindow, port: string | undefined, path = "") {
    console.log(`http://localhost:${port}/${path}`);
    window.loadURL(`http://localhost:${port}/${path}`).catch((e) => {
        console.log('Error loading URL, retrying', e);
        setTimeout(() => {
            loadVite(window, port, path);
        }, 1000);
    });
}

function createMainWindow() {
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.bounds;
    let windowState = windowStateManager({
        defaultWidth: width,
        defaultHeight: height,
    });

    const window = new BrowserWindow({
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

    windowState.manage(window);

    window.once('ready-to-show', () => {
        window.show();
        window.setAlwaysOnTop(true, 'screen-saver');
        window.setBounds({ x: 0, y: 0, width, height });
        window.focus();
    });

    window.on('close', () => {
        windowState.saveState(window);
    });
    window.once('close', () => {
        mainWindow = null;
    });

    mainWindow = window;

    if (dev) loadVite(window, port, "rewind");
    else mainWindow.loadFile(join(__dirname, '../renderer/index.html/rewind'));
}

app.once('ready', () => {
    app.dock.hide();
});
app.on('activate', () => {
});

app.on('ready', () => {
    createTray();
    globalShortcut.register('Escape', () => {
        if (!mainWindow) return;
        mainWindow.hide();
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('to-main', (_event, count) => {
    if (!mainWindow) return;
    return mainWindow.webContents.send('from-main', `next count is ${count + 1}`);
});