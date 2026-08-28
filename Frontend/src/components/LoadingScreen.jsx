import { Loader2 } from "lucide-react";
import { T } from "../lib/theme.jsx";

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center flex-1" style={{ minHeight: "100%" }}>
      <Loader2 className="halcyon-spin" size={22} style={{ color: T.pine }} />
    </div>
  );
}
