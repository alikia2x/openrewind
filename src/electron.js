import windowStateManager from 'electron-window-state';
import { app, BrowserWindow, screen,ipcMain, globalShortcut, Tray, Menu } from 'electron';
import contextMenu from 'electron-context-menu';
import serve from 'electron-serve';

let tray = null

function createTray() {
    // 创建托盘图标
    tray = new Tray('./assets/icon.png')

    // 创建托盘菜单
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '显示主窗口',
            click: () => {
                if (!mainWindow) createMainWindow();
                mainWindow.show();
            }
        },
        {
            label: '显示设置',
            click: () => {
                if (!settingsWindow) createSettingsWindow();
                settingsWindow.show();
            }
        },
        { type: 'separator' },
        {
            label: '退出',
            click: () => {
                app.quit()
            }
        }
    ])

    // 设置托盘的上下文菜单
    tray.setContextMenu(contextMenu)

    // 设置托盘的提示文字
    tray.setToolTip('我的应用程序')

    // 点击托盘图标时显示主窗口
    // tray.on('click', () => {
    //     mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    // })
}

const serveURL = serve({ directory: '.' });
const port = process.env.PORT || "5173";
const dev = !app.isPackaged;

let mainWindow;
let settingsWindow;


function createSettingsWindow() {
    const window = new BrowserWindow({
        width: 400,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
    });
    window.once('ready-to-show', () => {
        window.show();
        window.focus();
    });

    settingsWindow = window;

    if (dev) loadVite(window ,port, "settings");
    else serveURL(mainWindow);
}

contextMenu({
    showLookUpSelection: true,
    showSearchWithGoogle: true,
    showCopyImage: true,
});

function loadVite(window, port, path = "") {
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

    if (dev) loadVite(port);
    else serveURL(mainWindow);
}

app.once('ready', () => {
    app.dock.hide();
});
app.on('activate', () => {
});

app.on('ready', () => {
    createTray();
    globalShortcut.register('Escape', () => {
        mainWindow.hide();
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('to-main', (_event, count) => {
    return mainWindow.webContents.send('from-main', `next count is ${count + 1}`);
});