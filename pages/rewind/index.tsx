import "./index.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Frame } from "../../src/electron/backend/schema.d.ts";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";
import updateLocale from "dayjs/plugin/updateLocale";
import { useAtomValue } from "jotai";
import { apiInfoAtom } from "src/renderer/state/apiInfo.ts";

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(updateLocale);
dayjs.updateLocale("en", {
	relativeTime: {
		future: "in %s",
		past: "%s ago",
		s: "%d seconds",
		m: "1 minute",
		mm: "%d minutes",
		h: "1 hour",
		hh: "%d hours",
		d: "1 day",
		dd: "%d days",
		M: "1 month",
		MM: "%d months",
		y: "1 year",
		yy: "%d years"
	}
});

function Image({ src }: { src: string }) {
	return (
		<img
			src={src}
			alt="Current frame"
			className="w-full h-full object-cover absolute inset-0"
		/>
	);
}

export default function RewindPage() {
	const { port, apiKey } = useAtomValue(apiInfoAtom);
	const [timeline, setTimeline] = useState<Frame[]>([]);
	const [currentFrameId, setCurrentFrameId] = useState<number | null>(null);
	const [images, setImages] = useState<Record<number, string>>({});
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const lastRequestTime = useRef(Date.now());
	const containerRef = useRef<HTMLDivElement>(null);
	const lastAvaliableFrameId = useRef<number | null>(null);

	useEffect(() => {
		if (currentFrameId && images[currentFrameId]) {
			lastAvaliableFrameId.current = currentFrameId;
		}
	}, [images, currentFrameId]);

	// Fetch timeline data
	const fetchTimeline = useCallback(
		async (untilID?: number) => {
			if (!port) return;
			try {
				const url = new URL(`http://localhost:${port}/timeline`);
				if (untilID) {
					url.searchParams.set("untilID", untilID.toString());
				}

				const response = await fetch(url.toString(), {
					headers: {
						"x-api-key": apiKey
					}
				});
				const data = await response.json();
				setTimeline((prev) => (untilID ? [...prev, ...data] : data));
			} catch (error) {
				console.error(error);
			}
		},
		[port, apiKey]
	);

	useEffect(() => {
		fetchTimeline();
	}, [fetchTimeline]);

	const loadImage = useCallback(
		(frameId: number) => {
			if (!port) return;
			// Rate limit to at most 1 request every 200ms
			const now = Date.now();
			if (images[frameId]) return;

			lastRequestTime.current = now;
			fetch(`http://localhost:${port}/frame/${frameId}`, {
				headers: {
					"x-api-key": apiKey
				}
			})
				.then((res) => res.blob())
				.then((blob) => {
					const url = URL.createObjectURL(blob);
					setImages((prev) => ({ ...prev, [frameId]: url }));
				})
				.catch(console.error);
		},
		[apiKey, images, port]
	);

	// Load initial images
	useEffect(() => {
		if (timeline.length > 0 && !currentFrameId) {
			setCurrentFrameId(timeline[0].id);
			loadImage(timeline[0].id);
			if (timeline.length > 1) {
				loadImage(timeline[1].id);
			}
		}
	}, [timeline, currentFrameId, loadImage]);

	const lastScrollTime = useRef(Date.now());

	const handleScroll = (e: React.WheelEvent) => {
		if (!containerRef.current || !currentFrameId) return;

		// Only allow scroll changes every 80ms
		const now = Date.now();
		if (now - lastScrollTime.current < 80) return;
		lastScrollTime.current = now;

		const delta = Math.sign(e.deltaY);
		const currentIndex = timeline.findIndex((frame) => frame.id === currentFrameId);
		if (currentIndex === -1) return;

		const newIndex = Math.min(Math.max(currentIndex - delta, 0), timeline.length - 1);
		const newFrameId = timeline[newIndex].id;

		if (newFrameId !== currentFrameId) {
			setCurrentFrameId(newFrameId);
			// Preload adjacent images
			if (newIndex > 0) loadImage(timeline[newIndex - 1].id);
			if (newIndex < timeline.length - 1) loadImage(timeline[newIndex + 1].id);

			// Load more timeline data when we're near the end
			if (newIndex > timeline.length - 10 && !isLoadingMore) {
				setIsLoadingMore(true);
				const lastID = timeline[timeline.length - 1].id;
				fetchTimeline(lastID).finally(() => setIsLoadingMore(false));
			}
		}
	};

	function displayTime(time: number) {
		// if diff < 1h, fromNow()
		// else use localized format
		const diff = dayjs().diff(dayjs.unix(time), "second");
		if (diff < 3600) {
			return dayjs.unix(time).fromNow();
		} else {
			return dayjs.unix(time).format("llll");
		}
	}

	return (
		<div
			ref={containerRef}
			className="w-screen h-screen relative dark:text-white overflow-hidden"
			onWheel={handleScroll}
		>
			{/* Current image */}
			<Image
				src={
					currentFrameId
						? images[currentFrameId] ||
						  (lastAvaliableFrameId.current ? images[lastAvaliableFrameId.current] : "")
						: ""
				}
			/>

			{/* Time capsule */}
			<div
				className="absolute bottom-8 left-8 bg-zinc-800 bg-opacity-80 backdrop-blur-lg
					 rounded-full px-4 py-2 text-xl"
			>
				{currentFrameId
					? displayTime(
							timeline.find((frame) => frame.id === currentFrameId)!.createdAt
					  ) || "Loading..."
					: "Loading..."}
			</div>

			{/* Timeline */}
			<div
				className="absolute top-8 right-8 h-5/6 overflow-hidden bg-zinc-800 bg-opacity-80 backdrop-blur-lg
					 px-4 py-2 text-xl"
			>
				{timeline
					.filter((frame) => frame.id <= currentFrameId!)
					.map((frame) => (
						<div
							key={frame.id}
							className="flex items-center gap-2"
							onClick={() => {
								setCurrentFrameId(frame.id);
								loadImage(frame.id);
							}}
						>
							<span className="mt-2 text-base text-zinc-400">#{frame.id}</span>
							<span>
								{dayjs().diff(dayjs.unix(frame.createdAt), "second")} sec ago
							</span>
						</div>
					))}
			</div>
		</div>
	);
}
