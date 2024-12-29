import { Hono } from "hono";
import cache from "memory-cache";
import { join } from "path";
import fs from "fs";
import { Database } from "better-sqlite3";
import type { Frame } from "../backend/schema";
import { getScreenshotsDir } from "../utils/backend.js";

const app = new Hono();

app.use(async (c, next) => {
	const key = cache.get("server:APIKey");
	if (key && c.req.header("x-api-key") !== key) {
		c.res = undefined;
		c.res = c.json({ error: "Invalid API key" }, 401);
	}
	await next();
});

app.get("/ping", (c) => c.text("pong"));

app.get("/timeline", async (c) => {
	const { offset = 0, limit = 50 } = c.req.query();
	const db = cache.get("server:dbConnection");

	const frames = db
		.prepare(
			`
    SELECT id, createdAt, imgFilename, videoPath, videoFrameIndex 
    FROM frame 
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
  `
		)
		.all(limit, offset);

	return c.json(frames);
});

app.get("/frame/:id", async (c) => {
	const { id } = c.req.param();
	const db: Database = cache.get("server:dbConnection");

	const frame = db
		.prepare(
			`
    SELECT imgFilename, videoPath, videoFrameIndex 
    FROM frame 
    WHERE id = ?
  `
		)
		.get(id) as Frame;

	if (!frame) {
		return c.json({ error: "Frame not found" }, 404);
	}

	// If frame is from video, decode and return frame
	if (frame.videoPath) {
		// TODO: Implement video frame extraction
		return c.json({ error: "Video frame extraction not implemented" }, 501);
	}

	// Return image file
	const imagePath = join(getScreenshotsDir(), frame.imgFilename);
	const imageBuffer = fs.readFileSync(imagePath);
	return new Response(imageBuffer, {
		status: 200,
		headers: {
			"Content-Type": "image/png"
		}
	});
});

export default app;
