import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

export default function EnvironmentDetails() {
	const { t } = useTranslation();
	const [electronVersion, setElectronVersion] = useState("");
	const [chromeVersion, setChromeVersion] = useState("");
	const [systemVersion, setSystemVersion] = useState("");
	const [systemDisplayVersion, setSystemDisplayVersion] = useState("");
	const [nodeVersion, setNodeVersion] = useState("");
	useEffect(() => {
		try {
			setChromeVersion(window.versions.chrome());
			setSystemVersion(window.versions.osRaw());
			setSystemDisplayVersion(window.versions.osDisplay());
			setElectronVersion(window.versions.electron());
			setNodeVersion(window.versions.node());
		} catch {
			// ignore
		}
	}, []);
	return (
		<div className="mt-2">
			<h2 className="text-xl font-bold leading-8">{t("settings.environment-details")}</h2>
			<div className="text-xs leading-5 text-weaken">
				<ul>
					<li>
						<span>{t("settings.chrome-version")}: </span>
						{chromeVersion}
					</li>
					<li>
						<span>{t("settings.electron-version")}: </span>
						{electronVersion}
					</li>
					<li>
						<span>{t("settings.node-version")}: </span>
						{nodeVersion}
					</li>
					<li>
						<span>{t("settings.os-version")}: </span>
						{systemVersion}
					</li>
					<li>
						<span>{t("settings.os")}: </span>
						{systemDisplayVersion}
					</li>
				</ul>
			</div>
		</div>
	);
}
