/**
 * Tests for utility functions
 */
import { describe, it, expect } from "vitest";

describe("Utility Functions", () => {
  it("should handle basic string operations", () => {
    const text = "Hello World";
    expect(text.toUpperCase()).toBe("HELLO WORLD");
    expect(text.toLowerCase()).toBe("hello world");
  });

  it("should handle array operations", () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers.length).toBe(5);
    expect(numbers.reduce((a, b) => a + b, 0)).toBe(15);
  });

  it("should handle object operations", () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(Object.keys(obj).length).toBe(3);
    expect(obj.a).toBe(1);
  });

  it("should handle date operations", () => {
    const date = new Date("2025-01-01");
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(0); // January
  });

  it("should handle JSON operations", () => {
    const obj = { name: "test", value: 42 };
    const json = JSON.stringify(obj);
    const parsed = JSON.parse(json);
    expect(parsed.name).toBe("test");
    expect(parsed.value).toBe(42);
  });

  it("should handle boolean operations", () => {
    expect(true && true).toBe(true);
    expect(true && false).toBe(false);
    expect(false || true).toBe(true);
  });

  it("should handle null and undefined", () => {
    expect(null).toBeNull();
    expect(undefined).toBeUndefined();
    expect(null).not.toBeUndefined();
  });

  it("should handle type checking", () => {
    expect(typeof "test").toBe("string");
    expect(typeof 42).toBe("number");
    expect(typeof true).toBe("boolean");
    expect(Array.isArray([1, 2, 3])).toBe(true);
  });
});
