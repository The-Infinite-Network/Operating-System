import { NavLink } from "react-router-dom";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const tabs = [
  { label: "Home", to: "/home" },
  { label: "Entities Map", to: "/foundation" },
  { label: "Rooms", to: "/room/me" },
];

export default function TopHeader({ onOpenPOLELogger }: { onOpenPOLELogger: () => void }) {
  const [isGuildsOpen, setIsGuildsOpen] = useState(false);
  const [isAgentsOpen, setIsAgentsOpen] = useState(false);

  return (
    <header className="global-header">
      <div className="gh-brand-block">
        <div className="gh-logo">IN</div>
        <div className="gh-brand-lines">
          <div className="gh-line1">INFINITE NETWORK OS</div>
          <div className="gh-line2">INOS_E0</div>
          <div className="gh-subtitle">Timeline-native Operating System</div>
        </div>
        <div className="gh-env-pill" title="Local-only shell">
          <span className="gh-env-dot" />
          <span>ENV: LOCAL</span>
        </div>
      </div>

      <div className="gh-epoch-pill" title="Epoch 0 - TLR v1.0.0">
        <span>E0 - v1.0</span>
      </div>

      <nav className="gh-tabs" aria-label="Primary Views">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `gh-tab ${isActive ? "active" : ""}`}
          >
            {tab.label}
          </NavLink>
        ))}

        {/* Guilds Dropdown */}
        <div className="relative group">
          <button
            className="gh-tab flex items-center gap-1"
            onMouseEnter={() => setIsGuildsOpen(true)}
            onMouseLeave={() => setIsGuildsOpen(false)}
          >
            Guilds <ChevronDown className="w-3 h-3" />
          </button>
          {isGuildsOpen && (
            <div
              className="absolute top-full left-0 mt-1 w-48 bg-[#0f172a] border border-inos-border rounded-xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200"
              onMouseEnter={() => setIsGuildsOpen(true)}
              onMouseLeave={() => setIsGuildsOpen(false)}
            >
              <NavLink to="/guilds" className="block px-4 py-2 text-xs text-inos-muted hover:text-inos-accent hover:bg-white/5 rounded-lg">Guild Directory</NavLink>
              <NavLink to="/apps/cngi-intranet" className="block px-4 py-2 text-xs text-inos-muted hover:text-inos-accent hover:bg-white/5 rounded-lg">CNGI Bakery</NavLink>
              <NavLink to="/apps/ggp-intranet" className="block px-4 py-2 text-xs text-inos-muted hover:text-inos-accent hover:bg-white/5 rounded-lg">Grumpy Goat</NavLink>
            </div>
          )}
        </div>

        {/* Agents Dropdown */}
        <div className="relative group">
          <button
            className="gh-tab flex items-center gap-1"
            onMouseEnter={() => setIsAgentsOpen(true)}
            onMouseLeave={() => setIsAgentsOpen(false)}
          >
            Agents <ChevronDown className="w-3 h-3" />
          </button>
          {isAgentsOpen && (
            <div
              className="absolute top-full left-0 mt-1 w-48 bg-[#0f172a] border border-inos-border rounded-xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200"
              onMouseEnter={() => setIsAgentsOpen(true)}
              onMouseLeave={() => setIsAgentsOpen(false)}
            >
              <NavLink to="/agents" className="block px-4 py-2 text-xs text-inos-muted hover:text-inos-accent hover:bg-white/5 rounded-lg">Active Roster</NavLink>
              <NavLink to="/team-ai-hq" className="block px-4 py-2 text-xs text-inos-muted hover:text-inos-accent hover:bg-white/5 rounded-lg">Agent Forge</NavLink>
            </div>
          )}
        </div>

        <NavLink to="/apps" className={({ isActive }) => `gh-tab ${isActive ? "active" : ""}`}>Apps</NavLink>
        <NavLink to="/inbox" className={({ isActive }) => `gh-tab ${isActive ? "active" : ""}`}>Second Brain</NavLink>
        <NavLink to="/unschool" className={({ isActive }) => `gh-tab ${isActive ? "active" : ""}`}>Unschool</NavLink>
      </nav>

      <div className="gh-profile">
        <div className="gh-avatar">IN</div>
        <button className="gh-mode-pill" type="button">
          <span className="label">MODE</span>
          <span>FAST</span>
        </button>
        <div className="gh-sync-indicator">
          <span className="gh-sync-dot" />
          <span>Shell Ready</span>
        </div>
        <button 
          onClick={onOpenPOLELogger}
          className="ml-4 px-4 py-2 bg-gradient-to-r from-inos-accent to-indigo-600 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
          title="Log POLE Transmission"
        >
          LOG POLE
        </button>
      </div>
    </header>
  );
}

