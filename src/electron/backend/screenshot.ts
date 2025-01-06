import screenshot from "screenshot-desktop";
import { getDatabase, getScreenshotsDir } from "../utils/index.js";
import { join } from "path";
import SqlString from "sqlstring";

export function takeScreenshot() {
	const db = getDatabase();
	const timestamp = new Date().getTime();
	const screenshotDir = getScreenshotsDir();
	const filename = `${timestamp}.png`;
	const screenshotPath = join(screenshotDir, filename);
	screenshot({ filename: screenshotPath, format: "png" })
		.then(() => {
			const SQL = SqlString.format(
				"INSERT INTO frame (imgFilename, createdAt) VALUES (?, ?)",
				[filename, new Date().getTime() / 1000]
			);
			db.exec(SQL);
		})
		.catch((err) => {
			console.error(err);
		});
}
