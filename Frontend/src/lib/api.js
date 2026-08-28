import { getToken, setToken, clearToken } from "./session.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || "Something went wrong. Please try again.");
  return data;
}

export const api = {
  async register({ name, email, phone, country, password }) {
    const session = await request("/api/auth/register", { method: "POST", body: { name, email, phone, country, password } });
    setToken(session.token);
    return session;
  },

  async login({ email, password }) {
    const session = await request("/api/auth/login", { method: "POST", body: { email, password } });
    setToken(session.token);
    return session;
  },

  /** Called once on app boot to silently resume a persisted session, if any. */
  async restoreSession() {
    if (!getToken()) return null;
    try {
      return await request("/api/auth/session", { auth: true });
    } catch {
      clearToken();
      return null;
    }
  },

  async logout() {
    try {
      await request("/api/auth/logout", { method: "POST", auth: true });
    } finally {
      clearToken();
    }
  },

  async forgotPassword({ email }) {
    return request("/api/auth/forgot-password", { method: "POST", body: { email } });
  },

  async resetPassword({ token, password }) {
    return request("/api/auth/reset-password", { method: "POST", body: { token, password } });
  },

  async rates() {
    return request("/api/rates");
  },

  async updateProfile(patch) {
    return request("/api/auth/me", { method: "PATCH", auth: true, body: patch });
  },

  async addFunds({ amount, source }) {
    return request("/api/wallet/add-funds", { method: "POST", auth: true, body: { amount, source } });
  },

  async withdraw({ amount, destination }) {
    return request("/api/wallet/withdraw", { method: "POST", auth: true, body: { amount, destination } });
  },

  async addBeneficiary(b) {
    return request("/api/beneficiaries", { method: "POST", auth: true, body: b });
  },

  async removeBeneficiary(id) {
    const { id: removedId } = await request(`/api/beneficiaries/${id}`, { method: "DELETE", auth: true });
    return removedId;
  },

  /** The server recomputes fee/rate/received from the beneficiary's currency and the live
   *  rate — it doesn't trust the client-side quote used for the pre-submit estimate. */
  async sendMoney({ beneficiary, q, method }) {
    return request("/api/transfers", {
      method: "POST",
      auth: true,
      body: { beneficiaryId: beneficiary.id, amount: q.send, method },
    });
  },

  /** Sends CAD straight into another Halcyon user's wallet, identified by their Pay ID (email). */
  async sendToUser({ email, amount }) {
    return request("/api/transfers/to-user", { method: "POST", auth: true, body: { email, amount } });
  },

  async requestMoney({ email, amount, note }) {
    return request("/api/requests", { method: "POST", auth: true, body: { email, amount, note } });
  },

  async listRequests() {
    return request("/api/requests", { auth: true });
  },

  async payRequest(id) {
    return request(`/api/requests/${id}/pay`, { method: "POST", auth: true });
  },

  async declineRequest(id) {
    return request(`/api/requests/${id}/decline`, { method: "POST", auth: true });
  },

  /** Admin-only aggregate view; the backend derives it from every user's real transactions. */
  async adminData() {
    return request("/api/admin/data", { auth: true });
  },

  async adminCreateUser(u) {
    return request("/api/admin/users", { method: "POST", auth: true, body: u });
  },

  async adminUpdateUser(id, patch) {
    return request(`/api/admin/users/${id}`, { method: "PATCH", auth: true, body: patch });
  },

  async adminDeleteUser(id) {
    const { id: removedId } = await request(`/api/admin/users/${id}`, { method: "DELETE", auth: true });
    return removedId;
  },
};
