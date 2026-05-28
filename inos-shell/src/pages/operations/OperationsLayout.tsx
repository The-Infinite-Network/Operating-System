import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { label: "WAR Room", to: "/operations/war" },
  { label: "Core Console", to: "/operations/core" },
  { label: "AIM Router", to: "/operations/aim" },
  { label: "Constraints", to: "/operations/constraints" },
  { label: "Evidence", to: "/operations/evidence" },
];

export default function OperationsLayout() {
  return (
    <div className="spine-page">
      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          OPERATIONS
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `tab-pill ${isActive ? "active" : ""}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <Outlet />
      </div>
    </div>
  );
}
