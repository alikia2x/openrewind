import path from "path";
import os from "os";
import fs from "fs";

export function getUserDataDir() {
	switch (process.platform) {
		case "win32":
			return path.join(process.env.APPDATA!, "OpenRewind", "Record Data");
		case "darwin":
			return path.join(os.homedir(), "Library", "Application Support", "OpenRewind", "Record Data");
		case "linux":
			return path.join(os.homedir(), ".config", "OpenRewind", "Record Data");
		default:
			throw new Error("Unsupported platform");
	}
}

export function createDataDir() {
	const dataDir = getUserDataDir();
	if (!fs.existsSync(dataDir)) {
		fs.mkdirSync(dataDir, { recursive: true });
	}
	return dataDir;
}

export function createTempDir() {
	const tempDir = path.join(getUserDataDir(), "temp");
	if (!fs.existsSync(tempDir)) {
		fs.mkdirSync(tempDir, { recursive: true });
	}
	return tempDir;
}

export function getDatabaseDir() {
	const dataDir = createDataDir();
	return path.join(dataDir, "main.db");
}

export function getScreenshotsDir() {
	const tempDir = createTempDir();
	const screenshotsDir = path.join(tempDir, "screenshots");
	if (!fs.existsSync(screenshotsDir)) {
		fs.mkdirSync(screenshotsDir, { recursive: true });
	}
	return screenshotsDir;
}

export function getRecordingsDir() {
	const dataDir = createDataDir();
	return path.join(dataDir, "recordings");
}