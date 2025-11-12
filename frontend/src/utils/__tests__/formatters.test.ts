import { describe, it, expect } from "vitest";
import { formatBytes, formatPercentage, formatDuration, formatNumber, truncate } from "../formatters";

describe("formatBytes", () => {
  it("formats 0 bytes", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
  });

  it("formats bytes", () => {
    expect(formatBytes(100)).toBe("100 Bytes");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(2048)).toBe("2 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
  });

  it("respects decimal places", () => {
    expect(formatBytes(1536, 0)).toBe("2 KB");
    expect(formatBytes(1536, 2)).toBe("1.5 KB");
    expect(formatBytes(1536, 3)).toBe("1.5 KB");
  });
});

describe("formatPercentage", () => {
  it("formats percentage with no decimals by default", () => {
    expect(formatPercentage(75)).toBe("75%");
    expect(formatPercentage(50.5)).toBe("51%");
  });

  it("formats percentage with decimals", () => {
    expect(formatPercentage(75.5, 1)).toBe("75.5%");
    expect(formatPercentage(33.333, 2)).toBe("33.33%");
  });

  it("formats 0%", () => {
    expect(formatPercentage(0)).toBe("0%");
  });

  it("formats 100%", () => {
    expect(formatPercentage(100)).toBe("100%");
  });
});

describe("formatDuration", () => {
  it("formats seconds", () => {
    expect(formatDuration(30)).toBe("30s");
    expect(formatDuration(59)).toBe("59s");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(60)).toBe("1m 0s");
    expect(formatDuration(90)).toBe("1m 30s");
    expect(formatDuration(3599)).toBe("59m 59s");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(3600)).toBe("1h 0m");
    expect(formatDuration(3660)).toBe("1h 1m");
    expect(formatDuration(7200)).toBe("2h 0m");
  });

  it("formats 0 seconds", () => {
    expect(formatDuration(0)).toBe("0s");
  });
});

describe("formatNumber", () => {
  it("formats small numbers", () => {
    expect(formatNumber(100)).toBe("100");
  });

  it("formats thousands with separator", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(10000)).toBe("10,000");
  });

  it("formats millions", () => {
    expect(formatNumber(1000000)).toBe("1,000,000");
  });

  it("formats 0", () => {
    expect(formatNumber(0)).toBe("0");
  });
});

describe("truncate", () => {
  it("does not truncate short strings", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates long strings", () => {
    expect(truncate("hello world", 5)).toBe("hello...");
    expect(truncate("this is a long string", 10)).toBe("this is a ...");
  });

  it("handles exact length", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("handles empty string", () => {
    expect(truncate("", 5)).toBe("");
  });
});
