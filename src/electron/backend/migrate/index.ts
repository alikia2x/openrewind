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

export function migrate(db: Database) {
	const configTableExists =
		db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='config';`).get()
		!== undefined;
	if (!configTableExists) {
		migrateToV2(db);
	}
	let databaseVersion = parseInt(
		(
			db.prepare(`SELECT value FROM config WHERE key = 'version';`).get() as
				{ value: any }
		).value
	);
	while (databaseVersion < CURRENT_VERSION) {
		migrateTo(databaseVersion, db);
		databaseVersion = parseInt(
			(
				db.prepare(`SELECT value FROM config WHERE key = 'version';`).get() as
					{ value: any }
			).value
		);
	}
}