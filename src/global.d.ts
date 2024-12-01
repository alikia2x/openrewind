interface Window {
	versions: {
		electron: () => string;
		chrome: () => string;
		node: () => string;
		osRaw: () => string;
		osDisplay: () => string;
	};
	electron: {
		getScreenshot: () =>  Promise<string>;
	}
	api: {
	    send: (channel: any, data: any) => void,
		receive: (channel: any, func: any) => void
	}
}