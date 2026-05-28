export const INOS_EPOCH0_MAP = {
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
                "LAW — Governance Rules",
                "LAW — Contracts & Templates",
            ],
        },
        {
            id: "L6",
            name: "History & Memory (MIND)",
            canonical_dbs: ["POLE Log", "Experiment Log", "AAR Summaries"],
        },
    ],
    pods: [
        { id: "WAR", role: "Operations", hq: "WAR HQ", description: "Owns execution." },
        { id: "LAW", role: "Governance & Legal", hq: "LAW HQ", description: "Defines contracts." },
        { id: "ARC", role: "Architecture", hq: "ARC HQ", description: "Defines patterns." },
        { id: "ARK", role: "Canon & Library", hq: "ARK HQ", description: "Maintains records." },
        { id: "MIND", role: "History & Memory", hq: "MIND HQ", description: "Processes AARs." },
        { id: "FOOD", role: "Food Ops (BAKE + CHEF)", hq: "FOOD HQ", description: "Culinary systems." },
        { id: "AIR", role: "Distribution & Reach", hq: "AIR HQ", description: "Network growth." },
        { id: "BIB", role: "Knowledge Library", hq: "BIB HQ", description: "Static knowledge." },
        { id: "CLASS", role: "Training & SOPs", hq: "CLASS HQ", description: "Protocol training." },
        { id: "BOB", role: "Brand & Story", hq: "BOB HQ", description: "Narrative & Identity." },
    ],
};
