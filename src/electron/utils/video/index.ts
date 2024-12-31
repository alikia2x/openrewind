import { join } from "path";
import { spawn, execSync } from "child_process";
import { getRecordingsDir } from "../fs/index.js";
import { getFFmpegPath } from "../platform/index.js";
import { ENCODING_FRAME_RATE } from "../../backend/consts.js";
import cache from "memory-cache";

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
		"-ss",
		`${formatTime(frameIndex / ENCODING_FRAME_RATE)}`,
		"-i",
		`${fullVideoPath}`,
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
