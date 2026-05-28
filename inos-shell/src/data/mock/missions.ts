import type { Mission } from "../../types/inos";

export const mockMissions: Mission[] = [
  {
    id: "mission-1",
    title: "Epoch 0 Spine Stabilization",
    status: "Active",
    priority: "Critical",
    entity: "Global",
  },
  {
    id: "mission-2",
    title: "CNGI Winter Menu Rollout",
    status: "Planning",
    priority: "High",
    entity: "CNGI",
  },
  {
    id: "mission-3",
    title: "Guild Standards Handbook",
    status: "In Review",
    priority: "Medium",
    entity: "Global",
  },
  {
    id: "mission-4",
    title: "IE-HQ Spine UX Pass",
    status: "Active",
    priority: "High",
    entity: "IE",
  },
];
