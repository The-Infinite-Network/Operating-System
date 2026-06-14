export type FulcrumStage = {
  name: string;
  purpose: string;
};

export type FulcrumMove = {
  id: string;
  move: number;
  title: string;
  goal: string;
  status: "mapped" | "partial" | "reserved";
  artifactCount: number;
  stages: FulcrumStage[];
};

export type DriveSource = {
  id: string;
  title: string;
  type: "docx" | "pdf" | "markdown" | "html";
  state: "ready" | "candidate" | "blocked" | "reference";
  lane: "FFC" | "IE" | "GGP" | "CNGI" | "IN";
};

export type CandidateBundle = {
  type: string;
  state: "queued" | "ready" | "blocked";
  target: string;
};

export type InternalProof = {
  id: string;
  title: string;
  state: "preserved" | "internal" | "blocked";
  lane: "FFC" | "GGP" | "IE" | "CNGI" | "IN";
  summary: string;
  sourcePath: string;
  publicPolicy: string;
};

export type ReviewGateState = {
  mode: "candidate-only";
  promotionRule: string;
  blockers: string[];
  warnings: string[];
};

export const fulcrumSourceFolder = {
  title: "Ffc",
  url: "https://drive.google.com/drive/folders/1xbCiYA5GWSX_HPqgzXZLXlITVNrjtiqy",
  createdAt: "2026-06-06",
} as const;

export const fulcrumReviewGate: ReviewGateState = {
  mode: "candidate-only",
  promotionRule: "candidate -> review -> promotion -> supersede",
  blockers: ["Provided Drive file URL returned 404 for this connection."],
  warnings: [
    "Older FFC folders are reference-only until explicitly promoted.",
    "No Drive, Notion, or canon writes are active in this slice.",
  ],
};

export const candidateBundleTypes = [
  "KB Article",
  "ARK Spec",
  "Reference Card",
  "SKILL.md",
  "Delta Report",
  "Timeline Payload",
  "Manifest",
] as const;

export const fulcrumMoves: FulcrumMove[] = [
  {
    id: "move-1",
    move: 1,
    title: "Mastering Yourself",
    goal: "Establish self-awareness, values alignment, personal identity, and strategic self-understanding.",
    status: "mapped",
    artifactCount: 12,
    stages: [
      { name: "Ignite", purpose: "Frame self-mastery as the root of outward success." },
      { name: "Blueprint", purpose: "Audit identity, values, purpose, strengths, and limiting beliefs." },
      { name: "Fortify", purpose: "Build inner strength, resilience, boundaries, and emotional mastery." },
      { name: "Anchor", purpose: "Refine values, purpose, and personal mission." },
      { name: "Envision", purpose: "Design future self, mindset, visualization, and roadmap." },
      { name: "Position", purpose: "Leverage strengths, unfair advantages, and decision frameworks." },
      { name: "Launch", purpose: "Convert inner work into embodied values-driven action." },
    ],
  },
  {
    id: "move-2",
    move: 2,
    title: "Mastering the Ability to Reason",
    goal: "Cultivate judgment, strategic thinking, bias mitigation, and ethical reasoning.",
    status: "mapped",
    artifactCount: 10,
    stages: [
      { name: "Illuminate", purpose: "Show the strategic power of reason." },
      { name: "Ground", purpose: "Connect emotional regulation to clear thinking." },
      { name: "Logic", purpose: "Develop logical acumen and argument mapping." },
      { name: "Objectivity", purpose: "Understand bias and mitigation methods." },
      { name: "Inquire", purpose: "Use strategic questioning to challenge assumptions." },
      { name: "Articulate", purpose: "Structure persuasive arguments." },
      { name: "Solve", purpose: "Apply decision-making and problem-solving systems." },
      { name: "Adapt", purpose: "Build intellectual agility and humility." },
      { name: "Navigate", purpose: "Reason through digital-age information pressure." },
      { name: "Ethos", purpose: "Connect reason to ethical Stoic action." },
    ],
  },
  {
    id: "move-3",
    move: 3,
    title: "Mastering the Art of Building the Right Teams",
    goal: "Build aligned, cohesive, high-performing teams as a strategic advantage.",
    status: "partial",
    artifactCount: 4,
    stages: [
      { name: "Synergy", purpose: "Show the power of teamwork and collective effort." },
      { name: "Values", purpose: "Anchor teams in shared identity, direction, and expectations." },
      { name: "Trust", purpose: "Protect communication, psychological safety, and accountability." },
      { name: "Design", purpose: "Shape talent, roles, diversity, and team dynamics." },
    ],
  },
  {
    id: "move-4",
    move: 4,
    title: "Mastering Strategic Execution",
    goal: "Reserved for the next Fulcrum source pass.",
    status: "reserved",
    artifactCount: 0,
    stages: [],
  },
  {
    id: "move-5",
    move: 5,
    title: "Mastering Systems and Scale",
    goal: "Reserved for the next Fulcrum source pass.",
    status: "reserved",
    artifactCount: 0,
    stages: [],
  },
  {
    id: "move-6",
    move: 6,
    title: "Mastering Legacy and Multiplication",
    goal: "Reserved for the next Fulcrum source pass.",
    status: "reserved",
    artifactCount: 0,
    stages: [],
  },
];

export const driveSources: DriveSource[] = [
  {
    id: "1_WK2zr8CbC0OA5bUCOS3Kc1A8ZM_sUWO",
    title: "THE FULCRUM SYSTEM OPERATIONAL FRAMEWORK- Building the Permanent Fortress.docx",
    type: "docx",
    state: "ready",
    lane: "FFC",
  },
  {
    id: "1J_135W-aCdqjXpkiTbp8He3CgN02WAJl",
    title: "The Fulcrum System (Guide)_.docx",
    type: "docx",
    state: "ready",
    lane: "FFC",
  },
  {
    id: "1ar5pooWie5aJgBaGm9yUu00iQnw14kMI",
    title: "Move 1_ Mastering Yourself.docx",
    type: "docx",
    state: "candidate",
    lane: "FFC",
  },
  {
    id: "1nxGII-Ece40dACzdlmp7oonPChOdE4kh",
    title: "FFC-GUIDE-comprehensive_mastery_program_working.docx",
    type: "docx",
    state: "candidate",
    lane: "FFC",
  },
  {
    id: "1FGKwvVnlnY2yv5ooRHWVN9apaiGczUe2",
    title: "LDR_Leviathan_2026-01-15_The_Time_Line___Grum.md",
    type: "markdown",
    state: "reference",
    lane: "IN",
  },
  {
    id: "1KakPW4jC7590hjZp5x9oaJUVZiOH6PWN",
    title: "Provided Drive file URL",
    type: "pdf",
    state: "blocked",
    lane: "FFC",
  },
];

export const candidateBundles: CandidateBundle[] = candidateBundleTypes.map((type, index) => ({
  type,
  state: index < 3 ? "ready" : index === 6 ? "blocked" : "queued",
  target:
    type === "Manifest"
      ? "Source access + mapping proof"
      : type === "Timeline Payload"
        ? "[IN] Timeline candidate event"
        : `${type} candidate draft`,
}));

export const internalProofRegistry: InternalProof[] = [
  {
    id: "ggp-operating-infrastructure-build",
    title: "Grumpy Goat Pizza - $145K Operating Infrastructure Build",
    state: "internal",
    lane: "GGP",
    summary:
      "Preserved LDR work-product proof for operating infrastructure, governance, training, financial controls, and repeatable execution systems. The dispute lane is payment for work product, not public GGP brand operations.",
    sourcePath: "Infinite-Earth/Infinite-Earth-Holdco/FFC/case-studies.html",
    publicPolicy:
      "Do not publish on the public GGP placeholder site. Public FFC use requires explicit legal/brand approval and revised framing.",
  },
];
