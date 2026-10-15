import type { IpcMain } from "electron";

import { APP_CHANNELS } from "../../common/ipc/AppChannels";
import { HelloWorldService } from "../services/HelloWorldService";

const helloWorldService = new HelloWorldService();

/**
 * Registers the IPC handlers for the Hello World functionality.
 */
export const registerHelloWorldHandlers = (ipcMain: IpcMain) => {
  ipcMain.handle(APP_CHANNELS.HELLO_WORLD, async () =>
    helloWorldService.runHelloWorld(),
  );
};
