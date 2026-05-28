export type InboxStatus = "Captured" | "Triaged" | "Classified" | "Blocked" | "Duplicate" | "Routed" | "Verified" | "Closed" | "Archived";
export type InboxSensitivity = "Internal" | "Public" | "Confidential" | "Secret";
export type InboxLane = "L0" | "L1" | "L2" | "L3" | "L4" | "L5";

export interface InboxItem {
    id: string;
    item: string; // The title/content
    summary?: string;
    status: InboxStatus;
    routing_status?: string; // Sometimes distinct from status?
    sensitivity?: InboxSensitivity;
    lane?: InboxLane;
    layer?: string;
    domain?: string;
    object_type?: string;
    owner_pod?: string;
    destination_db?: string;
    destination_db_code?: string;
    routing_key?: string;
    tags?: string[];
    captured_at?: string;
    source_type?: string;
    source_url?: string;
    source_ref?: string;
    target_url?: string;
    target_notion_id?: string;
    blocker_reason?: string;
    duplicate_of?: string;
    verified_at?: string;
    verified_by?: string;
    entity_id?: string;
    entity_name?: string;
    room_id?: string;
    room_name?: string;
    move_log?: string;
    // Any extra fields
    [key: string]: any;
}

export interface InboxFilter {
    status?: InboxStatus[];
    entity_id?: string;
    room_id?: string;
    search?: string;
    limit?: number;
    cursor?: string;
}
