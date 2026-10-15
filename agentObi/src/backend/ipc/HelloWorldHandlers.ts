import type { IpcMain } from "electron";

import { HELLO_WORLD_CHANNEL } from "../../common/ipc/HelloWorldChannel";
import { HelloWorldService } from "../services/HelloWorldService";

const helloWorldService = new HelloWorldService();

/**
 * Registers the IPC handlers for the Hello World functionality.
 */
export const registerHelloWorldHandlers = (ipcMain: IpcMain) => {
  ipcMain.handle(HELLO_WORLD_CHANNEL, async () =>
    helloWorldService.runHelloWorld(),
  );
};
