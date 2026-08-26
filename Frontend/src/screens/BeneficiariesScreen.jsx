import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { T, inputStyle } from "../lib/theme.jsx";
import { CORRIDORS, PAYOUT_METHODS } from "../lib/constants.js";
import { Button, TextInput, Field, ScreenHeader } from "../components/primitives.jsx";
import { useStore } from "../store/context.jsx";
import { select } from "../store/selectors.js";
import { api } from "../lib/api.js";

function AddBeneficiaryForm({ onDone }) {
  const { state, dispatch } = useStore();
  const userId = select.user(state)?.id;
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [method, setMethod] = useState("mobile");
  const [account, setAccount] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const corridor = CORRIDORS.find((c) => c.code === currency);
    const b = await api.addBeneficiary(userId, {
      name, relation, currency, country: corridor.country, flag: corridor.flag,
      method, account, bank: PAYOUT_METHODS.find((m) => m.id === method)?.label,
    });
    dispatch({ type: "beneficiaries/added", payload: b });
    setBusy(false);
    onDone();
  };

  return (
    <form className="flex flex-col gap-3 p-4 rounded-xl mb-1" style={{ background: T.surface, border: `1px solid ${T.line}` }} onSubmit={submit}>
      <Field label="Full name"><TextInput required value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Relation"><TextInput value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Mother, Brother…" /></Field>
      <Field label="Country">
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputStyle}>
          {CORRIDORS.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.country}</option>)}
        </select>
      </Field>
      <Field label="Payout method">
        <select value={method} onChange={(e) => setMethod(e.target.value)} style={inputStyle}>
          {PAYOUT_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </Field>
      <Field label="Account / number"><TextInput required value={account} onChange={(e) => setAccount(e.target.value)} /></Field>
      <Button type="submit" full size="sm" loading={busy}>Save beneficiary</Button>
    </form>
  );
}

export default function BeneficiariesScreen() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const userId = select.user(state)?.id;
  const items = select.beneficiaries(state);
  const [adding, setAdding] = useState(false);

  const remove = async (id) => {
    await api.removeBeneficiary(userId, id);
    dispatch({ type: "beneficiaries/removed", payload: id });
    dispatch({ type: "ui/toastShown", payload: { message: "Beneficiary removed" } });
  };

  return (
    <ScreenHeader
      title="Beneficiaries"
      onBack={() => navigate("/home")}
      right={<button onClick={() => setAdding((a) => !a)} style={{ color: T.pine }}><Plus size={20} /></button>}
    >
      <div className="flex flex-col gap-3 p-5 pt-2">
        {adding && <AddBeneficiaryForm onDone={() => setAdding(false)} />}
        {items.length === 0 && !adding && (
          <div className="text-sm text-center py-10" style={{ color: T.faint }}>No beneficiaries yet.</div>
        )}
        {items.map((b) => (
          <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
            <div className="text-xl">{b.flag}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{b.name}</div>
              <div className="text-xs" style={{ color: T.faint }}>{b.relation} · {b.bank}</div>
            </div>
            <button onClick={() => remove(b.id)} style={{ color: T.faint }}><Trash2 size={16} /></button>
          </div>
        ))} 
      </div>
    </ScreenHeader>
  );
}
