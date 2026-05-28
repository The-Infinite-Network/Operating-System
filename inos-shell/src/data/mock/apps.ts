export type AppSurface = {
  id: string;
  name: string;
  status: string;
  description: string;
  owner: string;
  tags: string[];
};

export const mockApps: AppSurface[] = [
  {
    id: "app-ie-hq-spine",
    name: "IE-HQ Spine",
    status: "Live",
    description: "HoldCo spine surface for Infinite Earth governance and assets.",
    owner: "IE",
    tags: ["spine", "holdco", "governance"],
  },
  {
    id: "app-agent-forge",
    name: "Agent Forge",
    status: "Live",
    description: "TEAM AI agent creation surface with pipelines and briefs.",
    owner: "TEAM AI",
    tags: ["agents", "specs", "factory"],
  },
  {
    id: "app-switchyard",
    name: "Switchyard Control",
    status: "Concept",
    description: "Train routing, swaps, and parking orchestration.",
    owner: "ARC",
    tags: ["missions", "routing"],
  },
  {
    id: "app-timeline-viewer",
    name: "Timeline Viewer",
    status: "Live",
    description: "Unified event stream across missions, humans, and guilds.",
    owner: "LDR",
    tags: ["timeline", "events"],
  },
];
