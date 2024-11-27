import { useTranslation } from "react-i18next";

export default function SettingsPage() {
	const { t } = useTranslation();
	return (
		<div>
			<h1>{t('settings')}</h1>
		</div>
	)
}
