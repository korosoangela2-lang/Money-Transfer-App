import { money, round2, initials, rateFmt, monthKey } from "./format.js";

describe("money", () => {
  test("formats CAD with the $ symbol and two decimals by default", () => {
    expect(money(1284.5)).toBe("CA$ 1,284.50");
  });

  test("formats a zero-decimal currency (UGX) without decimals", () => {
    expect(money(256699.5, "UGX")).toBe("USh 256,700");
  });

  test("falls back to CAD for an unknown currency code", () => {
    expect(money(10, "XYZ")).toBe("CA$ 10.00");
  });
});

describe("round2", () => {
  test("rounds to two decimal places", () => {
    expect(round2(1.005)).toBeCloseTo(1, 2);
    expect(round2(2.675)).toBeCloseTo(2.68, 2);
    expect(round2(10)).toBe(10);
  });
});

describe("initials", () => {
  test("takes the first letter of the first two words", () => {
    expect(initials("Emmanuel Koroso")).toBe("EK");
  });

  test("handles a single name", () => {
    expect(initials("Wanjiru")).toBe("W");
  });

  test("handles empty input", () => {
    expect(initials("")).toBe("");
    expect(initials()).toBe("");
  });
});

describe("rateFmt", () => {
  test("formats to four decimal places", () => {
    expect(rateFmt(110.98)).toBe("110.9800");
  });
});

describe("monthKey", () => {
  test("returns a short month abbreviation for an ISO date", () => {
    expect(monthKey("2026-03-15T12:00:00.000Z")).toBe("Mar");
  });
});
