import { add } from "@masjidi/common";
import { describe, expect, it } from "vitest";

describe("add", () => {
  it("should add two numbers", () => {
    expect(add(1, 2)).toBe(3);
  });
});
