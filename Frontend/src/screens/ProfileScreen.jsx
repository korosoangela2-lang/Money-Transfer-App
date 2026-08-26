import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, LogOut, Shield } from "lucide-react";
import { T } from "../lib/theme.jsx";
import { initials } from "../lib/format.js";
import { Button, TextInput, Field, ScreenHeader } from "../components/primitives.jsx";
import { useStore } from "../store/context.jsx";
import { select } from "../store/selectors.js";
import { api } from "../lib/api.js";

export default function ProfileScreen() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const user = select.user(state);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const patch = await api.updateProfile({ name, email });
      dispatch({ type: "auth/profileUpdated", payload: patch });
      dispatch({ type: "ui/toastShown", payload: { message: "Profile updated" } });
    } catch (err) {
      dispatch({ type: "ui/toastShown", payload: { message: err.message, tone: "error" } });
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // local token is cleared regardless; proceed to logged-out state
    } finally {
      dispatch({ type: "auth/loggedOut" });
      navigate("/login", { replace: true });
    }
  };

  return (
    <ScreenHeader title="Profile" onBack={() => navigate("/home")}>
      <div className="flex flex-col items-center gap-2 pb-4">
        <div className="rounded-full flex items-center justify-center font-semibold text-lg" style={{ width: 64, height: 64, background: T.pineSoft, color: T.pine }}>
          {initials(user?.name)}
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: user?.kyc === "verified" ? T.pine : T.marigold }}>
          <Shield size={12} /> KYC {user?.kyc}
        </div>
      </div>
      <form className="flex flex-col gap-4 px-5" onSubmit={save}>
        <Field label="Full name"><TextInput value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Email"><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Phone"><TextInput value={user?.phone || ""} disabled style={{ opacity: 0.6 }} /></Field>
        <Button type="submit" full loading={busy} icon={Check}>Save changes</Button>
        <Button type="button" full variant="ghost" icon={LogOut} onClick={logout} style={{ color: "#FFFFFF", borderColor: "rgba(255,255,255,0.3)" }}>Log out</Button>
      </form>
    </ScreenHeader>
  );
}
