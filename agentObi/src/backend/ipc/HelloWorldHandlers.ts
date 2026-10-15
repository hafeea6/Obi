import type { IpcMain } from "electron";

import { HELLO_WORLD_CHANNEL } from "../../common/ipc/HelloWorldChannel";
import { runHelloWorld } from "../services/HelloWorldService";

export const registerHelloWorldHandlers = (ipcMain: IpcMain) => {
  ipcMain.handle(HELLO_WORLD_CHANNEL, async () => runHelloWorld());
};
