import { Database } from 'better-sqlite3';
import { exec } from 'child_process';
import fs from 'fs';
import path, { join } from "path";
import type { EncodingTask, Frame } from "./schema";
import sizeOf from "image-size";
import { getScreenshotsDir } from "../utils/backend.js";

const ENCODING_INTERVAL = 10000; // 10 sec
const CHECK_TASK_INTERVAL = 5000; // 5 sec
const MIN_FRAMES_TO_ENCODE = 300; // At least 10 mins (0.5fps)
const CONCURRENCY = 1; // Number of concurrent encoding tasks

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

// TODO: Fix this function
// Check and process encoding task
function processEncodingTasks(db: Database) {
	const stmt = db.prepare(`
        SELECT id, status
        FROM encoding_task
        WHERE status = 0
        LIMIT ?
    `);

	const tasks = stmt.all(CONCURRENCY) as EncodingTask[];

	for (const task of tasks) {
		const taskId = task.id;

		// Update task status as processing (1)
		const updateStmt = db.prepare(`
            UPDATE encoding_task SET status = 1 WHERE id = ?
        `);
		updateStmt.run(taskId);

		const framesStmt = db.prepare(`
            SELECT frame.imgFilename
            FROM encoding_task_data
            JOIN frame ON encoding_task_data.frame = frame.id
            WHERE encoding_task_data.encodingTaskID = ?
            ORDER BY frame.createAt ASC
        `);
		const frames = framesStmt.all(taskId) as Frame[];

		const metaFilePath = path.join(__dirname, `${taskId}_meta.txt`);
		const metaContent = frames.map(frame => `file '${frame.imgFilename}'`).join('\n');
		fs.writeFileSync(metaFilePath, metaContent);

		const videoName = `video_${taskId}.mp4`;
		const ffmpegCommand = `ffmpeg -f concat -safe 0 -i ${metaFilePath} -c:v libx264 -r 30 ${videoName}`;
		exec(ffmpegCommand, (error, stdout, stderr) => {
			if (error) {
				console.error(`FFmpeg error: ${error.message}`);
				// Set task status to unprocessed (0)
				const failStmt = db.prepare(`
                    UPDATE encoding_task SET status = 0 WHERE id = ?
                `);
				failStmt.run(taskId);
			} else {
				console.log(`Video ${videoName} created successfully`);
				// Update task status to complete (2)
				const completeStmt = db.prepare(`
                    UPDATE encoding_task SET status = 2 WHERE id = ?
                `);
				completeStmt.run(taskId);
			}

			fs.unlinkSync(metaFilePath);
		});
	}
}