import { useState } from "react";
import { Search, Trash2, Pencil, Plus } from "lucide-react";
import { T, inputStyle } from "../../lib/theme.jsx";
import { money } from "../../lib/format.js";
import { Button, TextInput, Field, StatusPill, Modal } from "../../components/primitives.jsx";
import { useStore } from "../../store/context.jsx";
import { api } from "../../lib/api.js";

const ROLES = ["user", "admin"];
const KYC_STATES = ["unverified", "pending", "verified"];
const ACCOUNT_STATES = ["active", "suspended"];
const COUNTRIES = ["Canada", "United Kingdom", "Australia", "United States"];

const emptyForm = { name: "", email: "", phone: "", country: "Canada", role: "user", kyc: "unverified", status: "active", balance: 0, password: "" };

function UserForm({ initial, isNew, onSubmit, onClose }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={submit}>
      <Field label="Full name">
        <TextInput required value={form.name} onChange={set("name")} placeholder="Jane Doe" />
      </Field>
      <Field label="Email">
        <TextInput type="email" required disabled={!isNew} value={form.email} onChange={set("email")} placeholder="you@example.com" />
      </Field>
      <Field label="Phone number">
        <TextInput value={form.phone} onChange={set("phone")} placeholder="+1 416 555 0100" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Country">
          <select value={form.country} onChange={set("country")} style={inputStyle}>
            {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Role">
          <select value={form.role} onChange={set("role")} style={inputStyle}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="KYC">
          <select value={form.kyc} onChange={set("kyc")} style={inputStyle}>
            {KYC_STATES.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={set("status")} style={inputStyle}>
            {ACCOUNT_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Wallet balance (CAD)">
        <TextInput type="number" step="0.01" min="0" value={form.balance} onChange={set("balance")} />
      </Field>
      {isNew && (
        <Field label="Password (optional — a random one is generated if left blank)">
          <TextInput type="password" value={form.password} onChange={set("password")} placeholder="At least 8 characters" />
        </Field>
      )}
      {error && <div className="text-xs" style={{ color: T.brick }}>{error}</div>}
      <Button type="submit" full loading={busy}>{isNew ? "Create user" : "Save changes"}</Button>
    </form>
  );
}

export default function AdminUsersScreen() {
  const { state, dispatch } = useStore();
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null); // { mode: "create" | "edit", user? }
  const users = state.admin.users.filter(
    (u) => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())
  );

  const toggleStatus = async (u) => {
    const status = u.status === "active" ? "suspended" : "active";
    await api.adminUpdateUser(u.id, { status });
    dispatch({ type: "admin/userUpdated", payload: { id: u.id, patch: { status } } });
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this user? This can't be undone.")) return;
    await api.adminDeleteUser(id);
    dispatch({ type: "admin/userDeleted", payload: id });
  };

  const createUser = async (form) => {
    const created = await api.adminCreateUser({ ...form, balance: undefined });
    const balance = Number(form.balance) || 0;
    if (balance > 0) await api.adminUpdateUser(created.id, { balance });
    dispatch({ type: "admin/userCreated", payload: { ...created, balance, sends: 0, volume: 0 } });
  };

  const saveUser = async (id) => async (form) => {
    const patch = { name: form.name, phone: form.phone, country: form.country, role: form.role, kyc: form.kyc, status: form.status, balance: Number(form.balance) || 0 };
    const res = await api.adminUpdateUser(id, patch);
    dispatch({ type: "admin/userUpdated", payload: { id, patch: res.patch } });
  };

  return (
    <div className="flex flex-col gap-5 halcyon-rise">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Users</div>
          <div className="text-sm" style={{ color: T.muted }}>{state.admin.users.length} accounts</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: T.faint }} />
            <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" style={{ paddingLeft: 32, width: 220 }} />
          </div>
          <Button size="sm" icon={Plus} onClick={() => setModal({ mode: "create" })}>Add user</Button>
        </div>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.line}`, background: T.surface }}>
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: T.paper }}>
              {["User", "Country", "Balance", "KYC", "Status", ""].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: T.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderTop: `1px solid ${T.line}` }}>
                <td className="px-4 py-3">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs" style={{ color: T.faint }}>{u.email}</div>
                </td>
                <td className="px-4 py-3">{u.country}</td>
                <td className="px-4 py-3">{money(u.balance)}</td>
                <td className="px-4 py-3"><StatusPill status={u.kyc} /></td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(u)} className="text-xs font-semibold capitalize" style={{ color: u.status === "active" ? T.pine : T.brick }}>
                    {u.status}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => setModal({ mode: "edit", user: u })} style={{ color: T.faint }}><Pencil size={14} /></button>
                    <button onClick={() => remove(u.id)} style={{ color: T.faint }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.mode === "create" && (
        <Modal title="Add user" onClose={() => setModal(null)}>
          <UserForm initial={emptyForm} isNew onSubmit={createUser} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.mode === "edit" && (
        <Modal title="Edit user" onClose={() => setModal(null)}>
          <UserForm
            initial={{ ...emptyForm, ...modal.user }}
            isNew={false}
            onSubmit={saveUser(modal.user.id)}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
