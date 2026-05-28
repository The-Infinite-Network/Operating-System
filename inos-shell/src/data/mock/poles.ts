import type { POLE } from "../../types/inos";

export const mockPOLEs: POLE[] = [
  {
    id: "POLE-1",
    timestamp_start: "2026-01-21T08:30:00Z",
    duration_minutes: 90,
    time_mode: "Deep Work",
    title: "Spine review and schema audit",
    entity_context: "Global",
    verification_status: "SelfVerified",
  },
  {
    id: "POLE-2",
    timestamp_start: "2026-01-21T11:10:00Z",
    duration_minutes: 45,
    time_mode: "Stewardship",
    title: "Guild roster alignment",
    entity_context: "Global",
    verification_status: "Unverified",
  },
  {
    id: "POLE-3",
    timestamp_start: "2026-01-21T14:20:00Z",
    duration_minutes: 60,
    time_mode: "Mastery",
    title: "Agent Forge prototype study",
    entity_context: "IE",
    verification_status: "PeerVerified",
  },
];
