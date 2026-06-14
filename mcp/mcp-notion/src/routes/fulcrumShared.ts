export type FulcrumEnvelope = {
  current_coordinate: {
    move: string;
    stage: string;
    status: string;
    confidence: string;
    evidence: string[];
  };
  diagnosis: {
    what_is_true: string[];
    what_is_missing: string[];
    what_is_blocked: string[];
    what_is_assumed: string[];
  };
  next_move: {
    action: string;
    owner: string;
    eta: string;
    acceptance: {
      pass: string[];
      fail: string[];
    };
  };
  artifact_check: Array<{
    artifact: string;
    required: boolean;
    present: boolean;
    status: string;
    notes: string;
  }>;
  review_promotion_gate: {
    gate: string;
    blockers: string[];
    warnings: string[];
    promotion_rule: string;
  };
  routing: Record<string, string>;
  json_state: Record<string, unknown>;
};

export function buildFulcrumEnvelope(sourceLabel: string): FulcrumEnvelope {
  return {
    current_coordinate: {
      move: "Move 1 - Mastering Yourself",
      stage: "Blueprint",
      status: "candidate",
      confidence: "medium",
      evidence: [
        "Fulcrum doctrine files identified in FFC source set.",
        "Twin intake compatibility path preserved.",
        "No canon promotion or write gate is enabled in this wave.",
      ],
    },
    diagnosis: {
      what_is_true: [
        "FULCRUM is the active guide for FFC Fulcrum methodology work.",
        "The runtime is adapter-only and candidate-only.",
        "TWIN should consume approved Fulcrum outputs rather than generate Fulcrum methodology state.",
      ],
      what_is_missing: [
        "Approved intake evidence for the current operator or client packet.",
        "Promotion approval from downstream canonical authority.",
      ],
      what_is_blocked: [
        "No Notion or ARK write path is enabled in this stubbed wave.",
      ],
      what_is_assumed: [
        `Source received through ${sourceLabel} is candidate material until reviewed.`,
      ],
    },
    next_move: {
      action: "Review intake artifacts, confirm the active Move, and prepare one candidate bundle with explicit routing.",
      owner: "FULCRUM",
      eta: "same session",
      acceptance: {
        pass: [
          "Current coordinate is explicit.",
          "Missing evidence is named.",
          "One routed next move is returned.",
        ],
        fail: [
          "Readiness is claimed without evidence.",
          "Work is routed through deprecated executive-owner ownership.",
        ],
      },
    },
    artifact_check: [
      {
        artifact: "Drive intake packet",
        required: true,
        present: sourceLabel !== "compatibility_alias",
        status: sourceLabel !== "compatibility_alias" ? "candidate" : "missing",
        notes: "Review source documents before any readiness claim.",
      },
      {
        artifact: "Twin-approved source fields",
        required: true,
        present: false,
        status: "pending",
        notes: "TWIN consumes approved outputs; it does not originate Fulcrum canon fields.",
      },
      {
        artifact: "Candidate bundle draft",
        required: true,
        present: false,
        status: "queued",
        notes: "Bundle generation remains candidate-only in this wave.",
      },
    ],
    review_promotion_gate: {
      gate: "candidate_only",
      blockers: [
        "No canon promotion path is enabled.",
        "No sealed ARK write path is enabled.",
      ],
      warnings: [
        "No CAP number is assigned in this runtime layer.",
        "Compatibility alias remains active during Twin-to-Fulcrum transition.",
      ],
      promotion_rule: "candidate -> review -> promotion -> supersede",
    },
    routing: {
      TWIN: "Consume approved fields and route intent-level Fulcrum work.",
      CORE: "Handle executive synthesis, command translation, and operating oversight.",
      AIM: "Resolve routing ambiguity.",
      ARC: "Own architecture, schemas, and systems.",
      WAR: "Own execution.",
      LAW: "Own governance, legal, and compliance gates.",
      BANK: "Own pricing, margin, and financial-risk gates.",
      ARK: "Own candidate custody and seal authority outside this wave.",
      BUILD: "Own readiness validation outside this stub.",
    },
    json_state: {
      capability: "FULCRUM",
      source_mode: sourceLabel,
      candidate_only: true,
      cap_id: "Assigned by Registry v2.0 on create",
      writes_enabled: false,
      promotion_enabled: false,
      canonical_owner_repo: "TEAM-AI",
      runtime_adapter_repo: "Operating-System",
    },
  };
}
