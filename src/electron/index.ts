import { app, BrowserWindow, globalShortcut, Menu, nativeImage, Tray } from "electron";
import contextMenu from "electron-context-menu";
import { join } from "path";
import initI18n from "./i18n.js";
import { createMainWindow, createSettingsWindow } from "./createWindow.js";
import { __dirname, captureScreen, getFirstCaptureScreenDeviceId } from "./utils.js";
import * as fs from "fs";

const i18n = initI18n();

const t = i18n.t.bind(i18n);
const port = process.env.PORT || "5173";
const dev = !app.isPackaged;

let tray = null;

async function c() {
	const screenshotpath = join(__dirname, "screenshot.png");
	const ffmpegPath = join(__dirname, dev ? "bin/macos/ffmpeg" : "../../bin/macos/ffmpeg");
	const deviceID = await getFirstCaptureScreenDeviceId(ffmpegPath);
	if (deviceID) {
		await captureScreen(ffmpegPath, deviceID, screenshotpath);
		const screenshotData = fs.readFileSync(screenshotpath, "base64");
		return screenshotData;
	}
	return null;
}

function createTray() {
	const pathRoot: string = dev ? "./src/electron/assets/" : join(__dirname, "./assets/");
	const icon = nativeImage.createFromPath(pathRoot + "TrayIconTemplate@2x.png");
	icon.resize({ width: 32, height: 32 });
	tray = new Tray(pathRoot + "TrayIcon.png");
	tray.setImage(icon);

	const contextMenu = Menu.buildFromTemplate([
		{
			label: t("tray.showMainWindow"),
			click: async () => {
				if (!mainWindow) mainWindow = createMainWindow(port, () => (mainWindow = null));
				mainWindow!.webContents.send("fromMain", null);
				mainWindow!.setIgnoreMouseEvents(true);
				mainWindow!.show();
				c()
					.then((data) => {
						mainWindow!.webContents.send("fromMain", data);
						mainWindow!.setIgnoreMouseEvents(false);
					})
					.catch((err) => {
						console.error(err);
					});
			}
		},
		{
			label: t("tray.showSettingsWindow"),
			click: () => {
				if (!settingsWindow)
					settingsWindow = createSettingsWindow(port, () => (settingsWindow = null));
				settingsWindow!.show();
			}
		},
		{ type: "separator" },
		{
			label: t("tray.quit"),
			click: () => {
				app.quit();
			}
		}
	]);

	tray.setContextMenu(contextMenu);
	tray.setToolTip("OpenRewind");
}

let mainWindow: BrowserWindow | null;
let settingsWindow: BrowserWindow | null;

contextMenu({
	showLookUpSelection: true,
	showSearchWithGoogle: true,
	showCopyImage: true
});

app.once("ready", () => {
	app.dock.hide();
});
app.on("activate", () => {});

app.on("ready", () => {
	createTray();
	globalShortcut.register("Escape", () => {
		if (!mainWindow) return;
		mainWindow.hide();
	});
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
