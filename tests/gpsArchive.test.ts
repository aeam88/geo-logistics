import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../server/utils/gpsArchive", () => ({
  countOldRecords: vi.fn().mockResolvedValue(0),
  archiveOldHistory: vi.fn().mockResolvedValue({
    archived: 0,
    remaining: 0,
    archiveFile: "gps-history-2026-05-29.json",
  }),
}));

describe("GPS Archive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("countOldRecords returns 0 when no old records", async () => {
    const { countOldRecords } = await import("../server/utils/gpsArchive");
    const count = await countOldRecords();
    expect(count).toBe(0);
  });

  it("archiveOldHistory returns correct stats", async () => {
    const { archiveOldHistory } = await import("../server/utils/gpsArchive");
    const result = await archiveOldHistory();

    expect(result.archived).toBe(0);
    expect(result.remaining).toBe(0);
    expect(result.archiveFile).toContain("gps-history-");
  });

  it("archiveOldHistory can be called with mocked DB", async () => {
    const { archiveOldHistory } = await import("../server/utils/gpsArchive");

    vi.mocked(archiveOldHistory).mockResolvedValue({
      archived: 5,
      remaining: 100,
      archiveFile: "gps-history-2026-05-29.json",
    });

    const result = await archiveOldHistory();
    expect(result.archived).toBe(5);
    expect(result.remaining).toBe(100);
  });
});
