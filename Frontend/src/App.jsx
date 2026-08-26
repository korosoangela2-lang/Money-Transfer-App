import { Suspense, lazy, useEffect, useMemo, useReducer } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

import { GlobalStyle, SANS, T } from "./lib/theme.jsx";
import { api } from "./lib/api.js";
import { reducer, initialState } from "./store/reducer.js";
import { select } from "./store/selectors.js";
import { Store, useStore } from "./store/context.jsx";
import { Toast } from "./components/primitives.jsx";
import { BackgroundArt } from "./components/BackgroundArt.jsx";
import { LoadingScreen } from "./components/LoadingScreen.jsx";

import LandingScreen from "./screens/LandingScreen.jsx";
import LoginScreen from "./screens/LoginScreen.jsx";
import RegisterScreen from "./screens/RegisterScreen.jsx";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen.jsx";
import ResetPasswordScreen from "./screens/ResetPasswordScreen.jsx";
import UserShell from "./screens/UserShell.jsx";

/** Code-split: keeps recharts (and everything below) out of the initial bundle. */
const HomeScreen = lazy(() => import("./screens/HomeScreen.jsx"));
const AddFundsScreen = lazy(() => import("./screens/AddFundsScreen.jsx"));
const ReceiveMoneyScreen = lazy(() => import("./screens/ReceiveMoneyScreen.jsx"));
const BeneficiariesScreen = lazy(() => import("./screens/BeneficiariesScreen.jsx"));
const SendMoneyScreen = lazy(() => import("./screens/SendMoneyScreen.jsx"));
const TransactionsScreen = lazy(() => import("./screens/TransactionsScreen.jsx"));
const ReceiptScreen = lazy(() => import("./screens/ReceiptScreen.jsx"));
const ProfileScreen = lazy(() => import("./screens/ProfileScreen.jsx"));
const AdminShell = lazy(() => import("./screens/admin/AdminShell.jsx"));
const AdminOverviewScreen = lazy(() => import("./screens/admin/AdminOverviewScreen.jsx"));
const AdminUsersScreen = lazy(() => import("./screens/admin/AdminUsersScreen.jsx"));
const AdminTransactionsScreen = lazy(() => import("./screens/admin/AdminTransactionsScreen.jsx"));
const AdminRevenueScreen = lazy(() => import("./screens/admin/AdminRevenueScreen.jsx"));

function RootRedirect() {
  const { state } = useStore();
  if (state.auth.restoring) return <LoadingScreen />;
  if (!state.auth.token) return <LandingScreen />;
  return <Navigate to={select.isAdmin(state) ? "/admin" : "/home"} replace />;
}

function PublicOnly() {
  const { state } = useStore();
  if (state.auth.restoring) return <LoadingScreen />;
  if (state.auth.token) return <Navigate to={select.isAdmin(state) ? "/admin" : "/home"} replace />;
  return <Outlet />;
}

function RequireAuth({ role }) {
  const { state } = useStore();
  if (state.auth.restoring) return <LoadingScreen />;
  if (!state.auth.token) return <Navigate to="/login" replace />;
  const isAdmin = select.isAdmin(state);
  if (role === "admin" && !isAdmin) return <Navigate to="/home" replace />;
  if (role === "user" && isAdmin) return <Navigate to="/admin" replace />;
  return <Outlet />;
}

function AppShell() {
  return (
    <div className="heha heha-bg flex min-h-screen w-full relative overflow-hidden" style={{ fontFamily: SANS, color: T.ink }}>
      <BackgroundArt tone="light" />
      <div className="heha-page relative" style={{ zIndex: 1 }}><Outlet /></div>
      <Toast />
    </div>
  );
}

/** Login/register don't manage their own scroll region (unlike UserShell), so they get one here. */
function AuthLayout() {
  return (
    <div className="heha-scroll flex-1 overflow-y-auto">
      <Outlet />
    </div>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const store = useMemo(() => ({ state, dispatch }), [state]);

  useEffect(() => {
    api.rates().then((r) => dispatch({ type: "rates/received", payload: r }));
    api.restoreSession().then((res) => {
      if (res) dispatch({ type: "auth/sessionStarted", payload: res });
      else dispatch({ type: "auth/restoreFinished" });
    });
  }, []);

  return (
    <Store.Provider value={store}>
      <GlobalStyle />
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<RootRedirect />} />

            <Route element={<PublicOnly />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/register" element={<RegisterScreen />} />
                <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
                <Route path="/reset-password" element={<ResetPasswordScreen />} />
              </Route>
            </Route>

            <Route element={<RequireAuth role="user" />}>
              <Route element={<UserShell />}>
                <Route path="/home" element={<HomeScreen />} />
                <Route path="/add-funds" element={<AddFundsScreen />} />
                <Route path="/receive" element={<ReceiveMoneyScreen />} />
                <Route path="/beneficiaries" element={<BeneficiariesScreen />} />
                <Route path="/send" element={<SendMoneyScreen />} />
                <Route path="/transactions" element={<TransactionsScreen />} />
                <Route path="/profile" element={<ProfileScreen />} />
                <Route path="/receipt/:id" element={<ReceiptScreen />} />
              </Route>
            </Route>

            <Route element={<RequireAuth role="admin" />}>
              <Route
                path="/admin"
                element={
                  <Suspense fallback={<LoadingScreen />}>
                    <AdminShell />
                  </Suspense>
                }
              >
                <Route index element={<AdminOverviewScreen />} />
                <Route path="users" element={<AdminUsersScreen />} />
                <Route path="transactions" element={<AdminTransactionsScreen />} />
                <Route path="revenue" element={<AdminRevenueScreen />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Store.Provider>
  );
}
