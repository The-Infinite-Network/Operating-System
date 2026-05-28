import { google, drive_v3 } from "googleapis";
import { getConfig, Config } from "./config.js";
import { getGoogleAuth } from "./auth.js";
import { MCPError, ErrorCodes } from "./errors.js";

export type DriveCanonFolder = {
    id: string;
    name: string;
    parentId: string | null;
    lastModified: string;
    hasChildren: boolean;
};

export type DriveCanonFolderListing = {
    driveId: string;
    parentId: string | null;
    folders: DriveCanonFolder[];
    nextPageToken: string | null;
};

export type DriveGetMetadataResponse = {
    driveId: string;
    id: string;
    name: string;
    mimeType: string;
    parentIds: string[];
    lastModified: string;
    webViewLink?: string;
    sizeBytes?: number;
    hasChildren?: boolean;
};

export type DriveResolveCanonRootResponse = {
    driveId: string;
    canonRootName: string;
    canonRootId: string;
    lastModified: string;
};

export class GoogleDriveClient {
    private drive: drive_v3.Drive;
    private config: Config;

    constructor() {
        this.config = getConfig();
        const authBundle = getGoogleAuth(this.config, [
            "https://www.googleapis.com/auth/drive.file",
        ]);
        this.drive = google.drive({ version: "v3", auth: authBundle.auth });
    }

    private requireSharedDriveId(inputDriveId?: string) {
        const driveId = inputDriveId || this.config.GOOGLE_SHARED_DRIVE_ID;
        if (!driveId) {
            throw new MCPError(
                ErrorCodes.CONFIG_ERROR,
                "GOOGLE_SHARED_DRIVE_ID is required for Shared Drive operations",
                { code: "CONFIG_MISSING_SHARED_DRIVE_ID" }
            );
        }
        return driveId;
    }

    async listFolders(parentId: string | null): Promise<DriveCanonFolderListing> {
        const driveId = this.requireSharedDriveId();
        try {
            const effectiveParentId = parentId || driveId;
            const response = await this.drive.files.list({
                driveId,
                includeItemsFromAllDrives: true,
                supportsAllDrives: true,
                corpora: "drive",
                q: [
                    `mimeType = 'application/vnd.google-apps.folder'`,
                    "trashed = false",
                    `'${effectiveParentId}' in parents`,
                ].join(" and "),
                fields: "nextPageToken, files(id, name, modifiedTime)",
            });

            const folders: DriveCanonFolder[] = (response.data.files || []).map((f) => ({
                id: f.id!,
                name: f.name!,
                parentId: parentId,
                lastModified: f.modifiedTime!,
                hasChildren: true,
            }));

            return {
                driveId,
                parentId,
                folders,
                nextPageToken: response.data.nextPageToken || null,
            };
        } catch (error: any) {
            if (error instanceof MCPError) throw error;
            throw new MCPError(ErrorCodes.UPSTREAM_ERROR, `Failed to list folders: ${error.message}`, {
                code: "API_ERROR",
                originalError: error.message,
            });
        }
    }

    async findFolderByName(parentId: string | null, name: string): Promise<string | null> {
        const driveId = this.requireSharedDriveId();
        try {
            const effectiveParentId = parentId || driveId;
            const response = await this.drive.files.list({
                driveId,
                includeItemsFromAllDrives: true,
                supportsAllDrives: true,
                corpora: "drive",
                q: [
                    `name = '${name.replace(/'/g, "\\'")}'`,
                    `mimeType = 'application/vnd.google-apps.folder'`,
                    "trashed = false",
                    `'${effectiveParentId}' in parents`,
                ].join(" and "),
                fields: "files(id)",
            });
            return response.data.files?.[0]?.id || null;
        } catch (error: any) {
            if (error instanceof MCPError) throw error;
            throw new MCPError(ErrorCodes.UPSTREAM_ERROR, `Failed to find folder: ${error.message}`, {
                code: "API_ERROR",
                originalError: error.message,
            });
        }
    }

    async createFolder(parentId: string | null, name: string): Promise<string> {
        const driveId = this.requireSharedDriveId();
        const effectiveParentId = parentId || driveId;
        try {
            const existing = await this.findFolderByName(parentId, name);
            if (existing) return existing;

            const response = await this.drive.files.create({
                requestBody: {
                    name,
                    mimeType: "application/vnd.google-apps.folder",
                    parents: [effectiveParentId],
                },
                supportsAllDrives: true,
                fields: "id",
            });
            if (!response.data.id) {
                throw new Error("Drive API did not return a folder id");
            }
            return response.data.id;
        } catch (error: any) {
            if (error instanceof MCPError) throw error;
            throw new MCPError(ErrorCodes.UPSTREAM_ERROR, `Failed to create folder: ${error.message}`, {
                code: "API_ERROR",
                originalError: error.message,
            });
        }
    }

    async resolveCanonRoot(driveId: string, canonRootName: string): Promise<DriveResolveCanonRootResponse> {
        try {
            const resolvedDriveId = this.requireSharedDriveId(driveId);
            const response = await this.drive.files.list({
                driveId: resolvedDriveId,
                includeItemsFromAllDrives: true,
                supportsAllDrives: true,
                corpora: "drive",
                q: `name = '${canonRootName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
                fields: "files(id, name, modifiedTime)",
            });

            const files = response.data.files;
            if (!files || files.length === 0) {
                throw new MCPError(
                    ErrorCodes.INTERNAL_ERROR,
                    `Canon root folder '${canonRootName}' not found in drive '${driveId}'`,
                    { code: "NOT_FOUND", driveId, canonRootName }
                );
            }

            const root = files[0];
            return {
                driveId: resolvedDriveId,
                canonRootName,
                canonRootId: root.id!,
                lastModified: root.modifiedTime!,
            };
        } catch (error: any) {
            if (error instanceof MCPError) throw error;
            throw new MCPError(ErrorCodes.UPSTREAM_ERROR, `Failed to resolve canon root: ${error.message}`, {
                code: "API_ERROR",
                originalError: error.message,
            });
        }
    }

    async listChildren(args: {
        driveId: string;
        parentId: string | null;
        pageToken?: string | null;
        pageSize?: number;
        includeFiles?: boolean;
    }): Promise<DriveCanonFolderListing> {
        const { driveId, parentId, pageToken, pageSize = 50, includeFiles = false } = args;
        const resolvedDriveId = this.requireSharedDriveId(driveId);

        try {
            // If parentId is null, return the canon root itself as the single child (virtual root logic)
            if (parentId === null) {
                const canonRootName = this.config.CANON_ROOT_NAME || "INFINITE_NETWORK_CANON";
                const root = await this.resolveCanonRoot(resolvedDriveId, canonRootName);
                return {
                    driveId: resolvedDriveId,
                    parentId: null,
                    folders: [{
                        id: root.canonRootId,
                        name: root.canonRootName,
                        parentId: null,
                        lastModified: root.lastModified,
                        hasChildren: true,
                    }],
                    nextPageToken: null,
                };
            }

            const qParts = [`'${parentId}' in parents`, "trashed = false"];
            if (!includeFiles) {
                qParts.push("mimeType = 'application/vnd.google-apps.folder'");
            }

            const response = await this.drive.files.list({
                driveId: resolvedDriveId,
                includeItemsFromAllDrives: true,
                supportsAllDrives: true,
                corpora: "drive",
                q: qParts.join(" and "),
                fields: "nextPageToken, files(id, name, modifiedTime, mimeType)",
                pageToken: pageToken || undefined,
                pageSize: pageSize,
            });

            const folders: DriveCanonFolder[] = (response.data.files || []).map((f) => ({
                id: f.id!,
                name: f.name!,
                parentId: parentId,
                lastModified: f.modifiedTime!,
                hasChildren: f.mimeType === "application/vnd.google-apps.folder",
            }));

            return {
                driveId: resolvedDriveId,
                parentId: parentId,
                folders,
                nextPageToken: response.data.nextPageToken || null,
            };
        } catch (error: any) {
            throw new MCPError(ErrorCodes.UPSTREAM_ERROR, `Failed to list children: ${error.message}`, {
                code: "API_ERROR",
                originalError: error.message,
            });
        }
    }

    async getMetadata(args: { driveId: string; fileId: string }): Promise<DriveGetMetadataResponse> {
        const { driveId, fileId } = args;
        const resolvedDriveId = this.requireSharedDriveId(driveId);

        try {
            const response = await this.drive.files.get({
                fileId: fileId,
                supportsAllDrives: true,
                // includeItemsFromAllDrives is for list, but for get we just need supportsAllDrives
                fields: "id, name, mimeType, parents, modifiedTime, webViewLink, size",
            });

            const data = response.data;
            return {
                driveId: resolvedDriveId,
                id: data.id!,
                name: data.name!,
                mimeType: data.mimeType!,
                parentIds: data.parents || [],
                lastModified: data.modifiedTime!,
                webViewLink: data.webViewLink || undefined,
                sizeBytes: data.size ? parseInt(data.size) : undefined,
                hasChildren: data.mimeType === "application/vnd.google-apps.folder",
            };
        } catch (error: any) {
            throw new MCPError(ErrorCodes.UPSTREAM_ERROR, `Failed to get metadata: ${error.message}`, {
                code: "API_ERROR",
                originalError: error.message,
            });
        }
    }
}
