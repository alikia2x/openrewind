import * as path from "path";
import { Database } from "better-sqlite3";
import DB from "better-sqlite3";
import { __dirname } from "../dirname.js";
import { getDatabaseDir } from "../utils/backend.js";
import { migrate } from "./migrate/index.js";
import { initSchemaInV2 } from "./migrate/migrateToV2";

function getLibSimpleExtensionPath() {
    switch (process.platform) {
        case "win32":
            return path.join(__dirname, "bin", process.platform, "libsimple", "simple.dll");
        case "darwin":
            return path.join(__dirname, "bin", process.platform, "libsimple", "libsimple.dylib");
        case "linux":
            return path.join(__dirname, "bin", process.platform, "libsimple", "libsimple.so");
        default:
            throw new Error("Unsupported platform");
    }
}

function databaseInitialized(db: Database) {
	return db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='frame';`).get()
		!== undefined;
}

function init(db: Database) {
	db.exec(`
        CREATE TABLE IF NOT EXISTS frame (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            createAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            imgFilename TEXT,
            segmentID INTEGER NULL,
            videoPath TEXT NULL,
            videoFrameIndex INTEGER NULL,
            collectionID INTEGER NULL,
            encoded BOOLEAN DEFAULT 0,
            FOREIGN KEY (segmentID) REFERENCES segements (id)
        );
    `);

	db.exec(`
        CREATE TABLE IF NOT EXISTS recognition_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            frameID INTEGER,
            data TEXT,
            text TEXT,
            FOREIGN KEY (frameID) REFERENCES frame (id)
        );
    `);

	db.exec(`
        CREATE TABLE IF NOT EXISTS segements(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            startAt TIMESTAMP,
            endAt TIMESTAMP,
            title TEXT,
            appName TEXT,
            appPath TEXT,
            text TEXT,
            type TEXT,
            appBundleID TEXT NULL,
            url TEXT NULL
        );
    `);

	db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS text_search USING fts5(
            id UNINDEXED,
            frameID UNINDEXED,
            data,
            text
        );
    `);

	db.exec(`
        CREATE TRIGGER IF NOT EXISTS recognition_data_after_insert AFTER INSERT ON recognition_data
        BEGIN
            INSERT INTO text_search (id, frameID, data, text)
            VALUES (NEW.id, NEW.frameID, NEW.data, NEW.text);
        END;
    `);

	db.exec(`
        CREATE TRIGGER IF NOT EXISTS recognition_data_after_update AFTER UPDATE ON recognition_data
        BEGIN
            UPDATE text_search
            SET frameID = NEW.frameID, data = NEW.data, text = NEW.text
            WHERE id = NEW.id;
        END;
    `);

	db.exec(`
        CREATE TRIGGER IF NOT EXISTS recognition_data_after_delete AFTER DELETE ON recognition_data
        BEGIN
            DELETE FROM text_search WHERE id = OLD.id;
        END;
    `);

	initSchemaInV2(db);
}

export function initDatabase() {
	const dbPath = getDatabaseDir();
	const db = new DB(dbPath, { verbose: console.log });
	const libSimpleExtensionPath = getLibSimpleExtensionPath();

	db.loadExtension(libSimpleExtensionPath);

	if (!databaseInitialized(db)) {
		init(db);
	}
	else {
		migrate(db);
	}

	return db;
}
