import { useState } from "react";
import "./index.css";

export default function RewindPage() {
	const [currentScreenShotBase64, setScreenShotData] = useState<string | null>(null);
	window.api.receive("fromMain", (message: string) => {
		setScreenShotData(message);
	});
	return (
		<>
			<div className="w-screen h-screen relative dark:text-white">
				{currentScreenShotBase64 && (
					<img
						className="absolute top-0 left-0 z-10 w-full h-full"
						src={"data:image/png;base64," + currentScreenShotBase64}
						alt=""
					/>
				)}
				{currentScreenShotBase64 ? (
					<div
						className="rounded-xl bottom-12 left-6 fixed z-30 w-auto h-auto px-4 py-3
						bg-white bg-opacity-50 backdrop-blur-lg text-gray-800"
					>
						Here's a screenshot captured just now.
						<br />
						The relavant features has not been implemented, and you han hit Esc to quit
						this window.
						<br />
						Meow! ヽ(=^・ω・^=)丿
					</div>
				) : (
					<div
						className="rounded-xl bottom-12 left-6 fixed z-30 w-auto h-auto px-4 py-3
						bg-white bg-opacity-50 backdrop-blur-lg text-gray-800"
					>
						Now capturing a screenshot for your screen...(ง •̀_•́)ง
					</div>
				)}
			</div>
		</>
	);
}
