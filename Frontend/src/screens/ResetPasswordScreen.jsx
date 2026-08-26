import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Check, Eye, EyeOff } from "lucide-react";
import { T, DISPLAY } from "../lib/theme.jsx";
import { Button, TextInput, Field } from "../components/primitives.jsx";
import { AuthSplit } from "../components/AuthSplit.jsx";
import { api } from "../lib/api.js";

export default function ResetPasswordScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError("Those passwords don't match.");
    setBusy(true);
    setError(null);
    try {
      await api.resetPassword({ token, password });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <AuthSplit>
        <div className="text-2xl" style={{ fontFamily: DISPLAY, fontWeight: 600 }}>Invalid reset link</div>
        <div className="text-sm" style={{ color: T.muted }}>This password reset link is missing its token. Request a new one below.</div>
        <Button full onClick={() => navigate("/forgot-password")}>Request a new link</Button>
      </AuthSplit>
    );
  }

  return (
    <AuthSplit>
      <div className="text-3xl" style={{ fontFamily: DISPLAY, fontWeight: 600 }}>Choose a new password</div>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <Field label="New password">
          <div className="relative">
            <TextInput type={show ? "text" : "password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" style={{ paddingRight: 40 }} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute" style={{ right: 10, top: 10, color: T.faint }}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>
        <Field label="Confirm new password">
          <TextInput type={show ? "text" : "password"} required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your new password" />
        </Field>
        {error && (
          <div className="flex items-center gap-2 text-xs" style={{ color: T.brick }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}
        <Button type="submit" full loading={busy} icon={Check}>Reset password</Button>
      </form>
    </AuthSplit>
  );
}
