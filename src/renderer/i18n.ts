import * as en from "i18n/en.json";
import * as zh from "i18n/zh-CN.json";
import * as ja from "i18n/ja.json";
import * as de from "i18n/de.json";
import * as es from "i18n/es.json";
import * as fr from "i18n/fr.json";
import * as it from "i18n/it.json";
import * as ko from "i18n/ko.json";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ICU from "i18next-icu";
i18n.use(initReactI18next) // passes i18n down to react-i18next
	.use(LanguageDetector)
	.use(ICU)
	.init({
		resources: {
			en: {
				translation: en
			},
			zh: {
				translation: zh
			},
			ja: {
				translation: ja
			},
			de: {
				translation: de
			},
			es: {
				translation: es
			},
			fr: {
				translation: fr
			},
			it: {
				translation: it
			},
			ko: {
				translation: ko
			},
		},
		fallbackLng: "en",

		interpolation: {
			escapeValue: false // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
		},

		detection: {
			order: ["navigator"],
			caches: []
		}
	});
