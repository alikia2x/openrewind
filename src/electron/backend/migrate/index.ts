import { Database } from "better-sqlite3";
import { migrateToV2 } from "./migrateToV2.js";
import { migrateToV3 } from "./migrateToV3.js";

const CURRENT_VERSION = 3;

function migrateTo(version: number, db: Database) {
	switch (version) {
		case 2:
			migrateToV3(db);
			break;
	}
}

function getVersion(db: Database): number {
	const stmt = db.prepare(`SELECT value FROM config WHERE key = 'version';`);
	const data = stmt.get() as { value: string };
	const version = data.value;
	return parseInt(version);
}

export function migrate(db: Database) {
	const configTableExists =
		db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='config';`).get() !==
		undefined;
	if (!configTableExists) {
		migrateToV2(db);
	}
	let databaseVersion = getVersion(db);
	while (databaseVersion < CURRENT_VERSION) {
		migrateTo(databaseVersion, db);
		databaseVersion = getVersion(db);
	}
}
