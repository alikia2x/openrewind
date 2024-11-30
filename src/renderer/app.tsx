import { createBrowserRouter, RouterProvider } from "react-router-dom";
import SettingsPage from "pages/settings";
import "./i18n.ts";
import RewindPage from "../../pages/rewind";

const router = createBrowserRouter([
	{
		path: "/settings",
		element: <SettingsPage/>
	},
	{
		path: "/rewind",
		element: <RewindPage/>
	}
]);

export function App() {
	return (
		<div className="w-screen h-screen">
			<RouterProvider router={router}/>
		</div>
	);
}
