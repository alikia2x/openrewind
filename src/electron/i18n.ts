import { join } from "path";
import i18n from "i18next";
import fs from "fs";
import { app } from "electron";
import { __dirname } from "./dirname.js";


/**
 * Selects the appropriate language based on system preferences and available languages
 *
 * @param langs Array of available language codes
 * @param fallback Fallback language code to use if no match is found
 * @returns Selected language code
 */
export function detectLanguage(langs: string[], fallback: string): string {
	// Get the system locale using Electron's app API
	// Note: This assumes the function is used in the main process
	const systemLanguage = app.getPreferredSystemLanguages()[0];

	// Normalize the system locale (convert to lowercase and replace hyphens/underscores)
	const normalizedLang = systemLanguage.toLowerCase().split("-")[0];

	// Find a matching language
	const matchedLanguage = langs.find(lang => {
		if (lang.indexOf(normalizedLang) !== -1) {
			return lang;
		}
	});

	// Return matched language or fallback
	return matchedLanguage || fallback;
}

export default function initI18n() {
	const languages = ["en", "de", "es", "fr", "it", "ja", "ar", "ko", "zh-CN"];

	const l = detectLanguage(languages, "en");

	const resources = languages.reduce((acc: { [key: string]: { translation: any } }, lang) => {
		acc[lang] = {
			translation: JSON.parse(fs.readFileSync(join(__dirname, `./i18n/${lang}.json`), "utf8"))
		};
		return acc;
	}, {});

	i18n.init({
		resources,
		lng: l,
		fallbackLng: "en",
		interpolation: {
			escapeValue: false // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
		}
	});
	return i18n;
}

