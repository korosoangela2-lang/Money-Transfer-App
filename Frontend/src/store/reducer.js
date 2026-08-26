import { round2 } from "../lib/format.js";
import { BASE_RATES } from "../lib/constants.js";

export const initialState = {
  auth: { token: null, user: null, status: "idle", error: null, restoring: true },
  wallet: { balance: 0, currency: "CAD" },
  rates: { pairs: BASE_RATES, updatedAt: null, ticking: false },
  beneficiaries: { items: [], status: "idle", error: null },
  transactions: { items: [], status: "idle", error: null },
  admin: { users: [], transactions: [], revenue: [], status: "idle", error: null },
  ui: { toast: null },
};

export function reducer(state, action) {
  const { type, payload } = action;
  switch (type) {
    /* auth */
    case "auth/requestStarted":
      return { ...state, auth: { ...state.auth, status: "loading", error: null } };
    case "auth/requestFailed":
      return { ...state, auth: { ...state.auth, status: "failed", error: payload } };
    case "auth/sessionStarted":
      return {
        ...state,
        auth: { token: payload.token, user: payload.user, status: "succeeded", error: null, restoring: false },
        wallet: payload.wallet,
        beneficiaries: { ...state.beneficiaries, items: payload.beneficiaries },
        transactions: { ...state.transactions, items: payload.transactions },
      };
    case "auth/restoreFinished":
      return { ...state, auth: { ...state.auth, restoring: false } };
    case "auth/loggedOut":
      return { ...initialState, auth: { ...initialState.auth, restoring: false } };
    case "auth/profileUpdated":
      return { ...state, auth: { ...state.auth, user: { ...state.auth.user, ...payload } } };

    /* rates */
    case "rates/received":
      return { ...state, rates: { pairs: payload, updatedAt: payload.updatedAt, ticking: true } };
    case "rates/tickCleared":
      return { ...state, rates: { ...state.rates, ticking: false } };

    /* wallet + transactions */
    case "wallet/fundsAdded":
      return {
        ...state,
        wallet: { ...state.wallet, balance: round2(state.wallet.balance + payload.amount) },
        transactions: { ...state.transactions, items: [payload, ...state.transactions.items] },
      };
    case "wallet/fundsWithdrawn":
      return {
        ...state,
        wallet: { ...state.wallet, balance: round2(state.wallet.balance - payload.amount) },
        transactions: { ...state.transactions, items: [payload, ...state.transactions.items] },
      };
    case "transactions/transferRecorded":
      return {
        ...state,
        wallet: { ...state.wallet, balance: round2(state.wallet.balance - payload.amount - payload.fee) },
        transactions: { ...state.transactions, items: [payload, ...state.transactions.items] },
      };
    case "transactions/p2pSent":
      return {
        ...state,
        wallet: { ...state.wallet, balance: round2(state.wallet.balance - payload.amount) },
        transactions: { ...state.transactions, items: [payload, ...state.transactions.items] },
      };
    case "transactions/statusChanged":
      return {
        ...state,
        transactions: {
          ...state.transactions,
          items: state.transactions.items.map((t) => (t.id === payload.id ? { ...t, status: payload.status } : t)),
        },
      };

    /* beneficiaries */
    case "beneficiaries/added":
      return { ...state, beneficiaries: { ...state.beneficiaries, items: [payload, ...state.beneficiaries.items] } };
    case "beneficiaries/removed":
      return { ...state, beneficiaries: { ...state.beneficiaries, items: state.beneficiaries.items.filter((b) => b.id !== payload) } };

    /* admin */
    case "admin/dataReceived":
      return { ...state, admin: { ...payload, status: "succeeded", error: null } };
    case "admin/dataFailed":
      return { ...state, admin: { ...state.admin, status: "failed", error: payload } };
    case "admin/dataReset":
      return { ...state, admin: { ...state.admin, status: "idle", error: null } };
    case "admin/userCreated":
      return { ...state, admin: { ...state.admin, users: [payload, ...state.admin.users] } };
    case "admin/userUpdated":
      return {
        ...state,
        admin: { ...state.admin, users: state.admin.users.map((u) => (u.id === payload.id ? { ...u, ...payload.patch } : u)) },
      };
    case "admin/userDeleted":
      return { ...state, admin: { ...state.admin, users: state.admin.users.filter((u) => u.id !== payload) } };

    /* ui */
    case "ui/toastShown":
      return { ...state, ui: { ...state.ui, toast: payload } };
    case "ui/toastCleared":
      return { ...state, ui: { ...state.ui, toast: null } };
    default:
      return state;
  }
}
