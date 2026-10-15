import { contextBridge, ipcRenderer } from "electron";

import { APP_CHANNELS } from "../../common/ipc/AppChannels";

/**
 * The client for the Hello World IPC functionality.
 */
const helloWorldClient = {
  runHelloWorld: () => ipcRenderer.invoke(APP_CHANNELS.HELLO_WORLD),
};

/**
 * Exposes the Hello World client to the renderer process via the context bridge.
 */
export const exposeHelloWorldClient = () => {
  contextBridge.exposeInMainWorld("helloWorld", helloWorldClient);
};
