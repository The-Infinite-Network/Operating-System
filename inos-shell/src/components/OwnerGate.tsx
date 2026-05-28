import { ReactNode } from "react";

const ACCESS_KEY = "inos_access_level";

function getAccessLevel() {
  if (typeof window === "undefined") return "employee";
  return window.localStorage.getItem(ACCESS_KEY) || "employee";
}

export default function OwnerGate({ children }: { children: ReactNode }) {
  const access = getAccessLevel();
  if (access === "owner") return <>{children}</>;

  return (
    <div className="card p-6 space-y-3">
      <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
        Access Restricted
      </div>
      <h2 className="text-lg font-semibold">Owner-only surface</h2>
      <p className="text-sm text-inos-muted">
        IE HoldCo Spine is reserved for owners. Employees can access intranet
        surfaces but are blocked from the owner spine.
      </p>
      <div className="rounded-lg border border-inos-border/60 bg-black/20 p-3 text-xs text-inos-muted">
        Set <span className="font-mono text-sky-300">{ACCESS_KEY}=owner</span>{" "}
        in local storage to unlock this surface.
      </div>
    </div>
  );
}
