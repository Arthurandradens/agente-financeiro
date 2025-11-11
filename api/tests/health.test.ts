import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";

describe("Health endpoint", () => {
  it("should return ok: true", async () => {
    const app = await createApp();

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ ok: true });
  });
});
