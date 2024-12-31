import { HashRouter, Routes, Route } from "react-router-dom";
import SettingsPage from "pages/settings";
import "./i18n.ts";
import RewindPage from "pages/rewind";
import "./app.css";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { apiInfoAtom } from "./state/apiInfo.ts";

declare global {
	interface Window {
		appGlobal: {
			requestApiInfo: () => Promise<{ port: number; apiKey: string }>;
		};
	}
}

export function App() {
	const [apiInfo, setApiInfo] = useAtom(apiInfoAtom);

	useEffect(() => {
		const fetchApiInfo = async () => {
			try {
				const info = await window.appGlobal.requestApiInfo();
				setApiInfo(info);
			} catch (error) {
				console.error("Failed to fetch API info:", error);
			}
		};

		fetchApiInfo();
	}, [setApiInfo]);

	if (!apiInfo) {
		return null;
	}

	return (
		<div className="w-screen h-screen">
			<HashRouter>
				<Routes>
					<Route path="/settings" element={<SettingsPage />} />
					<Route path="/rewind" element={<RewindPage />} />
				</Routes>
			</HashRouter>
		</div>
	);
}
