import screenshot from "screenshot-desktop";
import { getScreenshotsPath } from "../utils/backend.js";
import { join } from "path";
import { Database }from "better-sqlite3";
import SqlString from "sqlstring";

export function startScreenshotLoop(db: Database) {
	return setInterval(() => {
		const timestamp = new Date().getTime();
		const screenshotPath = getScreenshotsPath();
		const filename = join(screenshotPath, `${timestamp}.png`);
		screenshot({filename: filename}).then((absolutePath) => {
			const SQL = SqlString.format(
				"INSERT INTO frame (imgFilename) VALUES (?)",
				[absolutePath]
			);
			db.exec(SQL);
		}).catch((err) => {
			console.error(err);
		});
	}, 2000);
}

