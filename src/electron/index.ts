import {
	app,
	BrowserWindow,
	globalShortcut,
	ipcMain,
	Menu,
	nativeImage,
	screen,
	Tray
} from "electron";
import contextMenu from "electron-context-menu";
import { join } from "path";
import initI18n from "./i18n.js";
import { createMainWindow, createSettingsWindow } from "./createWindow.js";
import { initDatabase } from "./backend/init.js";
import { Database } from "better-sqlite3";
import { takeScreenshot } from "./backend/screenshot.js";
import { __dirname } from "./dirname.js";
import { hideDock } from "./utils/index.js";
import {
	checkFramesForEncoding,
	deleteUnnecessaryScreenshots,
	processEncodingTasks
} from "./backend/encoding.js";
import honoApp from "./server/index.js";
import { serve } from "@hono/node-server";
import { findAvailablePort } from "./utils/index.js";
import cache from "memory-cache";
import { generate as generateAPIKey } from "@alikia/random-key";
import { Scheduler } from "./backend/scheduler.js";

const i18n = initI18n();

const t = i18n.t.bind(i18n);
const port = process.env.PORT || "5173";
const dev = !app.isPackaged;
const scheduler = new Scheduler();

let tray: null | Tray = null;
let dbConnection: null | Database = null;

let mainWindow: BrowserWindow | null;
let settingsWindow: BrowserWindow | null;

function createTray() {
	const pathRoot: string = dev ? "./src/electron/assets/" : join(__dirname, "./assets/");
	const icon = nativeImage.createFromPath(pathRoot + "TrayIconTemplate@2x.png");
	icon.resize({ width: 32, height: 32 });
	tray = new Tray(pathRoot + "TrayIcon.png");
	tray.setImage(icon);

	const contextMenu = Menu.buildFromTemplate([
		{
			label: t("tray.showMainWindow"),
			click: () => {
				const display = screen.getPrimaryDisplay();
				const { width, height } = display.bounds;
				mainWindow!.show();
				mainWindow!.setAlwaysOnTop(true, "screen-saver");
				mainWindow!.setBounds({ x: 0, y: 0, width, height });
				mainWindow!.focus();
			}
		},
		{
			label: t("tray.showSettingsWindow"),
			click: () => {
				settingsWindow!.show();
			}
		},
		{ type: "separator" },
		{
			label: t("tray.quit"),
			click: () => {
				app.exit();
			}
		}
	]);

	tray.setContextMenu(contextMenu);
	tray.setToolTip("OpenRewind");
}

contextMenu({
	showLookUpSelection: true,
	showSearchWithGoogle: true,
	showCopyImage: true
});

app.once("ready", () => {
	hideDock();
});
app.on("activate", () => {});

app.on("ready", () => {
	createTray();
	findAvailablePort(12412).then((port) => {
		generateAPIKey().then((key) => {
			cache.put("server:port", port);
			if (!dev) {
				cache.put("server:APIKey", key);
			}
			serve({ fetch: honoApp.fetch, port: port });

			// Send API info to renderer
			settingsWindow?.webContents.send("api-info", {
				port,
				apiKey: key
			});
			console.log(`App server running on port ${port}`);
		});
	});
	initDatabase().then((db) => {
		scheduler.addTask("screenshot", takeScreenshot, 2000);
		scheduler.addTask("check-encoding", checkFramesForEncoding, 5000);
		scheduler.addTask("process-encoding", processEncodingTasks, 10000);
		scheduler.addTask("delete-screenshots", deleteUnnecessaryScreenshots, 20000);
		dbConnection = db;
		cache.put("server:dbConnection", dbConnection);
	});
	mainWindow = createMainWindow(port, () => (mainWindow = null));
	settingsWindow = createSettingsWindow(port, () => (settingsWindow = null));
	globalShortcut.register("Escape", () => {
		if (!mainWindow || !mainWindow.isVisible()) return;
		mainWindow.hide();
	});
});

app.on("will-quit", () => {
	dbConnection?.close();
	scheduler.stop();
});

ipcMain.on("close-settings", () => {
	settingsWindow?.hide();
});

ipcMain.handle("request-api-info", () => {
	return {
		port: cache.get("server:port"),
		apiKey: cache.get("server:APIKey")
	};
});
