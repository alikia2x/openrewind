import { Hono } from "hono";
import { cors } from "hono/cors";
import cache from "memory-cache";
import { join } from "path";
import fs from "fs";
import { Database } from "better-sqlite3";
import type { Frame } from "../backend/schema";
import {
	getDecodingTempDir,
	getRecordingsDir,
	getScreenshotsDir,
	waitForFileExists
} from "../utils/fs/index.js";
import { immediatelyExtractFrameFromVideo } from "../utils/video/index.js";
import { existsSync } from "fs";

const app = new Hono();

app.use("*", cors());

app.use(async (c, next) => {
	const key = cache.get("server:APIKey");
	if (key && c.req.header("x-api-key") !== key) {
		c.res = undefined;
		c.res = c.json({ error: "Invalid API key" }, 401);
	}
	await next();
});

app.get("/ping", (c) => c.text("pong"));

function getLatestFrames(db: Database, limit = 50): Frame[] {
	return db
		.prepare(
			`
    SELECT id, createdAt, imgFilename, videoPath, videoFrameIndex 
    FROM frame
    ORDER BY createdAt DESC
    LIMIT ?
  `
		)
		.all(limit) as Frame[];
}

function getFramesUntilID(db: Database, untilID: number, limit = 50): Frame[] {
	return db
		.prepare(
			`
    SELECT id, createdAt, imgFilename, videoPath, videoFrameIndex 
    FROM frame
	WHERE id < ?
    ORDER BY createdAt DESC
    LIMIT ?
  `
		)
		.all(untilID, limit) as Frame[];
}

app.get("/timeline", async (c) => {
	const query = c.req.query();
	const limit = parseInt(query.limit) || undefined;
	const db = cache.get("server:dbConnection");
	if (query.untilID) {
		return c.json(getFramesUntilID(db, parseInt(query.untilID), limit));
	} else {
		return c.json(getLatestFrames(db, limit));
	}
});

app.get("/frame/:id", async (c) => {
	const { id } = c.req.param();
	const db: Database = cache.get("server:dbConnection");

	const frame = db
		.prepare(
			`
				SELECT imgFilename, videoPath, videoFrameIndex, createdAt
				FROM frame 
				WHERE id = ?
			`
		)
		.get(id) as Frame | undefined;

	if (!frame) return c.json({ error: "Frame not found" }, 404);

	const decodingTempDir = getDecodingTempDir();
	const screenshotsDir = getScreenshotsDir();
	const videoFilename = frame.videoPath;
	const frameIndex = frame.videoFrameIndex;
	const imageFilename = frame.imgFilename;
	const bareVideoFilename = videoFilename?.replace(".mp4", "") || null;
	const decodedImage = frameIndex
		? `${bareVideoFilename}_${frameIndex.toString().padStart(4, "0")}.bmp`
		: null;
	let returnImagePath = "";

	let needToBeDecoded = videoFilename !== null && frameIndex !== null && !frame.imgFilename;
	if (decodedImage && fs.existsSync(join(getDecodingTempDir(), decodedImage))) {
		needToBeDecoded = false;
		returnImagePath = join(decodingTempDir, decodedImage);
	} else if (imageFilename && fs.existsSync(join(screenshotsDir, imageFilename))) {
		returnImagePath = join(screenshotsDir, imageFilename);
	}

	if (needToBeDecoded) {
		const videoExists = fs.existsSync(join(getRecordingsDir(), videoFilename!));

		if (!videoExists) {
			return c.json({ error: "Video not found" }, { status: 404 });
		}

		const decodedFilename = immediatelyExtractFrameFromVideo(
			videoFilename!,
			frameIndex!,
			decodingTempDir
		);
		const decodedPath = join(decodingTempDir, decodedFilename);

		await waitForFileExists(decodedPath);

		if (existsSync(decodedPath)) {
			const imageBuffer = fs.readFileSync(decodedPath);
			return new Response(imageBuffer, {
				status: 200,
				headers: {
					"Content-Type": "image/bmp"
				}
			});
		} else {
			return c.json({ error: "Frame cannot be decoded" }, { status: 500 });
		}
	} else {
		const imageBuffer = fs.readFileSync(returnImagePath);
		const imageMimeType = imageFilename?.endsWith(".png") ? "image/png" : "image/jpeg";
		return new Response(imageBuffer, {
			status: 200,
			headers: {
				"Content-Type": imageMimeType
			}
		});
	}
});

export default app;
