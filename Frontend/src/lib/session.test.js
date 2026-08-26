import { getToken, setToken, clearToken } from "./session.js";

describe("session token storage", () => {
  beforeEach(() => localStorage.clear());

  test("returns null when nothing is stored", () => {
    expect(getToken()).toBeNull();
  });

  test("round-trips a token through localStorage", () => {
    setToken("session_ABC123");
    expect(getToken()).toBe("session_ABC123");
  });

  test("clearToken removes the stored token", () => {
    setToken("session_ABC123");
    clearToken();
    expect(getToken()).toBeNull();
  });
});
