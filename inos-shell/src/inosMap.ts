export const inos_epoch0 = {
  principles: {
    extend_only: true,
    single_source_of_truth: true,
    timeline_canonical: true,
  },
  layers: [
    {
      id: "L0",
      name: "Shell & Infra",
      components: [
        "INOS Shell UI",
        "TEAM AI // HQ",
        "CNGI / Venture HQs",
        "mcp-notion",
      ],
    },
    {
      id: "L1",
      name: "Identity & Entities",
      canonical_dbs: ["TEAM AI Agents (Roster)", "Entities / Ventures"],
    },
    {
      id: "L2",
      name: "Timeline",
      canonical_dbs: ["INOS Timeline (global event log)"],
    },
    {
      id: "L3",
      name: "Mission System (WAR)",
      canonical_dbs: ["[WAR] Missions", "[WAR] Mission Runs & AARs"],
    },
    {
      id: "L4",
      name: "Spec & Canon (ARC + ARK)",
      canonical_dbs: ["[ARC] Draft Blocks", "Canon Library"],
    },
    {
      id: "L5",
      name: "Governance (LAW)",
      canonical_dbs: [
        "LAW - Governance Rules",
        "LAW - Contracts & Templates",
      ],
    },
    {
      id: "L6",
      name: "History & Memory (MIND)",
      canonical_dbs: ["POLE Log", "Experiment Log", "AAR Summaries"],
    },
  ],
  pods: [
    { id: "WAR", role: "Operations", hq: "WAR HQ" },
    { id: "LAW", role: "Governance & Legal", hq: "LAW HQ" },
    { id: "ARC", role: "Architecture", hq: "ARC HQ" },
    { id: "ARK", role: "Canon & Library", hq: "ARK HQ" },
    { id: "MIND", role: "History & Memory", hq: "MIND HQ" },
    { id: "FOOD", role: "Food Ops (BAKE + CHEF)", hq: "FOOD HQ" },
    { id: "AIR", role: "Distribution & Reach", hq: "AIR HQ" },
    { id: "BIB", role: "Knowledge Library", hq: "BIB HQ" },
    { id: "CLASS", role: "Training & SOPs", hq: "CLASS HQ" },
    { id: "BOB", role: "Brand & Story", hq: "BOB HQ" },
  ],
  apps: [
    {
      id: "team_ai_console",
      description: "Primary nervous system UI for pods and missions",
      entry_points: ["TEAM AI // HQ", "Pod HQ pages"],
    },
    {
      id: "twin_console",
      description: "Twin (LDR) profile and interaction space",
      entry_points: ["Twin HQ", "Timeline + Missions views"],
    },
    {
      id: "venture_control_tower",
      description: "Per-venture dashboards (e.g., CNGI, GGP)",
      entry_points: ["Venture HQ pages"],
      filters: ["Entity", "Pod", "Mission tags"],
    },
  ],
} as const;

const ventures = {
  IE: {
    id: "IE",
    name: "Infinite Network Holdings",
    category: "HoldCo",
    pod: "IE",
    status: "active",
    description: "Holding co spine and owner-level command surface.",
    plugin: "ie-intranet",
    pluginUrl: (import.meta.env.VITE_IE_PLUGIN_URL as string | undefined) ?? "https://ie.intranet.theinfinitenetwork.com/",
  },
  FFC: {
    id: "FFC",
    name: "Fulcrum Fortress Consulting",
    category: "Venture",
    pod: "FFC",
    status: "active",
    description: "FFC intranet and employee ops surface.",
    plugin: "ffc-intranet",
    pluginUrl:
      (import.meta.env.VITE_FFC_PLUGIN_URL as string | undefined) ??
      (import.meta.env.DEV ? "http://localhost:5175/" : "https://ffc.theinfinitenetwork.com/"),
  },
  CNGI: {
    id: "CNGI",
    name: "CNGI",
    category: "Venture",
    pod: "CNGI",
    status: "active",
    description: "CNGI intranet and employee ops surface.",
    plugin: "cngi-intranet",
    pluginUrl: (import.meta.env.VITE_CNGI_PLUGIN_URL as string | undefined) ?? "https://cngi.intranet.theinfinitenetwork.com/",
  },
  GGP: {
    id: "GGP",
    name: "Grumpy Goat Pizza",
    category: "Venture",
    pod: "FOOD",
    status: "active",
    description: "Food venture dashboard and intranet surface for Grumpy Goat Pizza.",
    plugin: "ggp-intranet",
    pluginUrl: (import.meta.env.VITE_GGP_PLUGIN_URL as string | undefined) ?? "https://ggp.theinfinitenetwork.com/",
  },
} as const;

export type VentureId = keyof typeof ventures;
export type VentureRecord = (typeof ventures)[VentureId];

export function getVenture(id: string): VentureRecord | undefined {
  return ventures[id as VentureId];
}
