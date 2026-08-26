import { PRICING, quote } from "./pricing.js";

describe("quote", () => {
  test("charges the percentage fee, clamped to the floor", () => {
    const q = quote(10, 100); // 10 * 0.009 = 0.09, below feeMin
    expect(q.fee).toBe(PRICING.feeMin);
  });

  test("clamps the fee to the cap on large amounts", () => {
    const q = quote(10000, 100); // 10000 * 0.009 = 90, above feeCap
    expect(q.fee).toBe(PRICING.feeCap);
  });

  test("charges a plain percentage fee in the unclamped range", () => {
    const q = quote(100, 100);
    expect(q.fee).toBeCloseTo(100 * PRICING.feeRate, 2);
  });

  test("computes received amount from the rate", () => {
    const q = quote(50, 110.5);
    expect(q.received).toBeCloseTo(50 * 110.5, 2);
  });

  test("total is send plus fee", () => {
    const q = quote(200, 100);
    expect(q.total).toBeCloseTo(q.send + q.fee, 5);
  });

  test("treats a zero or negative amount as no send, no fee", () => {
    expect(quote(0, 100).fee).toBe(0);
    expect(quote(-50, 100).send).toBe(0);
    expect(quote(-50, 100).fee).toBe(0);
  });

  test("saved is never negative even if the fee exceeds the bank benchmark cost", () => {
    const q = quote(10, 100);
    expect(q.saved).toBeGreaterThanOrEqual(0);
  });
});
