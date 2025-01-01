import { join } from "path";
import os from "os";
import { app } from "electron";
import { __dirname } from "../../dirname.js";
import { logger } from "../index.js";

export function getUserDataDir() {
	switch (process.platform) {
		case "win32":
			return join(process.env.APPDATA!, "OpenRewind", "Record Data");
		case "darwin":
			return join(
				os.homedir(),
				"Library",
				"Application Support",
				"OpenRewind",
				"Record Data"
			);
		case "linux":
			return join(os.homedir(), ".config", "OpenRewind", "Record Data");
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
	let path = "";
	switch (process.platform) {
		case "win32":
			path = join(__dirname, "bin", process.platform, "ffmpeg.exe");
			break;
		case "darwin":
			path = join(__dirname, "bin", process.platform, "ffmpeg");
			break;
		case "linux":
			path = join(__dirname, "bin", process.platform, "ffmpeg");
			break;
		default:
			throw new Error("Unsupported platform");
	}
	logger.info("FFmpeg path: %s", path);
	return path;
}
