import { useState, useEffect } from "react";

// --- Types ---
type UserType = "Student" | "Teacher" | "Parent";
type Building = "East" | "West";

interface Person {
  id: string;
  name: string;
  type: UserType;
  family?: string;
  grade?: string;
  authorized?: string[]; // authorized pickup names
}

interface CheckInEntry {
  id: string;
  person: Person;
  timestamp: Date;
  station: string;
  building: Building;
  signedOut?: Date;
}

// --- Mock pass pool for simulated scans ---
const MOCK_PEOPLE: Person[] = [
  { id: "FAM-001", name: "Marcus Thompson", type: "Student", family: "Thompson", grade: "6th", authorized: ["Angela Thompson", "Robert Thompson"] },
  { id: "FAM-001P", name: "Angela Thompson", type: "Parent", family: "Thompson" },
  { id: "FAM-002", name: "Lily Okafor", type: "Student", family: "Okafor", grade: "4th", authorized: ["Chidi Okafor", "Nadia Okafor"] },
  { id: "FAM-002P", name: "Chidi Okafor", type: "Parent", family: "Okafor" },
  { id: "FAM-003", name: "Ethan Reyes", type: "Student", family: "Reyes", grade: "8th", authorized: ["Marisol Reyes"] },
  { id: "FAM-004", name: "Zoey Park", type: "Student", family: "Park", grade: "3rd", authorized: ["Jin Park", "Sara Park"] },
  { id: "FAM-004P", name: "Jin Park", type: "Parent", family: "Park" },
  { id: "TCH-001", name: "Ms. Bridget Walsh", type: "Teacher" },
  { id: "TCH-002", name: "Mr. David Nnadi", type: "Teacher" },
  { id: "TCH-003", name: "Ms. Priya Kapoor", type: "Teacher" },
];

const STATIONS = [
  "Sign-In Table",
  "Downstairs Hallway",
  "Chapel Hallway 1",
  "Chapel Hallway 2",
];

function getShift(): { label: string; range: string } {
  const hour = new Date().getHours();
  if (hour < 12 || (hour === 12 && new Date().getMinutes() < 30)) {
    return { label: "Morning", range: "8:45 AM – 12:30 PM" };
  }
  return { label: "Afternoon", range: "12:30 PM – 3:45 PM" };
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function typeColor(t: UserType) {
  switch (t) {
    case "Student": return "text-cyan-400 border-cyan-500/30 bg-cyan-900/20";
    case "Teacher": return "text-amber-400 border-amber-500/30 bg-amber-900/20";
    case "Parent": return "text-purple-400 border-purple-500/30 bg-purple-900/20";
  }
}

export default function EchoSignIn() {
  const [station, setStation] = useState(STATIONS[0]);
  const [building] = useState<Building>("East");
  const [log, setLog] = useState<CheckInEntry[]>([]);
  const [lastScan, setLastScan] = useState<CheckInEntry | null>(null);
  const [scanIdx, setScanIdx] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState<"scan" | "onsite" | "log">("scan");
  const [scanFlash, setScanFlash] = useState<"idle" | "success" | "already">("idle");

  const shift = getShift();
  const onSite = log.filter((e) => !e.signedOut);
  const students = onSite.filter((e) => e.person.type === "Student");
  const teachers = onSite.filter((e) => e.person.type === "Teacher");
  const parents = onSite.filter((e) => e.person.type === "Parent");

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  function handleScan() {
    const person = MOCK_PEOPLE[scanIdx % MOCK_PEOPLE.length];
    setScanIdx((i) => i + 1);

    // Check if already signed in
    const alreadyIn = log.find((e) => e.person.id === person.id && !e.signedOut);
    if (alreadyIn) {
      setScanFlash("already");
      setLastScan(alreadyIn);
      setTimeout(() => setScanFlash("idle"), 1800);
      return;
    }

    const entry: CheckInEntry = {
      id: `${person.id}-${Date.now()}`,
      person,
      timestamp: new Date(),
      station,
      building,
    };

    setLog((prev) => [entry, ...prev]);
    setLastScan(entry);
    setScanFlash("success");
    setTimeout(() => setScanFlash("idle"), 1800);
  }

  function handleSignOut(entryId: string) {
    setLog((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, signedOut: new Date() } : e))
    );
  }

  return (
    <div className="spine-page">
      {/* Header */}
      <div className="inos-card p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-inos-muted">ECHO Co-op</span>
              <span className="inos-pill text-[10px]">Sign-In System</span>
            </div>
            <h1 className="text-base font-semibold mt-0.5">Anchor Check-In Console</h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Shift */}
            <div className="text-right">
              <div className="text-[10px] text-inos-muted uppercase tracking-wider">{shift.label} Shift</div>
              <div className="text-xs text-inos-text font-mono">{shift.range}</div>
            </div>

            {/* WiFi indicator */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-mono ${
              online
                ? "border-green-500/30 bg-green-900/20 text-green-400"
                : "border-red-500/40 bg-red-900/20 text-red-400 animate-pulse"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${online ? "bg-green-400" : "bg-red-400"}`} />
              {online ? "Online" : "OFFLINE — use paper roster"}
            </div>
          </div>
        </div>

        {/* On-site summary */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-brand-border">
          <div className="text-center">
            <div className="text-lg font-bold text-cyan-400">{students.length}</div>
            <div className="text-[10px] text-inos-muted uppercase tracking-wider">Students</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-400">{teachers.length}</div>
            <div className="text-[10px] text-inos-muted uppercase tracking-wider">Teachers</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">{parents.length}</div>
            <div className="text-[10px] text-inos-muted uppercase tracking-wider">Parents</div>
          </div>
          <div className="text-center ml-auto">
            <div className="text-lg font-bold text-inos-text">{onSite.length}</div>
            <div className="text-[10px] text-inos-muted uppercase tracking-wider">On-Site</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {(["scan", "onsite", "log"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded text-xs font-medium uppercase tracking-wider transition-colors ${
              activeTab === tab
                ? "bg-brand-accent text-black"
                : "bg-brand-surface border border-brand-border text-inos-muted hover:text-inos-text"
            }`}
          >
            {tab === "scan" ? "Scan Pass" : tab === "onsite" ? `On-Site (${onSite.length})` : `Log (${log.length})`}
          </button>
        ))}
      </div>

      {/* Tab: Scan Pass */}
      {activeTab === "scan" && (
        <div className="space-y-4">
          {/* Station selector */}
          <div className="inos-card p-4">
            <div className="text-xs uppercase tracking-wider text-inos-muted mb-2">Your Station</div>
            <div className="grid grid-cols-2 gap-2">
              {STATIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStation(s)}
                  className={`px-3 py-2 rounded border text-xs text-left transition-colors ${
                    station === s
                      ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                      : "border-brand-border text-inos-muted hover:text-inos-text hover:border-brand-accent/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-3 text-[10px] text-inos-muted">
              Active: <span className="text-inos-text font-mono">{station}</span> · <span className="text-cyan-400">{building} Building</span>
            </div>
          </div>

          {/* Scan button */}
          <div className="inos-card p-6 flex flex-col items-center gap-4">
            <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">Scan Digital Wallet Pass</div>

            {/* QR viewfinder */}
            <div
              className={`relative w-48 h-48 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
                scanFlash === "success"
                  ? "border-green-400 bg-green-900/20"
                  : scanFlash === "already"
                  ? "border-amber-400 bg-amber-900/20"
                  : "border-brand-border bg-brand-surface"
              }`}
            >
              {/* Corner brackets */}
              <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-brand-accent rounded-tl" />
              <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-brand-accent rounded-tr" />
              <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-brand-accent rounded-bl" />
              <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-brand-accent rounded-br" />

              {scanFlash === "success" && (
                <div className="text-center">
                  <div className="text-3xl text-green-400">✓</div>
                  <div className="text-[10px] text-green-400 mt-1">Checked In</div>
                </div>
              )}
              {scanFlash === "already" && (
                <div className="text-center">
                  <div className="text-3xl text-amber-400">!</div>
                  <div className="text-[10px] text-amber-400 mt-1">Already On-Site</div>
                </div>
              )}
              {scanFlash === "idle" && (
                <div className="text-[10px] text-inos-muted text-center px-4">
                  Point camera at<br />wallet pass QR
                </div>
              )}
            </div>

            <button
              onClick={handleScan}
              className="px-8 py-3 rounded-lg bg-brand-accent text-black font-semibold text-sm tracking-wide hover:opacity-90 active:scale-95 transition-all"
            >
              Simulate Scan
            </button>

            <div className="text-[10px] text-inos-muted text-center">
              Uses device camera · Apple / Google / Samsung Wallet compatible
            </div>
          </div>

          {/* Last scan result */}
          {lastScan && (
            <div className={`inos-card p-4 border ${
              scanFlash === "already" ? "border-amber-500/40" : "border-green-500/30"
            }`}>
              <div className="text-[10px] uppercase tracking-wider text-inos-muted mb-2">Last Scan</div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm">{lastScan.person.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inos-pill text-[10px] ${typeColor(lastScan.person.type)}`}>
                      {lastScan.person.type}
                    </span>
                    {lastScan.person.family && (
                      <span className="text-[10px] text-inos-muted">Family: {lastScan.person.family}</span>
                    )}
                    {lastScan.person.grade && (
                      <span className="text-[10px] text-inos-muted">{lastScan.person.grade}</span>
                    )}
                  </div>
                  {lastScan.person.authorized && (
                    <div className="text-[10px] text-inos-muted mt-1">
                      Authorized pickup: {lastScan.person.authorized.join(", ")}
                    </div>
                  )}
                </div>
                <div className="text-right text-[10px] text-inos-muted whitespace-nowrap">
                  <div>{formatTime(lastScan.timestamp)}</div>
                  <div>{lastScan.station}</div>
                  {lastScan.signedOut && <div className="text-amber-400">Signed out {formatTime(lastScan.signedOut)}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: On-Site */}
      {activeTab === "onsite" && (
        <div className="inos-card p-4">
          {onSite.length === 0 ? (
            <div className="text-center text-inos-muted text-sm py-8">No one checked in yet.</div>
          ) : (
            <div className="space-y-2">
              {(["Student", "Teacher", "Parent"] as UserType[]).map((type) => {
                const group = onSite.filter((e) => e.person.type === type);
                if (group.length === 0) return null;
                return (
                  <div key={type}>
                    <div className={`text-[10px] uppercase tracking-wider mb-2 ${
                      type === "Student" ? "text-cyan-400" : type === "Teacher" ? "text-amber-400" : "text-purple-400"
                    }`}>{type}s ({group.length})</div>
                    {group.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between py-2 border-b border-brand-border last:border-0 gap-2">
                        <div>
                          <div className="text-sm">{entry.person.name}</div>
                          <div className="text-[10px] text-inos-muted">
                            In at {formatTime(entry.timestamp)} · {entry.station}
                          </div>
                        </div>
                        <button
                          onClick={() => handleSignOut(entry.id)}
                          className="px-2 py-1 rounded border border-brand-border text-[10px] text-inos-muted hover:text-red-400 hover:border-red-500/30 transition-colors whitespace-nowrap"
                        >
                          Sign Out
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Full Log */}
      {activeTab === "log" && (
        <div className="inos-card p-4">
          {log.length === 0 ? (
            <div className="text-center text-inos-muted text-sm py-8">No entries yet. Start scanning passes.</div>
          ) : (
            <div className="space-y-0 divide-y divide-brand-border">
              {log.map((entry) => (
                <div key={entry.id} className={`py-2.5 flex items-center gap-3 ${entry.signedOut ? "opacity-50" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{entry.person.name}</span>
                      <span className={`inos-pill text-[10px] ${typeColor(entry.person.type)}`}>{entry.person.type}</span>
                      {entry.signedOut && <span className="inos-pill text-[10px] text-inos-muted">Out</span>}
                    </div>
                    <div className="text-[10px] text-inos-muted mt-0.5">
                      {entry.station} · {entry.building} Building
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-inos-muted whitespace-nowrap">
                    <div className="font-mono">{formatTime(entry.timestamp)}</div>
                    {entry.signedOut && <div className="text-red-400 font-mono">{formatTime(entry.signedOut)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Offline warning banner */}
      {!online && (
        <div className="mt-4 p-3 rounded border border-red-500/40 bg-red-900/10 text-red-300 text-xs">
          <span className="font-semibold">WiFi offline.</span> Entries are stored locally. Use pre-printed roster as backup. Sync to Google Sheet when connectivity restores.
        </div>
      )}
    </div>
  );
}
