import { Database } from "better-sqlite3";

function convertTimestampToUnix(timestamp: string): number {
	const date = new Date(timestamp);
	const now = new Date();
	const offsetInMinutes = now.getTimezoneOffset();
	const offsetInSeconds = offsetInMinutes * 60;
	return date.getTime() / 1000 - offsetInSeconds;
}

function transformEncodingTask(db: Database) {
	const createTableSql = `
		CREATE TABLE IF NOT EXISTS encoding_task_new (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			createdAt REAL,
			status INT DEFAULT 0
		);
		
		INSERT INTO encoding_task_new (id, createdAt, status)
			SELECT id, createdAt, status FROM encoding_task;
		DROP TABLE encoding_task;
		ALTER TABLE encoding_task_new RENAME TO encoding_task;
		ALTER TABLE encoding_task ADD COLUMN createdAt_new REAL;
	`;
	db.exec(createTableSql);

	const rows = db.prepare(`SELECT id, createdAt FROM encoding_task`).all() as { [x: string]: unknown; id: unknown; }[];
	const updateStmt = db.prepare(`UPDATE encoding_task SET createdAt_new = ? WHERE id = ?`);
	rows.forEach((row) => {
		const unixTimestamp = convertTimestampToUnix(row.createdAt as string);
		updateStmt.run(unixTimestamp, row.id);
	});

	db.exec(`
		ALTER TABLE encoding_task DROP COLUMN createdAt;
		ALTER TABLE encoding_task RENAME COLUMN createdAt_new TO createdAt;
	`);
}

function transformFrame(db: Database) {
	const createTableSql = `
		CREATE TABLE frame_new(
			  id INTEGER PRIMARY KEY AUTOINCREMENT,
			  createdAt REAL,
			  imgFilename TEXT,
			  segmentID INTEGER NULL,
			  videoPath TEXT NULL,
			  videoFrameIndex INTEGER NULL,
			  collectionID INTEGER NULL,
			  encodeStatus INT DEFAULT 0,
			  FOREIGN KEY (segmentID) REFERENCES segments (id)
		);
		INSERT INTO frame_new (id, createdAt, imgFilename, segmentID, videoPath, videoFrameIndex, collectionID, encodeStatus)
			SELECT id, createdAt, imgFilename, segmentID, videoPath, videoFrameIndex, collectionID, encodeStatus FROM frame;
		DROP TABLE frame;
		ALTER TABLE frame_new RENAME TO frame;
		ALTER TABLE frame ADD COLUMN createdAt_new REAL;
	`
	db.exec(createTableSql);

	const rows = db.prepare(`SELECT id, createdAt FROM frame`).all() as { [x: string]: unknown; id: unknown; }[];
	const updateStmt = db.prepare(`UPDATE frame SET createdAt_new = ? WHERE id = ?`);
	rows.forEach((row) => {
		const unixTimestamp = convertTimestampToUnix(row.createdAt as string);
		updateStmt.run(unixTimestamp, row.id);
	});

	db.exec(`
		ALTER TABLE frame DROP COLUMN createdAt;
		ALTER TABLE frame RENAME COLUMN createdAt_new TO createdAt;
	`);
}

function transformSegments(db: Database) {
	db.exec(`
		CREATE TABLE IF NOT EXISTS segments_new(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            startedAt REAL,
            endedAt REAL,
            title TEXT,
            appName TEXT,
            appPath TEXT,
            text TEXT,
            type TEXT,
            appBundleID TEXT NULL,
            url TEXT NULL
        );
		INSERT INTO segments_new (id, startedAt, endedAt, title, appName, appPath, text, type, appBundleID, url)
			SELECT id, startedAt, endedAt, title, appName, appPath, text, type, appBundleID, url FROM segments;
		DROP TABLE segments;
		ALTER TABLE segments_new RENAME TO segments;
		ALTER TABLE segments ADD COLUMN startedAt_new REAL;
		ALTER TABLE segments ADD COLUMN endedAt_new REAL;		
	`);
	const rows = db.prepare(`SELECT id, startedAt, endedAt FROM segments`).all() as { [x: string]: unknown; id: unknown; }[];
	const updateStart = db.prepare(`UPDATE segments SET startedAt_new = ? WHERE id = ?`);
	const updateEnd = db.prepare(`UPDATE segments SET endedAt_new = ? WHERE id = ?`);
	rows.forEach((row) => {
		updateStart.run(convertTimestampToUnix(row.startedAt as string), row.id);
		updateEnd.run(convertTimestampToUnix(row.endedAt as string), row.id);
	});

	db.exec(`
		ALTER TABLE segments DROP COLUMN startedAt;
		ALTER TABLE segments DROP COLUMN endedAt;
		ALTER TABLE segments RENAME COLUMN startedAt_new TO startedAt;
		ALTER TABLE segments RENAME COLUMN endedAt_new TO endedAt;
	`);
}

function renameColumn(tableName: string, oldColumnName: string, newColumnName: string, db: Database) {
	if (db.prepare(`SELECT 1 FROM pragma_table_info(?) WHERE name=?`).get([tableName, oldColumnName])) {
		db.exec(`ALTER TABLE ${tableName} RENAME COLUMN ${oldColumnName} TO ${newColumnName};`);
	}
}

export function migrateToV3(db: Database) {
	db.prepare(`ALTER TABLE segements RENAME TO segments`).run();
	db.exec(`
		PRAGMA foreign_keys = OFF;
		CREATE TABLE frame_new(
			  id INTEGER PRIMARY KEY AUTOINCREMENT,
			  createAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			  imgFilename TEXT,
			  segmentID INTEGER NULL,
			  videoPath TEXT NULL,
			  videoFrameIndex INTEGER NULL,
			  collectionID INTEGER NULL,
			  encodeStatus INT DEFAULT 0,
			  FOREIGN KEY (segmentID) REFERENCES segments (id)
		);
		INSERT INTO frame_new (id, createAt, imgFilename, segmentID, videoPath, videoFrameIndex, collectionID, encodeStatus)
			SELECT id, createAt, imgFilename, segmentID, videoPath, videoFrameIndex, collectionID, encodeStatus FROM frame;
		DROP TABLE frame;
		ALTER TABLE frame_new RENAME TO frame;

		CREATE TABLE encoding_task_data_new (
		  encodingTaskID INTEGER,
		  frame ID INTEGER PRIMARY KEY,
		  FOREIGN KEY (encodingTaskID) REFERENCES encoding_task(id),
		  FOREIGN KEY (frame) REFERENCES frame(id)
		);

		INSERT INTO encoding_task_data SELECT * FROM encoding_task_data_new;
		DROP TRIGGER delete_encoding_task;
		DROP TABLE encoding_task_data;

		ALTER TABLE encoding_task_data_new RENAME TO encoding_task_data;

		CREATE TRIGGER IF NOT EXISTS delete_encoding_task
		  AFTER UPDATE OF status
		  ON encoding_task
		  BEGIN
			DELETE FROM encoding_task_data
			WHERE encodingTaskID = OLD.id AND NEW.status = 2;

			DELETE FROM encoding_task
			WHERE id = OLD.id AND NEW.status = 2;
		  END;

		CREATE TABLE recognition_data_new (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			frameID INTEGER,
			data TEXT,
			text TEXT,
			FOREIGN KEY (frameID) REFERENCES frame (id)
		);

		INSERT INTO recognition_data SELECT * FROM recognition_data_new;
		DROP TABLE recognition_data;
		ALTER TABLE recognition_data_new RENAME TO recognition_data;

		PRAGMA foreign_keys = ON;
	`);

	renameColumn('encoding_task', 'createAt', 'createdAt', db);
	renameColumn('frame', 'createAt', 'createdAt', db);
	renameColumn('segments', 'startAt', 'startedAt', db);
	renameColumn('segments', 'endAt', 'endedAt', db);
	if (db.prepare(`SELECT 1 FROM pragma_table_info('frame') WHERE name='encoded'`).get()) {
		db.prepare(`ALTER TABLE frame DROP COLUMN encoded`).run();
	}

	transformSegments(db);
	transformFrame(db);
	transformEncodingTask(db);

	db.exec(`
		UPDATE config SET value = '3' WHERE key = 'version';
	`);
}