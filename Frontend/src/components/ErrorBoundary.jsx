import { Component } from "react";
import { AlertTriangle } from "lucide-react";
import { T, SANS, DISPLAY } from "../lib/theme.jsx";
import { Button } from "./primitives.jsx";

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled error", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        className="flex min-h-screen w-full items-center justify-center px-6"
        style={{ fontFamily: SANS, color: T.ink, background: T.bg }}
      >
        <div className="flex flex-col items-center gap-4 text-center" style={{ maxWidth: 380 }}>
          <div className="rounded-full flex items-center justify-center" style={{ width: 48, height: 48, background: T.brickSoft, color: T.brick }}>
            <AlertTriangle size={22} />
          </div>
          <div className="text-2xl" style={{ fontFamily: DISPLAY, fontWeight: 600 }}>Something went wrong</div>
          <div className="text-sm" style={{ color: T.muted }}>
            We hit an unexpected error. Try reloading the page — if it keeps happening, give us a moment and come back later.
          </div>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
      </div>
    );
  }
}
