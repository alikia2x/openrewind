import { app } from "electron";

export function hideDock(){
    if (process.platform === 'darwin') {
        // Hide the dock icon on macOS
        app.dock.hide();
    }
}

export function showDock(){
    if (process.platform === 'darwin') {
        // Show the dock icon on macOS
        app.dock.show();
    }
}