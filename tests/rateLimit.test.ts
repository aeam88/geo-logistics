import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "../server/utils/rateLimit";

vi.stubGlobal("getRequestIP", (event: any, opts?: any) => {
  return event.headers?.["x-forwarded-for"] || "127.0.0.1";
});

function createMockEvent(ip = "127.0.0.1"): any {
  return {
    headers: { "x-forwarded-for": ip },
  };
}

describe("Rate Limiter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows first request", () => {
    const event = createMockEvent();
    const result = checkRateLimit(event, {
      maxRequests: 5,
      windowMs: 60000,
      keyPrefix: "test-allow",
    });

    expect(result.allowed).toBe(true);
    expect(result.retryAfter).toBe(0);
  });

  it("blocks after exceeding limit", () => {
    const event = createMockEvent();

    for (let i = 0; i < 5; i++) {
      checkRateLimit(event, {
        maxRequests: 5,
        windowMs: 60000,
        keyPrefix: "test-block",
      });
    }

    const result = checkRateLimit(event, {
      maxRequests: 5,
      windowMs: 60000,
      keyPrefix: "test-block",
    });

    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("uses different keys for different prefixes", () => {
    const event = createMockEvent();

    for (let i = 0; i < 3; i++) {
      checkRateLimit(event, { maxRequests: 3, windowMs: 60000, keyPrefix: "prefix-a" });
    }

    const result = checkRateLimit(event, {
      maxRequests: 3,
      windowMs: 60000,
      keyPrefix: "prefix-b",
    });

    expect(result.allowed).toBe(true);
  });

  it("resets after window expires", async () => {
    const event = createMockEvent();

    for (let i = 0; i < 2; i++) {
      checkRateLimit(event, { maxRequests: 2, windowMs: 100, keyPrefix: "test-expire" });
    }

    await new Promise((resolve) => setTimeout(resolve, 150));

    const result = checkRateLimit(event, {
      maxRequests: 2,
      windowMs: 100,
      keyPrefix: "test-expire",
    });

    expect(result.allowed).toBe(true);
  });
});
