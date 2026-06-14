import { useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Database,
  FileText,
  Filter,
  Layers3,
  LockKeyhole,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  candidateBundles,
  driveSources,
  fulcrumMoves,
  fulcrumReviewGate,
  fulcrumSourceFolder,
  internalProofRegistry,
} from "./fulcrumSystem";

const navItems = [
  { label: "Command", icon: ShieldCheck },
  { label: "Moves", icon: Layers3 },
  { label: "Artifact Compiler", icon: Sparkles },
  { label: "Client Track", icon: ClipboardList },
  { label: "Drive Sources", icon: Database },
  { label: "Review Queue", icon: Archive },
];

const tabs = ["All", "Mapped", "Reserved", "Blocked"] as const;

function stateClass(state: string) {
  switch (state) {
    case "ready":
    case "mapped":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
    case "candidate":
    case "partial":
    case "queued":
      return "border-cyan-400/30 bg-cyan-400/10 text-cyan-100";
    case "blocked":
      return "border-rose-400/30 bg-rose-400/10 text-rose-100";
    case "reserved":
      return "border-slate-600 bg-slate-800/70 text-slate-300";
    default:
      return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  }
}

export default function FfcIntranetApp() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("All");
  const [query, setQuery] = useState("");

  const sourceCounts = useMemo(
    () =>
      driveSources.reduce<Record<string, number>>((counts, source) => {
        counts[source.state] = (counts[source.state] ?? 0) + 1;
        return counts;
      }, {}),
    [],
  );

  const filteredMoves = useMemo(() => {
    return fulcrumMoves.filter((move) => {
      const matchesTab =
        activeTab === "All" ||
        (activeTab === "Mapped" && move.status !== "reserved") ||
        (activeTab === "Reserved" && move.status === "reserved") ||
        (activeTab === "Blocked" && fulcrumReviewGate.blockers.length > 0);
      const searchable = `${move.title} ${move.goal} ${move.stages
        .map((stage) => stage.name)
        .join(" ")}`.toLowerCase();
      return matchesTab && searchable.includes(query.trim().toLowerCase());
    });
  }, [activeTab, query]);

  const readyBundles = candidateBundles.filter((bundle) => bundle.state === "ready").length;
  const totalArtifacts = fulcrumMoves.reduce((sum, move) => sum + move.artifactCount, 0);

  return (
    <div className="min-h-[calc(100vh-96px)] overflow-x-auto bg-[#08111c] text-slate-100 max-md:fixed max-md:inset-0 max-md:z-50 max-md:min-h-screen">
      <div className="mx-auto flex max-w-[1500px] gap-4 px-4 py-4 lg:min-w-[1120px] lg:px-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-4 rounded-lg border border-slate-700/80 bg-[#0b1420] p-2">
            <div className="px-2 py-3">
              <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-200/70">
                FFC OS
              </div>
              <div className="mt-1 text-sm font-semibold text-white">Fulcrum</div>
            </div>
            <nav className="space-y-1">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition ${
                      index === 0
                        ? "bg-cyan-400/12 text-cyan-100"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    }`}
                    type="button"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-4">
          <header className="rounded-lg border border-slate-700/80 bg-[#0d1825] px-4 py-4 shadow-xl shadow-black/20">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  <span>Fulcrum Fortress Consulting</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-cyan-200">{fulcrumSourceFolder.title}</span>
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  Fulcrum System
                </h1>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                  Mastery program, consulting operating system, and Leviathan candidate
                  compiler surface for the current FFC Drive intake.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                <div className="rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-amber-200/80">
                    Gate
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-amber-100">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    Candidate-only
                  </div>
                </div>
                <div className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100/80">
                    Artifacts
                  </div>
                  <div className="mt-1 text-xs font-semibold text-cyan-100">
                    {totalArtifacts} mapped
                  </div>
                </div>
                <div className="rounded-md border border-emerald-300/30 bg-emerald-300/10 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-100/80">
                    Bundles
                  </div>
                  <div className="mt-1 text-xs font-semibold text-emerald-100">
                    {readyBundles} ready
                  </div>
                </div>
              </div>
            </div>
          </header>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-700/80 bg-[#0b1420] p-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab}
                        className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
                          activeTab === tab
                            ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100"
                            : "border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-100"
                        }`}
                        onClick={() => setActiveTab(tab)}
                        type="button"
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="flex min-w-0 items-center gap-2 rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 md:w-72">
                    <Search className="h-4 w-4 shrink-0 text-slate-500" />
                    <input
                      className="min-w-0 flex-1 bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500"
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search moves or stages"
                      value={query}
                    />
                    <Filter className="h-4 w-4 shrink-0 text-slate-500" />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                {filteredMoves.map((move) => (
                  <article
                    key={move.id}
                    className="rounded-lg border border-slate-700/80 bg-[#0d1825] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/70">
                          Move {move.move}
                        </div>
                        <h2 className="mt-1 text-base font-semibold text-white">{move.title}</h2>
                      </div>
                      <span
                        className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${stateClass(
                          move.status,
                        )}`}
                      >
                        {move.status}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-400">{move.goal}</p>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-700/70 pt-3 text-xs text-slate-400">
                      <span>{move.stages.length || "No"} stages</span>
                      <span>{move.artifactCount} artifacts</span>
                    </div>

                    {move.stages.length > 0 && (
                      <div className="mt-3 grid gap-2">
                        {move.stages.slice(0, 5).map((stage) => (
                          <div
                            key={stage.name}
                            className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 rounded-md bg-slate-950/45 px-3 py-2"
                          >
                            <div className="text-xs font-semibold text-cyan-100">
                              {stage.name}
                            </div>
                            <div className="min-w-0 text-xs leading-5 text-slate-400">
                              {stage.purpose}
                            </div>
                          </div>
                        ))}
                        {move.stages.length > 5 && (
                          <div className="text-xs text-slate-500">
                            +{move.stages.length - 5} more stages in source map
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>

              <section className="rounded-lg border border-slate-700/80 bg-[#0b1420] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                      Candidate Bundle Queue
                    </div>
                    <h2 className="mt-1 text-lg font-semibold text-white">
                      Leviathan compile targets
                    </h2>
                  </div>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-cyan-300/40 bg-cyan-300/15 px-3 py-2 text-xs font-semibold text-cyan-50 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled
                    type="button"
                    title="Disabled until live compiler wiring is approved"
                  >
                    <Sparkles className="h-4 w-4" />
                    Compile Candidate Bundle
                  </button>
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-2 2xl:grid-cols-4">
                  {candidateBundles.map((bundle) => (
                    <div
                      key={bundle.type}
                      className="rounded-md border border-slate-700 bg-slate-950/45 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-white">{bundle.type}</div>
                        <span
                          className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase ${stateClass(
                            bundle.state,
                          )}`}
                        >
                          {bundle.state}
                        </span>
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-400">{bundle.target}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              <section className="rounded-lg border border-slate-700/80 bg-[#0b1420] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                      Drive Intake
                    </div>
                    <h2 className="mt-1 text-lg font-semibold text-white">Source snapshot</h2>
                  </div>
                  <Database className="h-5 w-5 text-cyan-200" />
                </div>

                <a
                  className="mt-3 block truncate rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100 hover:border-cyan-200/50"
                  href={fulcrumSourceFolder.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {fulcrumSourceFolder.url}
                </a>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {(["ready", "candidate", "blocked"] as const).map((state) => (
                    <div key={state} className="rounded-md border border-slate-700 bg-slate-950/45 p-2">
                      <div className="text-lg font-semibold text-white">{sourceCounts[state] ?? 0}</div>
                      <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                        {state}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2">
                  {driveSources.map((source) => (
                    <div
                      key={source.id}
                      className="rounded-md border border-slate-700 bg-slate-950/45 p-3"
                    >
                      <div className="flex items-start gap-2">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold text-slate-100">
                            {source.title}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-slate-500">
                            <span>{source.type}</span>
                            <span>{source.lane}</span>
                          </div>
                        </div>
                        <span
                          className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase ${stateClass(
                            source.state,
                          )}`}
                        >
                          {source.state}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                  <ShieldAlert className="h-4 w-4" />
                  Review gate
                </div>
                <div className="mt-2 text-xs leading-5 text-amber-100/80">
                  {fulcrumReviewGate.promotionRule}
                </div>
                <div className="mt-3 space-y-2">
                  {fulcrumReviewGate.blockers.map((blocker) => (
                    <div
                      key={blocker}
                      className="rounded-md border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-xs leading-5 text-rose-100"
                    >
                      {blocker}
                    </div>
                  ))}
                  {fulcrumReviewGate.warnings.map((warning) => (
                    <div
                      key={warning}
                      className="rounded-md border border-amber-300/20 bg-slate-950/30 px-3 py-2 text-xs leading-5 text-amber-100/80"
                    >
                      {warning}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-purple-300/25 bg-purple-300/10 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-purple-100">
                  <Archive className="h-4 w-4" />
                  Internal proof custody
                </div>
                <div className="mt-2 text-xs leading-5 text-purple-100/75">
                  Preserved work-product proof stays inside the INOS/FFC review layer until public
                  release is explicitly approved.
                </div>
                <div className="mt-3 space-y-2">
                  {internalProofRegistry.map((proof) => (
                    <div
                      key={proof.id}
                      className="rounded-md border border-purple-300/20 bg-slate-950/35 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-purple-50">{proof.title}</div>
                        <span
                          className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase ${stateClass(
                            proof.state,
                          )}`}
                        >
                          {proof.state}
                        </span>
                      </div>
                      <div className="mt-2 text-xs leading-5 text-purple-100/75">
                        {proof.summary}
                      </div>
                      <div className="mt-2 rounded bg-slate-950/50 px-2 py-1 font-mono text-[10px] text-slate-400">
                        {proof.sourcePath}
                      </div>
                      <div className="mt-2 text-[11px] leading-5 text-amber-100/80">
                        {proof.publicPolicy}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
                  <CheckCircle2 className="h-4 w-4" />
                  Acceptance checks
                </div>
                <div className="mt-3 grid gap-2 text-xs leading-5 text-emerald-100/80">
                  <div>Native INOS route preserved.</div>
                  <div>Drive and Notion writes disabled.</div>
                  <div>Moves 1-3 mapped from current source material.</div>
                </div>
              </section>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
