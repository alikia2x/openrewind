import { Database } from "better-sqlite3";
import cache from "memory-cache";

export function getDatabase(): Database {
	return cache.get("server:dbConnection");
}
