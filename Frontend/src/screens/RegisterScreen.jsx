import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ChevronLeft, Eye, EyeOff } from "lucide-react";
import { T, DISPLAY } from "../lib/theme.jsx";
import { Button, TextInput, Field } from "../components/primitives.jsx";
import { AuthSplit } from "../components/AuthSplit.jsx";
import { inputStyle } from "../lib/theme.jsx";
import { useStore } from "../store/context.jsx";
import { api } from "../lib/api.js";

export default function RegisterScreen() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Canada");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const busy = state.auth.status === "loading";

  const submit = async (e) => {
    e.preventDefault();
    dispatch({ type: "auth/requestStarted" });
    try {
      const res = await api.register({ name, email, phone, country, password });
      dispatch({ type: "auth/sessionStarted", payload: res });
      navigate("/home", { replace: true });
    } catch (err) {
      dispatch({ type: "auth/requestFailed", payload: err.message });
    }
  };

  return (
    <AuthSplit>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/login")} style={{ color: T.muted }}>
          <ChevronLeft size={20} />
        </button>
        <div className="text-3xl" style={{ fontFamily: DISPLAY, fontWeight: 600 }}>Create your account</div>
      </div>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <Field label="Full name">
          <TextInput required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
        </Field>
        <Field label="Email">
          <TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Phone number">
          <TextInput required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 416 555 0100" />
        </Field>
        <Field label="Country">
          <select value={country} onChange={(e) => setCountry(e.target.value)} style={inputStyle}>
            {["Canada", "United Kingdom", "Australia", "United States"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Password">
          <div className="relative">
            <TextInput type={show ? "text" : "password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" style={{ paddingRight: 40 }} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute" style={{ right: 10, top: 10, color: T.faint }}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>
        {state.auth.error && (
          <div className="flex items-center gap-2 text-xs" style={{ color: T.brick }}>
            <AlertCircle size={14} /> {state.auth.error}
          </div>
        )}
        <Button type="submit" full loading={busy}>Create account</Button>
      </form>
    </AuthSplit>
  );
}
