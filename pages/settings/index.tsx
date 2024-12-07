import { useTranslation } from "react-i18next";
import "./index.css";
import { useCallback, useRef, useState } from "react";
import SettingsGroup from "components/settings/SettingsGroup.tsx";
import MenuItem from "components/settings/MenuItem.tsx";
import IconWithText from "components/settings/IconWithText.tsx";
import Title from "components/settings/Title.tsx";
import OpenSourceNote from "components/settings/OpenSourceNote.tsx";
import EnvironmentDetails from "components/settings/EnvironmentDetails.tsx";

function showFrame() {
	return navigator.userAgent.includes("Mac");
}

interface SettingsGroupRefs {
	[key: string]: HTMLDivElement;
}

function TitleBar() {
	const { t } = useTranslation();
	if (showFrame()) {
		return (
			<div className="w-full flex items-center justify-center h-9" id="title-bar">
				{t("settings.title")}
			</div>
		);
	} else {
		return (
			<div className="w-full h-9">
				<div
					className="w-[calc(100%-44px)] h-9 absolute left-[22px] flex justify-center"
					id="title-bar"
				>
					<span className="self-center">{t("settings.title")}</span>
				</div>
				<div
					className="z-50 absolute right-2.5 top-2.5 bg-red-500 hover:bg-rose-400 h-3 w-3 rounded-full"
					onClick={() => {
						console.log(window.settingsWindow)
						window.settingsWindow.close();
					}}
				>
					<svg
						className="hover:opacity-100 opacity-0"
						xmlns="http://www.w3.org/2000/svg"
						width="12"
						height="12"
						viewBox="0 0 24 24"
					>
						<path
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeWidth="2"
							d="m8.464 15.535l7.072-7.07m-7.072 0l7.072 7.07"
						/>
					</svg>
				</div>
			</div>
		);
	}
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
		containerRef.current!.scrollTop =
			groupRefs[key].getBoundingClientRect().top -
			titleBarRef.current!.getBoundingClientRect().height;
	}

	return (
		<>
			<title>{t("settings.title")}</title>
			<div
				className="w-full h-auto bg-white dark:bg-gray-800 !bg-opacity-80 flex flex-col
			 dark:text-white font-semibold fixed z-10 backdrop-blur-lg text-[.9rem]"
				ref={titleBarRef}
			>
				<TitleBar />
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
			<div
				className="h-full bg-slate-100 dark:bg-gray-900 w-full scroll-smooth
				relative dark:text-white pt-28 pb-12 px-10 overflow-auto"
				ref={containerRef}
				id="settings-scroll-container"
			>
				<SettingsGroup groupName="screen" addGroupRef={addGroupRef}>
					<Title i18nKey="settings.screen-recording" />
					<div className="flex">
						<p>Nothing yet.</p>
					</div>
				</SettingsGroup>
				<SettingsGroup groupName="about" addGroupRef={addGroupRef}>
					<Title i18nKey={"settings.about"} />
					<IconWithText />
					<OpenSourceNote />
					<EnvironmentDetails />
				</SettingsGroup>
			</div>
		</>
	);
}
