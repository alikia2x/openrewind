const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("appGlobal", {
	requestApiInfo: () => ipcRenderer.invoke("request-api-info")
});
