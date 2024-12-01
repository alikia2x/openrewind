import { HashRouter, Routes, Route } from "react-router-dom";
import SettingsPage from "pages/settings";
import "./i18n.ts";
import RewindPage from "pages/rewind";
import './app.css';

export function App() {
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
