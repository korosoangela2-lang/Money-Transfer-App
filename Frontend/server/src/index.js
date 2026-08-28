import "dotenv/config";
import express from "express";
import cors from "cors";
import { stkPush } from "./daraja.js";
import { createPending, resolveRequest, getRequest } from "./store.js";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.post("/api/mpesa/stkpush", async (req, res) => {
  const { phone, amount } = req.body || {};
  if (!phone || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: "phone and a positive amount are required." });
  }
  try {
    const result = await stkPush({ phone, amount, description: "Halcyon wallet top-up" });
    createPending(result.CheckoutRequestID, { phone, amount });
    res.json({ checkoutRequestId: result.CheckoutRequestID, merchantRequestId: result.MerchantRequestID });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/** Safaricom posts the payment outcome here — this URL must be publicly reachable (see DARAJA_CALLBACK_URL). */
app.post("/api/mpesa/callback", (req, res) => {
  const body = req.body?.Body?.stkCallback;
  if (!body) return res.status(400).json({ error: "Malformed callback payload." });

  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = body;
  const receipt = CallbackMetadata?.Item?.find((i) => i.Name === "MpesaReceiptNumber")?.Value;

  resolveRequest(CheckoutRequestID, {
    status: ResultCode === 0 ? "completed" : "failed",
    resultDesc: ResultDesc,
    mpesaReceiptNumber: receipt,
  });

  // Daraja requires a 200 with this exact shape to stop retrying the callback.
  res.json({ ResultCode: 0, ResultDesc: "Accepted" });
});

app.get("/api/mpesa/status/:checkoutRequestId", (req, res) => {
  const entry = getRequest(req.params.checkoutRequestId);
  if (!entry) return res.status(404).json({ error: "Unknown checkout request." });
  res.json(entry);
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Halcyon M-Pesa server listening on :${port}`));
