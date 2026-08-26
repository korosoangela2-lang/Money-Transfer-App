import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ChevronLeft, MailCheck } from "lucide-react";
import { T, DISPLAY } from "../lib/theme.jsx";
import { Button, TextInput, Field } from "../components/primitives.jsx";
import { AuthSplit } from "../components/AuthSplit.jsx";
import { api } from "../lib/api.js";

export default function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <AuthSplit>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="rounded-full flex items-center justify-center" style={{ width: 48, height: 48, background: T.pineSoft, color: T.pine }}>
            <MailCheck size={22} />
          </span>
          <div className="text-2xl" style={{ fontFamily: DISPLAY, fontWeight: 600 }}>Check your email</div>
          <div className="text-sm" style={{ color: T.muted }}>
            If an account exists for <strong>{email}</strong>, we've sent a link to reset your password.
          </div>
        </div>
        <Button full variant="ghost" onClick={() => navigate("/login")}>Back to log in</Button>
      </AuthSplit>
    );
  }

  return (
    <AuthSplit>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/login")} style={{ color: T.muted }}>
          <ChevronLeft size={20} />
        </button>
        <div className="text-3xl" style={{ fontFamily: DISPLAY, fontWeight: 600 }}>Reset your password</div>
      </div>
      <div className="text-sm" style={{ color: T.muted }}>Enter your email and we'll send you a link to reset your password.</div>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <Field label="Email">
          <TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        {error && (
          <div className="flex items-center gap-2 text-xs" style={{ color: T.brick }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}
        <Button type="submit" full loading={busy}>Send reset link</Button>
      </form>
    </AuthSplit>
  );
}
