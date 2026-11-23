import type { IpcMain, IpcMainInvokeEvent } from "electron";
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import { APP_CHANNELS } from "../../common/ipc/AppChannels";
import { registerHelloWorldHandlers } from "./HelloWorldHandlers";

type Handler = (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown;

/** Minimal IpcMain stand-in that records registered handlers. */
const createFakeIpcMain = () => {
  const handlers = new Map<string, Handler>();
  const ipcMain = {
    handle: (channel: string, handler: Handler) => {
      handlers.set(channel, handler);
    },
  } as unknown as IpcMain;
  return { ipcMain, handlers };
};

describe("registerHelloWorldHandlers (property-based)", () => {
  it("registers only the hello world channel", () => {
    const { ipcMain, handlers } = createFakeIpcMain();
    registerHelloWorldHandlers(ipcMain);
    expect([...handlers.keys()]).toEqual([APP_CHANNELS.HELLO_WORLD]);
  });

  it("returns the greeting regardless of what arguments the renderer sends", async () => {
    const { ipcMain, handlers } = createFakeIpcMain();
    registerHelloWorldHandlers(ipcMain);
    const handler = handlers.get(APP_CHANNELS.HELLO_WORLD);
    expect(handler).toBeDefined();

    await fc.assert(
      fc.asyncProperty(fc.array(fc.anything()), async (args) => {
        const event = {} as IpcMainInvokeEvent;
        await expect(handler?.(event, ...args)).resolves.toBe("Hello, world!");
      }),
    );
  });
});
