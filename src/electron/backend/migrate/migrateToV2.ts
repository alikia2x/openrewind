import { Database } from "better-sqlite3";

interface OldFrame {
	id: number;
	createAt: string;
	imgFilename: string;
	segmentID: number | null;
	videoPath: string | null;
	videoFrameIndex: number | null;
	collectionID: number | null;
	encoded: number;
}

function initSchemaInV2(db: Database) {
	db.exec(`
		CREATE TABLE config (
			key TEXT PRIMARY KEY,
			value TEXT
		);
	`);

	db.exec(`
		CREATE TABLE IF NOT EXISTS encoding_task (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			createAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			status INT DEFAULT 0
		);
	`);

	db.exec(`
		CREATE TABLE IF NOT EXISTS encoding_task_data (
			encodingTaskID INTEGER,
			frame ID INTEGER PRIMARY KEY,
			FOREIGN KEY (encodingTaskID) REFERENCES encoding_task(id),
			FOREIGN KEY (frame) REFERENCES frame(id)
		);				
	`);

	db.exec(`
		CREATE TRIGGER IF NOT EXISTS delete_encoding_task 
		AFTER UPDATE OF status
		ON encoding_task
		BEGIN
		  DELETE FROM encoding_task_data
		  WHERE encodingTaskID = OLD.id AND NEW.status = 2;
		
		  DELETE FROM encoding_task
		  WHERE id = OLD.id AND NEW.status = 2;
		END;
	`);

	db.exec(`
		INSERT INTO config (key, value) VALUES ('version', '2');
	`);
}

/*
 * This function assumes that the database does not contain the "config" table,
 * and thus needs to be migrated to Version 2.
 * */
export function migrateToV2(db: Database) {
	initSchemaInV2(db);

	// Oh we saved tens of millions of bytes for user!
	// Before: /Users/username/Library/Application Support/OpenRewind/Record Data/temp/screenshots/1733568609960.jpg
	// After: 1733568609960.jpg
	const rows = db.prepare("SELECT id, imgFilename FROM frame").all() as OldFrame[];
	rows.forEach((row) => {
		const filename = row.imgFilename.match(/[^\\/]+$/)?.[0];

		if (filename) {
			db.prepare("UPDATE frame SET imgFilename = ? WHERE id = ?").run(filename, row.id);
		}
	});

	db.exec(`
		ALTER TABLE frame ADD encodeStatus INT DEFAULT 0;
		UPDATE frame SET encodeStatus = CASE WHEN encoded THEN 2 ELSE 0 END;
	`);
}
