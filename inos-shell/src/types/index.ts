export * from "./timeline";

export type Mission = {
    id: string;
    title: string;
    status: string;
    priority: number | null;
    owner: string | null;
    due_date?: string | null;
    last_edited_time?: string;
    mission_code?: string | null;
    entity?: string | null;
    room?: string | null;
    guild?: string | null;
    tags?: string[];
};

export type MissionTask = {
    id: string;
    title: string;
    status: string | null;
    owner: string | null;
    due_date: string | null;
    priority?: string | number | null;
    room?: string | null;
    entity?: string | null;
};

export type MissionRun = {
    id: string;
    title: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    notes: string | null;
    missionId: string;
};

export type MissionAAR = {
    id: string;
    title: string;
    status: string;
    summary: string | null;
    outcomes: string | null;
    lessons: string | null;
    runId: string | null;
    missionId: string;
};

export type DatabaseItem = {
    id: string;
    title: string;
};

export type POLERecord = {
    POLE_id: string;
    timestamp: string;
    content: { raw: string };
    entity?: string | null;
    mission_id?: string | null;
    title?: string | null;
    source?: string | null;
};

export type Toast = { id: string; message: string; type?: "success" | "error" };

export type Room = {
    code: string;
    name: string;
    entity?: string | null;
    owner?: string | null;
    status?: string | null;
    source?: "mcp" | "derived";
};

export type Guild = {
    code: string;
    name: string;
    entity?: string | null;
    status?: string | null;
    source?: "mcp" | "derived";
};

export type DriveCanonFolder = {
    id: string;
    name: string;
    parentId: string | null;
    lastModified: string;
    hasChildren: boolean;
};

export type DriveCanonFile = {
    id: string;
    name: string;
    mimeType: string;
    parentId: string | null;
    lastModified: string;
    size?: string;
    iconLink?: string;
    webViewLink?: string;
};

export type DriveCanonListing = {
    driveId: string;
    parentId: string | null;
    folders: DriveCanonFolder[];
    files: DriveCanonFile[];
    nextPageToken?: string | null;
};

export type Agent = {
    id: string;
    name: string;
    code: string;
    roleSummary: string;
    lane: string;
    status: string;
    principles: string[];
    can: string[];
    cannot: string[];
};
