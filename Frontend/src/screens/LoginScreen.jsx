import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { T, DISPLAY } from "../lib/theme.jsx";
import { Button, TextInput, Field } from "../components/primitives.jsx";
import { AuthSplit } from "../components/AuthSplit.jsx";
import { BRAND_NAME } from "../lib/brand.js";
import { useStore } from "../store/context.jsx";
import { api } from "../lib/api.js";

export default function LoginScreen() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const busy = state.auth.status === "loading";

  const submit = async (e) => {
    e.preventDefault();
    dispatch({ type: "auth/requestStarted" });
    try {
      const res = await api.login({ email, password });
      dispatch({ type: "auth/sessionStarted", payload: res });
      navigate(res.user.role === "admin" ? "/admin" : "/home", { replace: true });
    } catch (err) {
      dispatch({ type: "auth/requestFailed", payload: err.message });
    }
  };

  return (
    <AuthSplit>
      <div className="flex flex-col gap-1">
        <div className="text-3xl" style={{ fontFamily: DISPLAY, fontWeight: 600 }}>Log in</div>
        <div className="text-sm" style={{ color: T.muted }}>Welcome back — enter your details to continue.</div>
      </div>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <Field label="Email">
          <TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <div className="relative">
            <TextInput type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ paddingRight: 40 }} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute" style={{ right: 10, top: 10, color: T.faint }}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>
        <button type="button" className="text-sm text-right halcyon-link" style={{ color: T.muted, alignSelf: "flex-end" }} onClick={() => navigate("/forgot-password")}>
          Forgot password?
        </button>
        {state.auth.error && (
          <div className="flex items-center gap-2 text-xs" style={{ color: T.brick }}>
            <AlertCircle size={14} /> {state.auth.error}
          </div>
        )}
        <Button type="submit" full loading={busy}>Log in</Button>
      </form>
      <div className="text-sm text-center" style={{ color: T.muted }}>
        New to {BRAND_NAME}?{" "}
        <button className="font-semibold halcyon-link" onClick={() => navigate("/register")}>
          Create an account
        </button>
      </div>
    </AuthSplit>
  );
}
