import { Trans } from "react-i18next";

export default function OpenSourceNote() {
	return (
		<p id="settings-note" className="text-sm text-weaken mt-3">
			<Trans i18nKey="settings.note">
				OpenRewind is open source software licensed under
				<a href="https://www.gnu.org/licenses/gpl-3.0.html">GPL 3.0</a>.<br />
				Source code is avaliable at
				<a href="https://github.com/alikia2x/openrewind">GitHub</a>.
			</Trans>
		</p>
	);
}
