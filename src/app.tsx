import { createBrowserRouter, RouterProvider } from "react-router-dom";
import SettingsPage from "pages/settings";
import "./i18n.ts";

const router = createBrowserRouter([
	{
		path: "/settings",
		element: <SettingsPage/>
	}
]);

export function App() {
	return (
		<div>
			<RouterProvider router={router} />
		</div>
	);
}
