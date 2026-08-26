import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, Share2, Plus, Coins, X } from "lucide-react";
import { T, MONO, cardStyle } from "../lib/theme.jsx";
import { BRAND_NAME } from "../lib/brand.js";
import { money } from "../lib/format.js";
import { Button, TextInput, Field, ScreenHeader, StatusPill } from "../components/primitives.jsx";
import { useStore } from "../store/context.jsx";
import { select } from "../store/selectors.js";
import { api } from "../lib/api.js";

export default function ReceiveMoneyScreen() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const user = select.user(state);
  const [copied, setCopied] = useState(false);

  const [requests, setRequests] = useState(null); // null while loading
  const [payId, setPayId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [actingId, setActingId] = useState(null);

  const myPayId = user?.email || "";

  useEffect(() => {
    api.listRequests().then(setRequests).catch(() => setRequests({ incoming: [], outgoing: [] }));
  }, []);

  const copy = async () => {
    await navigator.clipboard?.writeText(myPayId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const share = async () => {
    const text = `Send me money on ${BRAND_NAME} — my Pay ID is ${myPayId}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // user cancelled the share sheet
      }
    } else {
      copy();
    }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!payId) return setError("Enter their Pay ID (email).");
    if (!amt || amt <= 0) return setError("Enter an amount to request.");
    setBusy(true); setError(null);
    try {
      const req = await api.requestMoney({ email: payId, amount: amt, note });
      setRequests((r) => ({ ...r, outgoing: [req, ...r.outgoing] }));
      dispatch({ type: "ui/toastShown", payload: { message: `Requested ${money(amt)} from ${payId}` } });
      setPayId(""); setAmount(""); setNote("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const pay = async (req) => {
    setActingId(req.id);
    try {
      const updated = await api.payRequest(req.id);
      dispatch({ type: "transactions/p2pSent", payload: updated.transaction });
      setRequests((r) => ({ ...r, incoming: r.incoming.map((x) => (x.id === req.id ? updated : x)) }));
    } catch (err) {
      dispatch({ type: "ui/toastShown", payload: { message: err.message, tone: "error" } });
    } finally {
      setActingId(null);
    }
  };

  const decline = async (req) => {
    setActingId(req.id);
    try {
      const updated = await api.declineRequest(req.id);
      setRequests((r) => ({ ...r, incoming: r.incoming.map((x) => (x.id === req.id ? updated : x)) }));
    } catch (err) {
      dispatch({ type: "ui/toastShown", payload: { message: err.message, tone: "error" } });
    } finally {
      setActingId(null);
    }
  };

  const pendingIncoming = requests?.incoming.filter((r) => r.status === "pending") || [];
  const outgoing = requests?.outgoing || [];

  return (
    <ScreenHeader title="Receive money" onBack={() => navigate("/home")}>
      <div className="flex flex-col gap-4 p-5 pt-2">
        <div className="text-xs" style={{ color: T.muted }}>
          Share your Pay ID so someone can send money straight to your {BRAND_NAME} wallet.
        </div>

        <div className="rounded-2xl p-5 flex flex-col items-center gap-1 text-center" style={{ background: T.ink, color: "#fff" }}>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{user?.name}</div>
          <div className="text-lg font-semibold" style={{ fontFamily: MONO }}>{myPayId}</div>
          <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Account {user?.id}</div>
        </div>

        <div className="flex gap-2">
          <Button full variant="ghost" icon={copied ? Check : Copy} onClick={copy}>{copied ? "Copied" : "Copy Pay ID"}</Button>
          <Button full icon={Share2} onClick={share}>Share</Button>
        </div>

        {pendingIncoming.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold" style={{ color: T.muted }}>Requesting you pay</div>
            {pendingIncoming.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3" style={cardStyle}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{r.requesterName} wants {money(r.amount)}</div>
                  {r.note && <div className="text-xs truncate" style={{ color: T.faint }}>{r.note}</div>}
                </div>
                <button onClick={() => decline(r)} disabled={actingId === r.id} style={{ color: T.faint }}><X size={16} /></button>
                <Button size="sm" loading={actingId === r.id} onClick={() => pay(r)}>Pay</Button>
              </div>
            ))}
          </div>
        )}

        <form className="flex flex-col gap-3 p-4" style={cardStyle} onSubmit={submitRequest}>
          <div className="text-xs font-semibold" style={{ color: T.muted }}>Request money from a {BRAND_NAME} user</div>
          <Field label="Their Pay ID (email)">
            <TextInput type="email" value={payId} onChange={(e) => setPayId(e.target.value)} placeholder="name@example.com" />
          </Field>
          <Field label="Amount (CAD)">
            <TextInput type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Note (optional)">
            <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Rent, dinner…" />
          </Field>
          {error && <div className="text-xs" style={{ color: T.brick }}>{error}</div>}
          <Button type="submit" size="sm" loading={busy} icon={Coins}>Send request</Button>
        </form>

        {outgoing.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold" style={{ color: T.muted }}>Requests you've sent</div>
            {outgoing.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3" style={cardStyle}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{money(r.amount)} from {r.payerName}</div>
                  {r.note && <div className="text-xs truncate" style={{ color: T.faint }}>{r.note}</div>}
                </div>
                <StatusPill status={r.status} />
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl p-3 text-xs" style={{ background: T.paper, color: T.muted }}>
          Prefer to fund it yourself? You can also top up your wallet directly with a card or M-Pesa.
        </div>
        <Button full variant="ghost" icon={Plus} onClick={() => navigate("/add-funds")}>Add funds instead</Button>
      </div>
    </ScreenHeader>
  );
}
