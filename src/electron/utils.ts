import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";

export const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getFirstCaptureScreenDeviceId(ffmpegPath: string): Promise<string | null> {
	return new Promise((resolve, reject) => {
		exec(`${ffmpegPath} -f avfoundation -list_devices true -i ""`, (error, stdout, stderr) => {
			// stderr contains the output we need to parse
			const output = stderr;
			const captureScreenRegex = /\[(\d+)]\s+Capture screen \d+/g;
			const match = captureScreenRegex.exec(output);

			if (match) {
				resolve(match[1]);
			} else {
				resolve(null);
			}
		});
	});
}

export function captureScreen(ffmpegPath: string ,deviceId: string, outputPath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		exec(`${ffmpegPath} -f avfoundation -pixel_format uyvy422 -i ${deviceId} -y -frames:v 1 ${outputPath}`,
			(error, _stdout, _stderr) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			});
	});
}
