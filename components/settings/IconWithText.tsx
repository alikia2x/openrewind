// @ts-expect-error f**k ts who is expecting a f*king declaration for AN IMAGE.
import imgUrl from "public/icon.png";
import * as pjson from "package.json";
import { useTranslation } from "react-i18next";

export default function IconWithText() {
	const { t } = useTranslation();
	return (
		<div className="flex">
			<img src={imgUrl} className="h-20 w-20 mr-2" alt="OpenRewind icon" />
			<div className="flex flex-col justify-start w-auto h-[4.2rem] overflow-hidden mt-1">
				<span className="text-2xl font-semibold">OpenRewind</span>
				<span
					className="text-sm text-gray-700 dark:text-gray-200
							font-medium ml-0.5"
				>
					{t("settings.version", { version: pjson.version })}
				</span>
				<span
					className="text-xs text-gray-700 dark:text-gray-200
							font-medium ml-0.5"
				>
					{t("settings.copyright")}
				</span>
			</div>
		</div>
	);
}
