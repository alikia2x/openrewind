import path from "path";
import os from "os";
import fs from "fs";
import { __dirname } from "../dirname.js";
import { execSync } from "child_process";
import cache from "memory-cache";

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
	const recordingsDir = path.join(dataDir, "recordings");
	if (!fs.existsSync(recordingsDir)) {
		fs.mkdirSync(recordingsDir, { recursive: true });
	}
	return path.join(dataDir, "recordings");
}

export function getEncodingTempDir() {
	const tempDir = createTempDir();
	const encodingTempDir = path.join(tempDir, "encoding");
	if (!fs.existsSync(encodingTempDir)) {
		fs.mkdirSync(encodingTempDir, { recursive: true });
	}
	return encodingTempDir;
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

function getBestCodec() {
	const cachedCodec = cache.get("backend:bestCodec");
	if (cachedCodec) {
		return cachedCodec;
	}
	const codecs = execSync(`${getFFmpegPath()} -codecs`).toString("utf-8");
	let codec = "";
	if (codecs.includes("h264_videotoolbox")) {
		codec = "h264_videotoolbox";
	} else {
		codec = "libx264";
	}
	cache.put("backend:bestCodec", codec);
	return codec;
}

export function getFFmpegCommand(metaFilePath: string, videoPath: string) {
	const codec = getBestCodec();
	return `${getFFmpegPath()} -f concat -safe 0 -i "${metaFilePath}" -c:v ${codec} -r 30 -y -threads 1 "${videoPath}"`;
}
