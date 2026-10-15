import { contextBridge, ipcRenderer } from "electron";

import { HELLO_WORLD_CHANNEL } from "../../common/ipc/HelloWorldChannel";

/**
 * The client for the Hello World IPC functionality.
 */
const helloWorldClient = {
  runHelloWorld: () => ipcRenderer.invoke(HELLO_WORLD_CHANNEL),
};

/**
 * Exposes the Hello World client to the renderer process via the context bridge.
 */
export const exposeHelloWorldClient = () => {
  contextBridge.exposeInMainWorld("helloWorld", helloWorldClient);
};
