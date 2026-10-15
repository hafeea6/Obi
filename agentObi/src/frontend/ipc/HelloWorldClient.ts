import { contextBridge, ipcRenderer } from "electron";

import { HELLO_WORLD_CHANNEL } from "../../common/ipc/HelloWorldChannel";

const helloWorldClient = {
  runHelloWorld: () => ipcRenderer.invoke(HELLO_WORLD_CHANNEL),
};

export const exposeHelloWorldClient = () => {
  contextBridge.exposeInMainWorld("helloWorld", helloWorldClient);
};
