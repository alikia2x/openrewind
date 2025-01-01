import { app, BrowserWindow, screen } from "electron";
import { join } from "path";
import { __dirname } from "./dirname.js";
import windowStateManager from "electron-window-state";
import { hideDock, showDock } from "./utils/index.js";

function loadURL(window: BrowserWindow, path = "", vitePort: string) {
	const dev = !app.isPackaged;
	if (dev) {
		window.loadURL(`http://localhost:${vitePort}/#${path}`).catch((e) => {
			console.log("Error loading URL:", e);
		});
	} else {
		window
			.loadFile(join(__dirname, "../renderer/index.html"), {
				hash: path
			})
			.catch((e) => {
				console.log("Error loading URL:", e);
			});
	}
}

export function createSettingsWindow(vitePort: string, closeCallBack: () => void) {
	const windowState = windowStateManager({
		defaultWidth: 650,
		defaultHeight: 550
	});
	const enableFrame = process.platform === "darwin";
	let icon;
	switch (process.platform) {
		case "darwin":
			icon = undefined;
			break;
		case "win32":
			icon = join(__dirname, "assets/icon.ico");
			break;
		case "linux":
			icon = join(__dirname, "assets/icon.png");
			break;
		default:
			icon = undefined;
	}
	const window = new BrowserWindow({
		width: 650,
		height: 550,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: true,
			preload: join(__dirname, "preload/settings.cjs")
		},
		titleBarStyle: "hiddenInset",
		resizable: false,
		show: false,
		frame: enableFrame,
		icon: icon
	});
	windowState.manage(window);
	window.on("show", () => {
		showDock();
	});
	window.on("close", (e) => {
		window.hide();
		windowState.saveState(window);
		e.preventDefault();
		closeCallBack();
	});
	window.once("close", () => {
		window.hide();
		hideDock();
	});
	loadURL(window, "settings", vitePort);
	return window;
}

export function createMainWindow(vitePort: string, closeCallBack: () => void) {
	const display = screen.getPrimaryDisplay();
	const { width, height } = display.bounds;
	const windowState = windowStateManager({
		defaultWidth: width,
		defaultHeight: height
	});

	const window = new BrowserWindow({
		width,
		height,
		x: 0,
		y: 0,
		frame: false,
		resizable: false,
		fullscreenable: false,
		alwaysOnTop: true,
		skipTaskbar: true,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: true,
			preload: join(__dirname, "preload/rewind.cjs")
		},
		roundedCorners: false,
		transparent: true,
		show: false,
		title: "OpenRewind Rewind Page"
	});

	// Exclude the window from the recording
	window.setContentProtection(true);

	windowState.manage(window);

	window.on("close", () => {
		windowState.saveState(window);
		closeCallBack();
	});
	window.once("close", () => {
		closeCallBack();
	});

	loadURL(window, "rewind", vitePort);
	return window;
}
