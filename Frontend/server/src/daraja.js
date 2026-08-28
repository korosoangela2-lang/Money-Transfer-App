const HOSTS = {
  sandbox: "https://sandbox.safaricom.co.ke",
  production: "https://api.safaricom.co.ke",
};

const host = () => HOSTS[process.env.DARAJA_ENV] || HOSTS.sandbox;

const timestamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

/** Normalizes a Kenyan number (07..., +2547..., 2547...) to Daraja's required 2547XXXXXXXX / 2541XXXXXXXX form. */
export function normalizeMsisdn(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  throw new Error("Enter a valid Kenyan phone number, e.g. 0712345678.");
}

async function getAccessToken() {
  const { DARAJA_CONSUMER_KEY, DARAJA_CONSUMER_SECRET } = process.env;
  if (!DARAJA_CONSUMER_KEY || !DARAJA_CONSUMER_SECRET) {
    throw new Error("Daraja credentials are not configured on the server (DARAJA_CONSUMER_KEY / DARAJA_CONSUMER_SECRET).");
  }
  const auth = Buffer.from(`${DARAJA_CONSUMER_KEY}:${DARAJA_CONSUMER_SECRET}`).toString("base64");
  const res = await fetch(`${host()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`Daraja auth failed (${res.status}).`);
  const data = await res.json();
  return data.access_token;
}

export async function stkPush({ phone, amount, accountReference, description }) {
  const { DARAJA_SHORTCODE, DARAJA_PASSKEY, DARAJA_CALLBACK_URL } = process.env;
  if (!DARAJA_CALLBACK_URL) throw new Error("DARAJA_CALLBACK_URL is not configured on the server.");
  const msisdn = normalizeMsisdn(phone);
  const ts = timestamp();
  const password = Buffer.from(`${DARAJA_SHORTCODE}${DARAJA_PASSKEY}${ts}`).toString("base64");
  const token = await getAccessToken();

  const res = await fetch(`${host()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: DARAJA_SHORTCODE,
      Password: password,
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.max(1, Math.round(Number(amount) || 0)),
      PartyA: msisdn,
      PartyB: DARAJA_SHORTCODE,
      PhoneNumber: msisdn,
      CallBackURL: DARAJA_CALLBACK_URL,
      AccountReference: accountReference || "Halcyon",
      TransactionDesc: description || "Halcyon wallet top-up",
    }),
  });
  const data = await res.json();
  if (!res.ok || data.ResponseCode !== "0") {
    throw new Error(data.errorMessage || data.ResponseDescription || "STK push request failed.");
  }
  return data; // { MerchantRequestID, CheckoutRequestID, ResponseCode, ... }
}
