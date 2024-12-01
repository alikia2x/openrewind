import { useTranslation } from "react-i18next";
import "./index.css";
import { useCallback, useRef, useState } from "react";
import SettingsGroup from "components/settings/SettingsGroup.tsx";
import MenuItem from "components/settings/MenuItem.tsx";
import IconWithText from "components/settings/IconWithText.tsx";
import Title from "components/settings/Title.tsx";
import OpenSourceNote from "components/settings/OpenSourceNote.tsx";
import EnvironmentDetails from "components/settings/EnvironmentDetails.tsx";

interface SettingsGroupRefs {
	[key: string]: HTMLDivElement;
}

export default function SettingsPage() {
	const { t } = useTranslation();
	const [groupRefs, setGroupRefs] = useState<SettingsGroupRefs>({});
	const containerRef = useRef<HTMLDivElement>(null);
	const titleBarRef = useRef<HTMLDivElement>(null);

	const addGroupRef = useCallback((groupName: string, ref: HTMLDivElement) => {
		setGroupRefs((prevRefs) => {
			prevRefs[groupName] = ref;
			return prevRefs;
		});
	}, []);

	function scrollToGroup(groupName: string) {
		const key = groupName as keyof typeof groupRefs;
		console.log(groupRefs[key]);
		if (!groupRefs[key]) return;
		containerRef.current!.scrollTop = groupRefs[key].getBoundingClientRect().top -
			titleBarRef.current!.getBoundingClientRect().height;
	}

	return (
		<>
			<title>{t("settings.title")}</title>
			<div className="w-full h-auto bg-white dark:bg-gray-800 !bg-opacity-80 flex flex-col
			 dark:text-white font-semibold fixed z-10 backdrop-blur-lg text-[.9rem]" ref={titleBarRef}>
				<div className="w-full flex items-center justify-center h-9" id="title-bar">
					{t("settings.title")}
				</div>
				<div className="h-[4.5rem] pt-0 pb-2">
					<div className="w-full h-full px-20 flex items-center justify-center gap-2">
						<MenuItem
							icon="fluent:screenshot-record-28-regular"
							text={t("settings.screen")}
							onClick={() => scrollToGroup("screen")}
						/>
						<MenuItem
							icon="fluent:settings-24-regular"
							text={t("settings.about")}
							onClick={() => scrollToGroup("about")}
						/>
					</div>
				</div>
			</div>
			<div className="h-full bg-slate-100 dark:bg-gray-900 w-full scroll-smooth
				relative dark:text-white pt-28 pb-12 px-10 overflow-auto" ref={containerRef} id="settings-scroll-container">
				<SettingsGroup groupName="screen" addGroupRef={addGroupRef}>
					<Title i18nKey="settings.screen-recording"/>
					<div className="flex">
						<p>Nothing yet.</p>
					</div>
				</SettingsGroup>
				<SettingsGroup groupName="about" addGroupRef={addGroupRef}>
					<Title i18nKey={"settings.about"}/>
					<IconWithText/>
					<OpenSourceNote/>
					<EnvironmentDetails/>
				</SettingsGroup>
			</div>
		</>
	);
}
