import { round2 } from "./format.js";

/**
 * Pricing model — the product thesis lives here.
 * Halcyon charges one visible percentage fee and discloses the FX spread instead of
 * burying it in the rate. Both streams are what the admin revenue chart plots.
 */
export const PRICING = { feeRate: 0.009, feeMin: 0.3, feeCap: 4.5, spread: 0.0035, bankBenchmark: 0.062 };

export const quote = (amount, rate) => {
  const send = Math.max(0, Number(amount) || 0);
  const fee = send === 0 ? 0 : Math.min(PRICING.feeCap, Math.max(PRICING.feeMin, send * PRICING.feeRate));
  const spreadRevenue = send * PRICING.spread;
  const total = send + fee;
  const received = send * rate;
  const bankCost = send * PRICING.bankBenchmark;
  return {
    send,
    fee: round2(fee),
    spreadRevenue: round2(spreadRevenue),
    revenue: round2(fee + spreadRevenue),
    total: round2(total),
    received: round2(received),
    saved: round2(Math.max(0, bankCost - fee)),
    rate,
  };
};
