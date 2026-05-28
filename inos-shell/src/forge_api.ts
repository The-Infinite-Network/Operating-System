import { AgentForgeThread, ForgeArtifact, AgentForgeRun, ForgeThreadStatus, ArtifactType, ArtifactStatus, RunType, RunStatus, ExportedTo } from "./types/forge";
import { FORGE_TEMPLATES } from "./data/forge_templates";

const THREADS_KEY = "inos_forge_threads";
const ARTIFACTS_KEY = "inos_forge_artifacts";
const RUNS_KEY = "inos_forge_runs";

const getSaved = <T>(key: string, def: T): T => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : def;
};

const save = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const ForgeAPI = {
    // Threads
    listThreads: async (): Promise<AgentForgeThread[]> => {
        return getSaved<AgentForgeThread[]>(THREADS_KEY, []);
    },

    getThread: async (id: string): Promise<AgentForgeThread | undefined> => {
        const list = await ForgeAPI.listThreads();
        return list.find(t => t.id === id);
    },

    createThread: async (params: { handle: string, title: string, pod: string, sync_key: string }): Promise<AgentForgeThread> => {
        const threads = await ForgeAPI.listThreads();
        const newThread: AgentForgeThread = {
            id: crypto.randomUUID(),
            handle: params.handle,
            working_title: params.title,
            requested_by: "LDR", // Default
            architect: "ARC", // Spec: default "ARC"
            executor: "WAR",  // Spec: default "WAR"
            pod: params.pod,
            anchor_entities: "",
            status: "Draft",
            sync_key: params.sync_key,
            challenge_pattern: "",
            notes: "",
            autogen_mode: "Assist",
            artifacts: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        threads.push(newThread);
        save(THREADS_KEY, threads);
        return newThread;
    },

    updateThread: async (id: string, updates: Partial<AgentForgeThread>): Promise<void> => {
        const threads = await ForgeAPI.listThreads();
        const idx = threads.findIndex(t => t.id === id);
        if (idx !== -1) {
            threads[idx] = { ...threads[idx], ...updates, updated_at: new Date().toISOString() };
            save(THREADS_KEY, threads);
        }
    },

    // Artifacts
    listArtifacts: async (threadId?: string): Promise<ForgeArtifact[]> => {
        const all = getSaved<ForgeArtifact[]>(ARTIFACTS_KEY, []);
        return threadId ? all.filter(a => a.thread_id === threadId) : all;
    },

    createArtifact: async (threadId: string, type: ArtifactType, content: string, status: ArtifactStatus = "Draft"): Promise<ForgeArtifact> => {
        const arts = await ForgeAPI.listArtifacts();
        const newArt: ForgeArtifact = {
            id: crypto.randomUUID(),
            thread_id: threadId,
            artifact_type: type,
            version: "1.0",
            status,
            content,
            generated_by: "FORGE",
            exported_to: "None",
            created_at: new Date().toISOString(),
        };
        arts.push(newArt);
        save(ARTIFACTS_KEY, arts);
        return newArt;
    },

    updateArtifact: async (id: string, content: string, status: ArtifactStatus = "Draft"): Promise<ForgeArtifact> => {
        const all = getSaved<ForgeArtifact[]>(ARTIFACTS_KEY, []);
        const idx = all.findIndex(a => a.id === id);
        if (idx === -1) throw new Error("Artifact not found");
        all[idx].content = content;
        all[idx].status = status;
        save(ARTIFACTS_KEY, all);
        return all[idx];
    },

    // Runs
    runs: {
        list: async (threadId?: string): Promise<AgentForgeRun[]> => {
            const all = getSaved<AgentForgeRun[]>(RUNS_KEY, []);
            return threadId ? all.filter(r => r.thread_id === threadId) : all;
        },

        create: async (threadId: string, type: RunType, notes: string): Promise<AgentForgeRun> => {
            const runs = await ForgeAPI.runs.list();
            const newRun: AgentForgeRun = {
                id: crypto.randomUUID(),
                thread_id: threadId,
                run_type: type,
                status: "Completed",
                notes,
                outputs_artifact_ids: [],
                autogen_status: "None",
                created_at: new Date().toISOString(),
            };
            runs.push(newRun);
            save(RUNS_KEY, runs);
            return newRun;
        },
    },

    // Lifecycle Methods
    emitTurn1: async (threadId: string): Promise<void> => {
        const thread = await ForgeAPI.getThread(threadId);
        if (!thread) return;

        const intake = await ForgeAPI.createArtifact(threadId, "IntakeForm", FORGE_TEMPLATES.INTAKE_FORM);
        await ForgeAPI.createArtifact(threadId, "NotionPrompt", "Prompt to paste into Notion to create agent forge artifacts");
        await ForgeAPI.createArtifact(threadId, "InstallSteps", "Install steps checklist");

        await ForgeAPI.updateThread(threadId, {
            status: "Turn1_Issued",
            artifacts: { ...thread.artifacts, intake: intake.id }
        });

        await ForgeAPI.runs.create(threadId, "Turn1", "Emitted Turn 1 package (Intake, Prompt, Install Steps).");
    },

    generateTurn2: async (threadId: string): Promise<void> => {
        const thread = await ForgeAPI.getThread(threadId);
        if (!thread || thread.status !== "Turn1_Issued") return;

        const arts = await ForgeAPI.listArtifacts(threadId);
        const intake = arts.find(a => a.artifact_type === "IntakeForm");
        if (!intake) return;

        const cardContent = `[AUTO-GENERATED PERSONALITY CARD]\nSource Thread: ${thread.handle}\n\n${FORGE_TEMPLATES.TURN2_AUTOGEN_PROMPT_v1}`;
        const briefContent = `[AUTO-GENERATED ONE-PAGE BRIEF]\nHandle: ${thread.handle}\n\n${FORGE_TEMPLATES.TURN2_AUTOGEN_PROMPT_v1}`;
        const outlineContent = `[AUTO-GENERATED DOSSIER OUTLINE]\n\n${FORGE_TEMPLATES.TURN2_AUTOGEN_PROMPT_v1}`;

        const card = await ForgeAPI.createArtifact(threadId, "PersonalityCard", cardContent, "Draft");
        const brief = await ForgeAPI.createArtifact(threadId, "OnePageBrief", briefContent, "Draft");
        const outline = await ForgeAPI.createArtifact(threadId, "DossierOutline", outlineContent, "Draft");

        const runs = await ForgeAPI.runs.list();
        const run: AgentForgeRun = {
            id: crypto.randomUUID(),
            thread_id: threadId,
            run_type: "Turn2",
            status: "Completed",
            notes: "AUTO-GEN Turn 2 initiated.",
            outputs_artifact_ids: [card.id, brief.id, outline.id],
            autogen_status: "Generated",
            created_at: new Date().toISOString(),
        };
        runs.push(run);
        save(RUNS_KEY, runs);

        await ForgeAPI.updateThread(threadId, {
            status: "Turn2_Drafted",
            last_autogen_at: new Date().toISOString(),
            last_autogen_by: "Forge.GenerateTurn2",
            artifacts: { ...thread.artifacts, card: card.id, brief: brief.id }
        });
    },

    setGreenlightReady: async (threadId: string): Promise<void> => {
        await ForgeAPI.updateThread(threadId, { status: "Awaiting_GREENLIGHT" });
    },

    generateTurn3: async (threadId: string): Promise<void> => {
        const thread = await ForgeAPI.getThread(threadId);
        if (!thread || thread.status !== "Awaiting_GREENLIGHT") return;

        const dossier = await ForgeAPI.createArtifact(threadId, "FullDossier", `[AUTO-GEN FINAL DOSSIER]\nHandle: ${thread.handle}\n\n${FORGE_TEMPLATES.TURN2_AUTOGEN_PROMPT_v1}`, "Final");
        const spec = await ForgeAPI.createArtifact(threadId, "AgentSpec", `[AUTO-GEN AGENT SPEC v1.0]\n\n${FORGE_TEMPLATES.TURN2_AUTOGEN_PROMPT_v1}`, "Final");
        const roster = await ForgeAPI.createArtifact(threadId, "RosterBrief", `[AUTO-GEN ROSTER BRIEF]\n\n${FORGE_TEMPLATES.TURN2_AUTOGEN_PROMPT_v1}`, "Final");
        const timeline = await ForgeAPI.createArtifact(threadId, "TimelineEvent", FORGE_TEMPLATES.TIMELINE_EVENT, "Final");

        const runs = await ForgeAPI.runs.list();
        const run: AgentForgeRun = {
            id: crypto.randomUUID(),
            thread_id: threadId,
            run_type: "Turn3",
            status: "Completed",
            notes: "AUTO-GEN Turn 3 package.",
            outputs_artifact_ids: [dossier.id, spec.id, roster.id, timeline.id],
            autogen_status: "Generated",
            created_at: new Date().toISOString(),
        };
        runs.push(run);
        save(RUNS_KEY, runs);

        await ForgeAPI.updateThread(threadId, {
            status: "Finalized",
            last_autogen_at: new Date().toISOString(),
            last_autogen_by: "Forge.GenerateTurn3",
            artifacts: { ...thread.artifacts, dossier: dossier.id, spec: spec.id, roster_payload: roster.id }
        });
    },

    markArtifactFinal: async (artifactId: string): Promise<void> => {
        const arts = await ForgeAPI.listArtifacts();
        const idx = arts.findIndex(a => a.id === artifactId);
        if (idx !== -1) {
            arts[idx].status = "Final";
            save(ARTIFACTS_KEY, arts);
        }
    },

    exportMarkers: async (artifactId: string, destination: ExportedTo): Promise<void> => {
        const arts = await ForgeAPI.listArtifacts();
        const idx = arts.findIndex(a => a.id === artifactId);
        if (idx !== -1) {
            arts[idx].exported_to = destination;
            save(ARTIFACTS_KEY, arts);
        }
    },

    finalizeTurn3: async (threadId: string): Promise<void> => {
        const thread = await ForgeAPI.getThread(threadId);
        if (!thread) return;

        const dossier = await ForgeAPI.createArtifact(threadId, "FullDossier", "[Full Dossier Content Placeholder]", "Final");
        const spec = await ForgeAPI.createArtifact(threadId, "AgentSpec", "[Agent Spec Content Placeholder]", "Final");
        const roster = await ForgeAPI.createArtifact(threadId, "RosterBrief", "[Roster Brief Content Placeholder]", "Final");
        const timeline = await ForgeAPI.createArtifact(threadId, "TimelineEvent", FORGE_TEMPLATES.TIMELINE_EVENT, "Final");

        await ForgeAPI.updateThread(threadId, {
            status: "Finalized",
            artifacts: { ...thread.artifacts, dossier: dossier.id, spec: spec.id, roster_payload: roster.id }
        });

        await ForgeAPI.runs.create(threadId, "Turn3", "Finalized Turn 3 package and artifacts.");
    }
};
