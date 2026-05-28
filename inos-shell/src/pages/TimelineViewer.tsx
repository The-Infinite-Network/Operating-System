import { useEffect, useMemo, useState } from "react";
import { TimelineStream } from "../components";
import { mockTimeline } from "../data/mock/timeline";
import { mcpClient, MCPTimelineEvent } from "../services/mcpClient";
import { TimelineEvent } from "../types";
import { TimelineEntry } from "../types/inos";

function normalizeActor(actor: MCPTimelineEvent["actor"]): TimelineEvent["actor"] {
  if (!actor) {
    return null;
  }

  return {
    id: actor.id,
    name: actor.name ?? undefined,
    avatar_url: actor.avatar_url ?? undefined,
  };
}

function mapMcpEvent(evt: MCPTimelineEvent): TimelineEvent {
  return {
    id: evt.id,
    type: evt.type || evt.event_type || "note",
    timestamp: evt.timestamp || new Date().toISOString(),
    summary: evt.summary || evt.title || "Untitled event",
    detail: evt.notes || undefined,
    missionId: evt.missionId || undefined,
    actor: normalizeActor(evt.actor),
    external_refs: evt.external_refs ?? null,
    event_type: evt.event_type ?? null,
    source: evt.source ?? null,
    notes: evt.notes ?? null,
    title: evt.title,
  };
}

function mapMockEvent(evt: TimelineEntry): TimelineEvent {
  return {
    id: evt.id,
    type: evt.type,
    timestamp: evt.occurred_at,
    summary: evt.title,
    detail: evt.entity,
    missionId: evt.mission,
    title: evt.title,
    source: "mock",
  };
}

export default function TimelineViewer() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"mcp" | "mock">("mock");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fallback = useMemo(() => mockTimeline.map(mapMockEvent), []);

  const loadTimeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await mcpClient.timeline.list({ limit: 50 });
      const rows = response.events;
      setRequestId(response.request_id || null);
      const mapped: TimelineEvent[] = rows.map(mapMcpEvent);
      if (mapped.length > 0) {
        setEvents(mapped);
        setSource("mcp");
        return;
      }
    } catch (err: any) {
      console.warn("Timeline MCP fetch failed, using mock", err);
      const code = err?.code ? ` (${err.code})` : "";
      const rid = err?.request_id ? ` · request_id: ${err.request_id}` : "";
      setError(`${err?.message || "MCP fetch failed"}${code}${rid}`);
    } finally {
      setLoading(false);
    }
    setEvents(fallback);
    setSource("mock");
  };

  useEffect(() => {
    loadTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallback]);

  return (
    <div className="spine-page">
      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          Timeline Viewer
        </div>
        <div className="text-lg font-semibold mt-2">IE-HQ Event Stream</div>
        <div className="text-[12px] text-inos-muted mt-1">
          Canonical event stream surface. Pulls from MCP when available; mock data
          remains as fallback.
        </div>
        <div className="text-[10px] text-inos-muted mt-2">
          Source: {source.toUpperCase()}
          {requestId ? ` · request_id: ${requestId}` : ""}
        </div>
        {error && (
          <div className="mt-2 text-[11px] text-red-400">
            MCP Error: {error}
          </div>
        )}
      </div>

      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          Latest Events
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button className="btn-secondary" type="button" onClick={loadTimeline}>
            Retry MCP
          </button>
        </div>
        <TimelineStream
          events={events}
          className="mt-3 max-h-[480px]"
          isLoading={loading}
        />
      </div>
    </div>
  );
}
