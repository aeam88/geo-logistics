import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../server/utils/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.stubGlobal("createError", (opts: any) => {
  const error = new Error(opts.statusMessage);
  (error as any).statusCode = opts.statusCode;
  throw error;
});

vi.stubGlobal("toWebRequest", (event: any) => ({
  headers: new Map(Object.entries(event.headers || {})),
}));

describe("Guards - requireSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "development";
  });

  it("returns session when auth succeeds", async () => {
    const { auth } = await import("../server/utils/auth");
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: {
        id: "user-1",
        name: "Test",
        email: "test@test.com",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
        banned: false,
      },
      session: { token: "tok_123" },
    } as any);

    const { requireSession } = await import("../server/utils/guards");

    const event = {
      node: { req: { headers: {} } },
      headers: {},
    } as any;

    const result = await requireSession(event);
    expect(result.userId).toBe("user-1");
    expect(result.role).toBe("admin");
  });

  it("uses dev bypass when header present", async () => {
    const { auth } = await import("../server/utils/auth");
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const { requireSession } = await import("../server/utils/guards");

    const event = {
      node: { req: { headers: { "x-bypass-auth": "true" } } },
      headers: { "x-bypass-auth": "true" },
    } as any;

    const result = await requireSession(event);
    expect(result.userId).toBe("dev_bypass_user");
    expect(result.role).toBe("admin");
  });

  it("throws when no session and no bypass", async () => {
    const { auth } = await import("../server/utils/auth");
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const { requireSession } = await import("../server/utils/guards");

    const event = {
      node: { req: { headers: {} } },
      headers: {},
    } as any;

    await expect(requireSession(event)).rejects.toThrow("Unauthorized");
  });

  it("times out when getSession hangs", async () => {
    const { auth } = await import("../server/utils/auth");
    vi.mocked(auth.api.getSession).mockImplementation(
      () => new Promise(() => {}) // Nunca resuelve
    );

    const { requireSession } = await import("../server/utils/guards");

    const event = {
      node: { req: { headers: {} } },
      headers: {},
    } as any;

    const start = Date.now();
    await expect(requireSession(event)).rejects.toThrow("Unauthorized");
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThan(1500);
    expect(elapsed).toBeLessThan(5000);
  });
});
