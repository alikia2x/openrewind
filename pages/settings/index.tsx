import {useTranslation} from "react-i18next";
import "src/renderer/app.css";
import * as pjson from "package.json";

export default function SettingsPage() {
	const {t} = useTranslation();
	return (
		<>
			<title>{t('settings')}</title>
			<div className="w-full h-9 bg-white dark:bg-gray-800 !bg-opacity-80 flex items-center justify-center
			 dark:text-white font-semibold fixed z-10 backdrop-blur-lg text-[.9rem]" id="title-bar">
				{t('settings')}
			</div>
			<div className="bg-white dark:bg-gray-900 w-full min-h-screen relative dark:text-white pt-16 px-10">
				<h1 className="text-3xl font-bold leading-[3rem]">About</h1>
				<h2 className="text-lg">OpenRewind</h2>
				<span className="text-sm font-semibold">Version: {pjson.version}</span>
			</div>
		</>
	)
}
