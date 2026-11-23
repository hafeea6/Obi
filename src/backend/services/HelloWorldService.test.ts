import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import { HelloWorldService } from "./HelloWorldService";

describe("HelloWorldService (property-based)", () => {
  it("always resolves to the same greeting, however many times it is called", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 50 }), async (calls) => {
        const service = new HelloWorldService();
        const results = await Promise.all(
          Array.from({ length: calls }, () => service.runHelloWorld()),
        );
        expect(new Set(results)).toEqual(new Set(["Hello, world!"]));
      }),
    );
  });

  it("is independent of the instance it is called on", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 2, max: 20 }), async (instances) => {
        const services = Array.from(
          { length: instances },
          () => new HelloWorldService(),
        );
        const results = await Promise.all(
          services.map((s) => s.runHelloWorld()),
        );
        expect(results.every((r) => r === results[0])).toBe(true);
      }),
    );
  });
});
