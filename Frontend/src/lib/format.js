import { CURRENCIES } from "./constants.js";

export const money = (amount, code = "CAD") => {
  const c = CURRENCIES[code] || CURRENCIES.CAD;
  const n = Number(amount || 0).toLocaleString(c.locale, {
    minimumFractionDigits: c.decimals,
    maximumFractionDigits: c.decimals,
  });
  return `${c.symbol} ${n}`;
};

export const rateFmt = (r) => Number(r).toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

export const shortDate = (iso) =>
  new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });

export const fullDate = (iso) =>
  new Date(iso).toLocaleString("en-CA", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export const monthKey = (iso) => new Date(iso).toLocaleDateString("en-CA", { month: "short" });

export const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export const round2 = (n) => Math.round(n * 100) / 100;
