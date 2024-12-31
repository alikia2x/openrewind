import path from "path";
import os from "os";
import { app } from "electron";
import { __dirname } from "../../dirname.js";

export function getUserDataDir() {
	switch (process.platform) {
		case "win32":
			return path.join(process.env.APPDATA!, "OpenRewind", "Record Data");
		case "darwin":
			return path.join(
				os.homedir(),
				"Library",
				"Application Support",
				"OpenRewind",
				"Record Data"
			);
		case "linux":
			return path.join(os.homedir(), ".config", "OpenRewind", "Record Data");
		default:
			throw new Error("Unsupported platform");
	}
}

export function hideDock() {
	if (process.platform === "darwin") {
		// Hide the dock icon on macOS
		app.dock.hide();
	}
}

export function showDock() {
	if (process.platform === "darwin") {
		// Show the dock icon on macOS
		app.dock.show();
	}
}

export function getFFmpegPath() {
	switch (process.platform) {
		case "win32":
			return path.join(__dirname, "bin", process.platform, "ffmpeg.exe");
		case "darwin":
			return path.join(__dirname, "bin", process.platform, "ffmpeg");
		case "linux":
			return path.join(__dirname, "bin", process.platform, "ffmpeg");
		default:
			throw new Error("Unsupported platform");
	}
}
