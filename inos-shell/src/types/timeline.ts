export type EventType = "mission_update" | "POLE" | "alert" | "milestone" | "incident" | "note";

export interface TimelineEvent {
    id: string;
    // Maps to "type" or "event_type" in Notion
    type: string;
    // Standardized event type for UI logic
    uiType?: EventType;
    timestamp: string; // ISO 8601
    summary: string;
    detail?: string;
    linkedMissionId?: string;
    missionId?: string; // Backwards compat
    syncKey?: string;
    agentHandle?: string;
    actor?: { id: string; name?: string; avatar_url?: string } | null;
    external_refs?: string | null;

    // Legacy fields from api.ts mapping (keeping for safety during refactor)
    event_type?: string | null;
    source?: string | null;
    notes?: string | null;
    title?: string;
    date?: string;
}

export interface POLEPayload {
    type: "POLE" | "milestone" | "incident" | "note";
    summary: string;
    detail?: string;
    linkedMissionId?: string;
    duration_minutes?: number;
    value_level?: "Low" | "Medium" | "High" | "Critical";
    // Additional fields for API compatibility
    mission_id?: string;
    entity?: string;
    event_type?: string;
}
