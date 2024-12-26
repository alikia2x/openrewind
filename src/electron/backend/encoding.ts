import { Database } from "better-sqlite3";
import { exec } from "child_process";
import fs from "fs";
import path, { join } from "path";
import type { EncodingTask, Frame } from "./schema";
import sizeOf from "image-size";
import { getEncodingTempDir, getRecordingsDir, getScreenshotsDir } from "../utils/backend.js";
import cache from "memory-cache";

const FRAME_RATE = 0.5;
const THREE_MINUTES = 180;
const MIN_FRAMES_TO_ENCODE = THREE_MINUTES * FRAME_RATE;
const CONCURRENCY = 1;

// Detect and insert encoding tasks
export function checkFramesForEncoding(db: Database) {
	const stmt = db.prepare(`
        SELECT id, imgFilename, createdAt
        FROM frame
        WHERE encodeStatus = 0
        ORDER BY createdAt ASC;
    `);
	const frames = stmt.all() as Frame[];

	const buffer: Frame[] = [];

	if (frames.length < MIN_FRAMES_TO_ENCODE) return;

	for (let i = 1; i < frames.length; i++) {
		const frame = frames[i];
		const lastFrame = frames[i - 1];
		const currentFrameSize = sizeOf(join(getScreenshotsDir(), frame.imgFilename));
		const lastFrameSize = sizeOf(join(getScreenshotsDir(), lastFrame.imgFilename));
		const twoFramesHaveSameSize =
			currentFrameSize.width === lastFrameSize.width
			&& currentFrameSize.height === lastFrameSize.height;
		const bufferIsBigEnough = buffer.length >= MIN_FRAMES_TO_ENCODE;
		const chunkConditionSatisfied = !twoFramesHaveSameSize || bufferIsBigEnough;
		buffer.push(lastFrame);
		if (chunkConditionSatisfied) {
			// Create new encoding task
			const taskStmt = db.prepare(`
				INSERT INTO encoding_task (status) VALUES (0);
			`);
			const taskId = taskStmt.run().lastInsertRowid;

			// Insert frames into encoding_task_data
			const insertStmt = db.prepare(`
				INSERT INTO encoding_task_data (encodingTaskID, frame) VALUES (?, ?);
			`);
			for (const frame of buffer) {
				insertStmt.run(taskId, frame.id);
				db.prepare(`
					UPDATE frame SET encodeStatus = 1 WHERE id = ?;
				`).run(frame.id);
			}
			console.log(`Created encoding task ${taskId} with ${buffer.length} frames`);
			buffer.length = 0;
		}
	}
}

export async function deleteEncodedScreenshots(db: Database) {
	const stmt = db.prepare(`
	    SELECT * FROM frame WHERE encodeStatus = 2 AND imgFilename IS NOT NULL;
	`);
	const frames = stmt.all() as Frame[];
	for (const frame of frames) {
		fs.unlinkSync(path.join(getScreenshotsDir(), frame.imgFilename));
		const updateStmt = db.prepare(`
			UPDATE frame SET imgFilename = NULL WHERE id = ?;
		`);
		updateStmt.run(frame.id);
	}
}

// Check and process encoding task
export function processEncodingTasks(db: Database) {
	const tasksPerforming = cache.get("tasksPerforming") as string[] || [];
	if (tasksPerforming.length >= CONCURRENCY) return;

	const stmt = db.prepare(`
        SELECT id, status
        FROM encoding_task
        WHERE status = 0
        LIMIT ?
    `);

	const tasks = stmt.all(CONCURRENCY - tasksPerforming.length) as EncodingTask[];

	for (const task of tasks) {
		const taskId = task.id;
		// Create transaction
		db.prepare(`BEGIN TRANSACTION;`).run();

		// Update task status as processing (1)
		const updateStmt = db.prepare(`
            UPDATE encoding_task SET status = 1 WHERE id = ?
        `);
		updateStmt.run(taskId);

		const framesStmt = db.prepare(`
            SELECT frame.imgFilename, frame.id
            FROM encoding_task_data
            JOIN frame ON encoding_task_data.frame = frame.id
            WHERE encoding_task_data.encodingTaskID = ?
            ORDER BY frame.createdAt ASC
        `);
		const frames = framesStmt.all(taskId) as Frame[];

		const metaFilePath = path.join(getEncodingTempDir(), `${taskId}_meta.txt`);
		const metaContent = frames.map(frame => `file '${path.join(getScreenshotsDir(), frame.imgFilename)}'\nduration 0.03333`).join("\n");
		fs.writeFileSync(metaFilePath, metaContent);
		cache.put("tasksPerforming", [...tasksPerforming, taskId.toString()]);

		const videoPath = path.join(getRecordingsDir(), `${taskId}.mp4`);
		const ffmpegCommand = `ffmpeg -f concat -safe 0 -i "${metaFilePath}" -c:v libx264 -r 30 -threads 1 "${videoPath}"`;
		console.log("FFMPEG", ffmpegCommand);
		exec(ffmpegCommand, (error, _stdout, _stderr) => {
			if (error) {
				console.error(`FFmpeg error: ${error.message}`);
				// Roll back transaction
				db.prepare(`ROLLBACK;`).run();
			} else {
				console.log(`Video ${videoPath} created successfully`);
				// Update task status to complete (2)
				const completeStmt = db.prepare(`
                    UPDATE encoding_task SET status = 2 WHERE id = ?
                `);
				completeStmt.run(taskId);
				for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
					const frame = frames[frameIndex];
					const updateFrameStmt = db.prepare(`
					    UPDATE frame SET videoPath = ?, videoFrameIndex = ?, encodeStatus = 2 WHERE id = ?
					`);
					updateFrameStmt.run(`${taskId}.mp4`, frameIndex, frame.id);
				}
				db.prepare(`COMMIT;`).run();

			}
			cache.put("tasksPerforming", tasksPerforming.filter(id => id !== taskId.toString()));
			fs.unlinkSync(metaFilePath);
		});
	}
}