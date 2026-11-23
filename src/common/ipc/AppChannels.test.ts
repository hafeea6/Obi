import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import { APP_CHANNELS } from "./AppChannels";

const channelEntries = Object.entries(APP_CHANNELS);

describe("APP_CHANNELS (property-based)", () => {
  it("every channel is namespaced as app:<camelCaseName>", () => {
    fc.assert(
      fc.property(fc.constantFrom(...channelEntries), ([, channel]) => {
        expect(channel).toMatch(/^app:[a-z][a-zA-Z0-9]*$/);
      }),
    );
  });

  it("no two keys map to the same channel", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...channelEntries),
        fc.constantFrom(...channelEntries),
        ([keyA, a], [keyB, b]) => {
          if (keyA !== keyB) expect(a).not.toBe(b);
        },
      ),
    );
  });
});
