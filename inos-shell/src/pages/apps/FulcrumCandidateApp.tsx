import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, FulcrumEnvelope } from "../../api";
import { candidateBundles, driveSources, fulcrumMoves } from "./fulcrumSystem";

type FulcrumViewState = {
  coordinate: FulcrumEnvelope["current_coordinate"] | null;
  diagnosis: FulcrumEnvelope["diagnosis"] | null;
  nextMove: FulcrumEnvelope["next_move"] | null;
  artifactCheck: FulcrumEnvelope["artifact_check"];
  gate: FulcrumEnvelope["review_promotion_gate"] | null;
  routing: FulcrumEnvelope["routing"] | null;
};

const initialState: FulcrumViewState = {
  coordinate: null,
  diagnosis: null,
  nextMove: null,
  artifactCheck: [],
  gate: null,
  routing: null,
};

type DiagnosisSection = {
  label: string;
  items: string[];
};

export default function FulcrumCandidateApp() {
  const [state, setState] = useState<FulcrumViewState>(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [coordinate, artifactCheck, nextMove] = await Promise.all([
          api.fulcrum.coordinate(),
          api.fulcrum.artifactCheck(),
          api.fulcrum.nextMove(),
        ]);

        setState({
          coordinate: coordinate.current_coordinate,
          diagnosis: coordinate.diagnosis,
          nextMove: nextMove.next_move,
          artifactCheck: artifactCheck.artifact_check,
          gate: artifactCheck.review_promotion_gate,
          routing: nextMove.routing,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "FULCRUM load failed");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-inos-muted">
              TEAM AI Capability Surface
            </p>
            <h2 className="text-2xl font-semibold">FULCRUM</h2>
            <p className="text-sm text-inos-muted mt-1">
              Candidate-only INOS surface for Fulcrum coordinate diagnosis, intake review, artifact readiness, and routed next moves.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="pill">Canonical: TEAM-AI</span>
            <span className="pill">Runtime: Operating-System</span>
            <span className="pill text-amber-300">Candidate Only</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="btn-secondary" to="/apps/twin-profile">
            Open Intake Alias
          </Link>
          <Link className="btn-secondary" to="/apps/ffc-intranet">
            Open FFC / Fulcrum System
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="card p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-inos-muted">Current Coordinate</div>
            {loading || !state.coordinate ? (
              <div className="mt-3 text-sm text-inos-muted animate-pulse">Loading coordinate...</div>
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                <div><span className="text-inos-muted">Move:</span> {state.coordinate.move}</div>
                <div><span className="text-inos-muted">Stage:</span> {state.coordinate.stage}</div>
                <div><span className="text-inos-muted">Status:</span> {state.coordinate.status}</div>
                <div><span className="text-inos-muted">Confidence:</span> {state.coordinate.confidence}</div>
                <div className="pt-2">
                  <div className="text-inos-muted mb-1">Evidence</div>
                  <ul className="space-y-1 text-[13px] text-white/90">
                    {state.coordinate.evidence.map((item) => <li key={item}>- {item}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="card p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-inos-muted">Diagnosis</div>
            {loading || !state.diagnosis ? (
              <div className="mt-3 text-sm text-inos-muted animate-pulse">Loading diagnosis...</div>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {([
                  { label: "What is true", items: state.diagnosis.what_is_true },
                  { label: "What is missing", items: state.diagnosis.what_is_missing },
                  { label: "What is blocked", items: state.diagnosis.what_is_blocked },
                  { label: "What is assumed", items: state.diagnosis.what_is_assumed },
                ] as DiagnosisSection[]).map(({ label, items }) => (
                  <div key={label} className="rounded-xl border border-inos-border/60 bg-[#0f172a] p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-inos-muted">{label}</div>
                    <ul className="mt-2 space-y-1 text-[13px]">
                      {items.map((item) => <li key={item}>- {item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-inos-muted">Next Move</div>
            {loading || !state.nextMove ? (
              <div className="mt-3 text-sm text-inos-muted animate-pulse">Loading next move...</div>
            ) : (
              <div className="mt-3 space-y-3 text-sm">
                <div><span className="text-inos-muted">Action:</span> {state.nextMove.action}</div>
                <div><span className="text-inos-muted">Owner:</span> {state.nextMove.owner}</div>
                <div><span className="text-inos-muted">ETA:</span> {state.nextMove.eta}</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-emerald-300">PASS</div>
                    <ul className="mt-2 space-y-1 text-[13px]">
                      {state.nextMove.acceptance.pass.map((item) => <li key={item}>- {item}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-rose-300">FAIL</div>
                    <ul className="mt-2 space-y-1 text-[13px]">
                      {state.nextMove.acceptance.fail.map((item) => <li key={item}>- {item}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-inos-muted">Artifact Readiness</div>
            <div className="mt-3 space-y-2 text-sm">
              {state.artifactCheck.map((item) => (
                <div key={item.artifact} className="rounded-xl border border-inos-border/60 bg-[#0f172a] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{item.artifact}</div>
                    <span className="pill">{item.status}</span>
                  </div>
                  <div className="mt-2 text-[12px] text-inos-muted">{item.notes}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-inos-muted">Review / Promotion Gate</div>
            {state.gate && (
              <div className="mt-3 space-y-3 text-sm">
                <div><span className="text-inos-muted">Gate:</span> {state.gate.gate}</div>
                <div><span className="text-inos-muted">Rule:</span> {state.gate.promotion_rule}</div>
                <div>
                  <div className="text-inos-muted mb-1">Blockers</div>
                  <ul className="space-y-1">{state.gate.blockers.map((item) => <li key={item}>- {item}</li>)}</ul>
                </div>
                <div>
                  <div className="text-inos-muted mb-1">Warnings</div>
                  <ul className="space-y-1">{state.gate.warnings.map((item) => <li key={item}>- {item}</li>)}</ul>
                </div>
              </div>
            )}
          </div>

          <div className="card p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-inos-muted">Routing</div>
            <div className="mt-3 space-y-2 text-sm">
              {state.routing && Object.entries(state.routing).map(([lane, note]) => (
                <div key={lane} className="rounded-xl border border-inos-border/60 bg-[#0f172a] p-3">
                  <div className="font-medium">{lane}</div>
                  <div className="mt-1 text-[12px] text-inos-muted">{note}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-inos-muted">Candidate Signals</div>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <div className="text-inos-muted mb-1">Mastery Map</div>
                <ul className="space-y-1 text-[13px]">
                  {fulcrumMoves.map((move) => (
                    <li key={move.id}>- Move {move.move}: {move.title} ({move.status})</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-inos-muted mb-1">Drive Intake</div>
                <ul className="space-y-1 text-[13px]">
                  {driveSources.slice(0, 4).map((source) => (
                    <li key={source.id}>- {source.title} [{source.state}]</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-inos-muted mb-1">Bundle Queue</div>
                <ul className="space-y-1 text-[13px]">
                  {candidateBundles.map((bundle) => (
                    <li key={bundle.type}>- {bundle.type}: {bundle.state}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
