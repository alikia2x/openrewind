import path, { join } from "path";
import os from "os";
import fs from "fs";
import { __dirname } from "../dirname.js";
import { execSync, spawn } from "child_process";
import cache from "memory-cache";
import { exec } from "child_process";
import { ENCODING_FRAME_RATE } from "../backend/consts.js";

const DECODE_CONCURRENCY = 1;

function getTasksPerforming() {
	return (cache.get("backend:extractFramesTasksPerforming") as string[]) || [];
}

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

export function getDecodingTempDir() {
	const tempDir = createTempDir();
	const decodingTempDir = path.join(tempDir, "decoding");
	if (!fs.existsSync(decodingTempDir)) {
		fs.mkdirSync(decodingTempDir, { recursive: true });
	}
	return decodingTempDir;
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

export function getEncodeCommand(metaFilePath: string, videoPath: string) {
	const codec = getBestCodec();
	return `${getFFmpegPath()} -f concat -safe 0 -i "${metaFilePath}" -c:v ${codec} -r ${ENCODING_FRAME_RATE} -y -threads 1 "${videoPath}"`;
}

/**
 * Extracts frames from a video file using FFmpeg
 *
 * @async
 * @param {string} videoFilename - The name of the video file to extract frames from
 * @param {number|null} startIndex - The starting frame index (inclusive). If null, starts from first frame
 * @param {number|null} endIndex - The ending frame index (inclusive). If null, goes to last frame
 * @param {string|null} outputPath - The output path for the extracted frames
 */
export async function extractFramesFromVideo(
	videoFilename: string,
	startIndex: number | null,
	endIndex: number | null,
	outputPath: string = ".",
	format: "png" | "bmp" = "png"
) {
	const tasksPerforming = getTasksPerforming();
	if (tasksPerforming.length >= DECODE_CONCURRENCY) {
		console.log(`Reached concurrency limit (${DECODE_CONCURRENCY}), skipping extraction`);
		return;
	}

	const taskId = `${videoFilename}-${startIndex}-${endIndex}`;
	cache.put("backend:extractFramesTasksPerforming", [...tasksPerforming, taskId]);
	const fullVideoPath = join(getRecordingsDir(), videoFilename);

	const beginTimeArg =
		startIndex !== null ? `-ss ${formatTime(startIndex / ENCODING_FRAME_RATE)}` : "";
	const endTimeArg = endIndex !== null ? `-to ${formatTime(endIndex / ENCODING_FRAME_RATE)}` : "";

	let videoFilter = "";
	if (startIndex !== null && endIndex !== null) {
		videoFilter = `select='between(n\\,${startIndex}\\,${endIndex})'`;
	} else if (startIndex !== null) {
		videoFilter = `select='gte(n\\,${startIndex})'`;
	} else if (endIndex !== null) {
		videoFilter = `select='lte(n\\,${endIndex})'`;
	}

	const bareVideoFilename = videoFilename.split(".").slice(0, -1).join(".");
	const outputPathArg = join(outputPath, `${bareVideoFilename}_%04d.${format}`);

	const command = [
		getFFmpegPath(),
		beginTimeArg,
		endTimeArg,
		`-i "${fullVideoPath}"`,
		videoFilter ? `-vf ${videoFilter}` : "",
		`-start_number ${startIndex || 0}`,
		`"${outputPathArg}"`
	]
		.filter((arg) => arg !== "")
		.join(" ");

	exec(command, (error, _stdout, _stderr) => {
		if (error) {
			console.error(`FFmpeg error: ${error.message}`);
		}
		const tasksPerforming = getTasksPerforming();
		cache.put(
			"backend:extractFramesTasksPerforming",
			tasksPerforming.filter((id) => id !== taskId)
		);
	});
}

export function immediatelyExtractFrameFromVideo(
	videoFilename: string,
	frameIndex: number,
	outputPath = "."
) {
	const bareVideoFilename = videoFilename.split(".").slice(0, -1).join(".");
	const fullVideoPath = join(getRecordingsDir(), videoFilename);
	const outputFilename = `${bareVideoFilename}_${frameIndex.toString().padStart(4, "0")}.bmp`;
	const outputPathArg = join(outputPath, outputFilename);
	const args = [
		"-i",
		`${fullVideoPath}`,
		"-ss",
		`${formatTime(frameIndex / ENCODING_FRAME_RATE)}`,
		"-vframes",
		"1",
		`${outputPathArg}`
	];
	const ffmpeg = spawn("ffmpeg", args);
	ffmpeg.stdout.on("data", (data) => {
		console.log(data.toString());
	});

	ffmpeg.stderr.on("data", (data) => {
		console.log(data.toString());
	});
	ffmpeg.on("exit", (code) => {
		if (code !== 0) {
			console.error("Error extracting frame:", code);
		}
	});
	return outputFilename;
}

function formatTime(seconds: number): string {
	// Calculate hours, minutes, seconds, and milliseconds
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);
	const milliseconds = Math.round((seconds % 1) * 1000);

	// Format the output with leading zeros
	const formattedTime =
		[
			String(hours).padStart(2, "0"),
			String(minutes).padStart(2, "0"),
			String(secs).padStart(2, "0")
		].join(":") +
		"." +
		String(milliseconds).padStart(3, "0");

	return formattedTime;
}

export async function waitForFileExists(filePath: string, timeout: number = 10000): Promise<void> {
	return new Promise((resolve, reject) => {
		fs.access(filePath, fs.constants.F_OK, (err) => {
			if (!err) {
				resolve();
				return;
			}

			const dir = path.dirname(filePath);
			const filename = path.basename(filePath);

			const watcher = fs.watch(dir, (eventType, watchedFilename) => {
				if (eventType === "rename" && watchedFilename === filename) {
					fs.access(filePath, fs.constants.F_OK, (err) => {
						if (!err) {
							clearTimeout(timeoutId);
							watcher.close();
							resolve();
						}
					});
				}
			});

			watcher.on("error", (err) => {
				clearTimeout(timeoutId);
				watcher.close();
				reject(err);
			});

			const timeoutId = setTimeout(() => {
				watcher.close();
				reject(new Error(`Timeout: File ${filePath} did not exist within ${timeout}ms`));
			}, timeout);
		});
	});
}
