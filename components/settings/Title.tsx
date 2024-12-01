import { useTranslation } from "react-i18next";

const Title = ({ i18nKey }: { i18nKey: string }) => {
	const { t } = useTranslation();
	return (
		<h1 className="text-3xl font-bold leading-[3rem]">{t(i18nKey)}</h1>
	);
}

export default Title;