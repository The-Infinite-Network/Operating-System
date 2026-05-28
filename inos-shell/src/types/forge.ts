
export type ForgeThreadStatus =
    | "Draft"
    | "Turn1_Issued"
    | "Turn2_Drafted"
    | "Awaiting_GREENLIGHT"
    | "Finalized"
    | "Archived";

export type ArtifactType =
    | "IntakeForm"
    | "PersonalityCard"
    | "OnePageBrief"
    | "DossierOutline"
    | "FullDossier"
    | "AgentSpec"
    | "RosterBrief"
    | "TimelineEvent"
    | "InstallSteps"
    | "NotionPrompt";

export type ArtifactStatus = "Draft" | "Final";

export type RunType = "Turn1" | "Turn2" | "Turn3" | "UpgradePass";
export type RunStatus = "Open" | "Completed" | "Blocked";

export type AutogenMode = "Off" | "Assist" | "Strict";
export type ExportedTo = "None" | "Notion" | "ARK" | "Timeline" | "Roster";
export type AutogenStatus = "None" | "Generated" | "Edited" | "Approved";

export interface AgentForgeThread {
    id: string;
    handle: string; // e.g. BANK
    working_title: string;
    requested_by: string;
    architect: string; // default ARC
    executor: string; // default WAR
    pod: string;
    anchor_entities: string; // Multi-line text
    status: ForgeThreadStatus;
    sync_key: string;
    challenge_pattern: string;
    notes: string;

    // Autogen v1.0
    autogen_mode: AutogenMode;
    turn2_prompt?: string;
    turn3_prompt?: string;
    last_autogen_at?: string;
    last_autogen_by?: string;

    // Links
    related_agent_id?: string;
    related_mission_id?: string;
    related_timeline_id?: string;

    // Artifact IDs
    artifacts: {
        intake?: string;
        card?: string;
        brief?: string;
        dossier?: string;
        spec?: string;
        roster_payload?: string;
    };

    created_at: string;
    updated_at: string;
}

export interface ForgeArtifact {
    id: string;
    thread_id: string;
    artifact_type: ArtifactType;
    version: string;
    status: ArtifactStatus;
    content: string; // markdown
    generated_by: string; // ARC/WAR/LDR

    // Autogen v1.0
    prompt?: string;
    model_tag?: string;
    checksum?: string;
    exported_to: ExportedTo;

    created_at: string;
}

export interface AgentForgeRun {
    id: string;
    thread_id: string;
    run_type: RunType;
    status: RunStatus;
    notes: string;
    inputs_artifact_id?: string;
    outputs_artifact_ids: string[];

    // Autogen v1.0
    autogen_status: AutogenStatus;
    autogen_errors?: string;

    created_at: string;
}
