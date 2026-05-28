import type { TimelineEntry } from "../../types/inos";

export const mockTimeline: TimelineEntry[] = [
  {
    id: "timeline-1",
    occurred_at: "2026-01-21T09:15:00Z",
    type: "Decision",
    title: "Locked Epoch 0 schema for POLE and Time Wallet",
    entity: "Global",
    mission: "Epoch 0 Spine Stabilization",
  },
  {
    id: "timeline-2",
    occurred_at: "2026-01-21T12:05:00Z",
    type: "Note",
    title: "Guild roster draft for Chef and Builder Guilds",
    entity: "Global",
  },
  {
    id: "timeline-3",
    occurred_at: "2026-01-21T15:45:00Z",
    type: "Event",
    title: "IE-HQ Spine review session completed",
    entity: "IE",
    mission: "IE-HQ Spine UX Pass",
  },
];
