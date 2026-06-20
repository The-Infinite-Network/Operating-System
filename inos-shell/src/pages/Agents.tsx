import { useState, useEffect } from "react";
import { api } from "../api";
import { Agent } from "../types";
import TeamAIHQ from "./TeamAIHQ";

export default function Agents() {
  const [activeTopTab, setActiveTopTab] = useState<"roster" | "forge">("roster");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentSource, setAgentSource] = useState<"mcp" | "mock" | null>(null);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const { agents: data, source } = await api.listAgents();
        setAgents(data);
        setAgentSource(source);
      } catch (err) {
        console.error("Failed to load agents:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAgents();
  }, []);

  return (
    <div className="spine-page">
      <div className="flex flex-col gap-6">
        {/* Top Tab Switcher */}
        <div className="card p-2 flex gap-2 w-fit bg-slate-900/50 border-white/5">
          <button
            onClick={() => setActiveTopTab("roster")}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTopTab === "roster" ? "bg-inos-accent text-slate-950 shadow-lg shadow-inos-accent/20" : "text-inos-muted hover:text-white"}`}
          >
            ACTIVE ROSTER
          </button>
          <button
            onClick={() => setActiveTopTab("forge")}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTopTab === "forge" ? "bg-inos-accent text-slate-950 shadow-lg shadow-inos-accent/20" : "text-inos-muted hover:text-white"}`}
          >
            AGENT FORGE
          </button>
        </div>

        {activeTopTab === "roster" ? (
          <div className="space-y-6">
            <div className="card p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
                Lane Quick Primer
              </div>
              <div className="lane-grid">
                <div className="inos-card p-3">
                  <div className="text-sm font-semibold">Intent</div>
                  <div className="text-[11px] text-inos-muted mt-1">
                    TWIN and CORE define intent, focus, and priorities.
                  </div>
                </div>
                <div className="inos-card p-3">
                  <div className="text-sm font-semibold">Constraints</div>
                  <div className="text-[11px] text-inos-muted mt-1">
                    ARC and LAW define boundaries, policies, and guardrails.
                  </div>
                </div>
                <div className="inos-card p-3">
                  <div className="text-sm font-semibold">Execution</div>
                  <div className="text-[11px] text-inos-muted mt-1">
                    WAR owns execution through pods, functions, and entities.
                  </div>
                </div>
              </div>
              <div className="lane-footnote">
                TWIN and CORE own intent. ARC and LAW define boundaries. WAR owns
                execution. No agent may cross lanes.
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
                  Active Roster
                </div>
                {!loading && agentSource && (
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-sm uppercase tracking-widest border ${agentSource === "mcp" ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" : "text-[#555] border-[#1a1a1a]"}`}>
                    {agentSource === "mcp" ? "MCP Live" : "sample roster — MCP offline"}
                  </span>
                )}
              </div>
              {loading ? (
                <div className="p-8 text-center text-inos-muted animate-pulse">Loading Roster...</div>
              ) : (
                <div className="agents-grid">
                  {agents.map((agent) => (
                    <div key={agent.id} className="inos-card p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold">
                            {agent.name} - {agent.code}
                          </div>
                          <div className="text-[11px] text-inos-muted">
                            {agent.roleSummary}
                          </div>
                          <div className="text-[11px] text-inos-muted mt-1">
                            Lane: {agent.lane}
                          </div>
                        </div>
                        <span className="inos-pill text-[10px]">{agent.status}</span>
                      </div>
                      <div className="mt-2 text-[11px] text-inos-muted">
                        Core Principles
                      </div>
                      <ul className="agent-principles">
                        {agent.principles.map((principle) => (
                          <li key={principle}>{principle}</li>
                        ))}
                      </ul>
                      <div className="agent-boundaries">
                        <div>
                          <div className="text-[11px] text-inos-muted">Can</div>
                          <ul className="agent-principles">
                            {agent.can.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-[11px] text-inos-muted">Cannot</div>
                          <ul className="agent-principles">
                            {agent.cannot.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <TeamAIHQ />
        )}
      </div>
    </div>
  );
}

