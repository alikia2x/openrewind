import { Database } from "better-sqlite3";
import { migrateToV2 } from "./migrateToV2.js";

export function migrate(db: Database) {
	const configTableExists =
		db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='config';`).get()
		!== undefined;
	if (!configTableExists) {
		migrateToV2(db);
	}
}