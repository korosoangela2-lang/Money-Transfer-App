import { Suspense } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, Users, Send, Receipt, User, LogOut } from "lucide-react";
import { T } from "../lib/theme.jsx";
import { initials } from "../lib/format.js";
import { useStore } from "../store/context.jsx";
import { select } from "../store/selectors.js";
import { api } from "../lib/api.js";
import { Logo } from "../components/Logo.jsx";
import { LoadingScreen } from "../components/LoadingScreen.jsx";

const USER_NAV = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/beneficiaries", label: "People", icon: Users },
  { path: "/send", label: "Send", icon: Send },
  { path: "/transactions", label: "History", icon: Receipt },
  { path: "/profile", label: "Profile", icon: User },
];

export default function UserShell() {
  const { state, dispatch } = useStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const showNav = !pathname.startsWith("/receipt");
  const user = select.user(state);

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
    <div className="flex flex-col flex-1" style={{ minHeight: 0 }}>
      {showNav && (
        <div className="hidden lg:flex items-center gap-1 px-6" style={{ height: 64, borderBottom: `1px solid ${T.line}`, background: T.surface, flexShrink: 0 }}>
          <Logo size={24} textSize={16} className="pr-6" />
          <div className="flex items-center gap-1 flex-1">
            {USER_NAV.map(({ path, label, icon: Icon }) => {
              const active = pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{ background: active ? T.pineSoft : "transparent", color: active ? T.pine : T.ink80 }}
                >
                  <Icon size={15} /> {label}
                </button>
              );
            })}
          </div>
          <button onClick={() => navigate("/profile")} className="rounded-full flex items-center justify-center font-semibold text-xs" style={{ width: 30, height: 30, background: T.pineSoft, color: T.pine }}>
            {initials(user?.name)}
          </button>
          <button onClick={logout} className="flex items-center gap-1.5 px-3 py-2 ml-1 text-sm font-medium" style={{ color: T.muted }}>
            <LogOut size={15} /> Log out
          </button>
        </div>
      )}
      <div className="heha-scroll flex-1 overflow-y-auto">
        <div className="heha-container">
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
      {showNav && (
        <div className="flex items-stretch lg:hidden" style={{ borderTop: `1px solid ${T.line}`, background: T.surface }}>
          {USER_NAV.map(({ path, label, icon: Icon }) => {
            const active = pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex-1 flex flex-col items-center gap-1 py-2.5"
                style={{ color: active ? T.pine : T.faint }}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 2} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
