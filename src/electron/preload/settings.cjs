const { contextBridge } = require('electron')
const os = require('os');
const osName = require('./os-name.cjs');

contextBridge.exposeInMainWorld('versions', {
	node: () => process.versions.node,
	chrome: () => process.versions.chrome,
	electron: () => process.versions.electron,
	osRaw: () => {
		return `${os.platform()} ${os.release()}`;
	},
	osDisplay: osName
})