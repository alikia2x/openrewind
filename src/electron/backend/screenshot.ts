import screenshot from "screenshot-desktop";
import { getScreenshotsDir } from "../utils/backend.js";
import { join } from "path";
import { Database }from "better-sqlite3";
import SqlString from "sqlstring";

export function startScreenshotLoop(db: Database) {
	return setInterval(() => {
		const timestamp = new Date().getTime();
		const screenshotDir = getScreenshotsDir();
		const filename = `${timestamp}.png`;
		const screenshotPath = join(screenshotDir, filename);
		screenshot({filename: screenshotPath, format: "png"}).then((absolutePath) => {
			const SQL = SqlString.format(
				"INSERT INTO frame (imgFilename) VALUES (?)",
				[filename]
			);
			db.exec(SQL);
		}).catch((err) => {
			console.error(err);
		});
	}, 2000);
}

