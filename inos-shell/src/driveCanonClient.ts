import type { DriveCanonListing } from "./types";
import { mcpClient } from "./services/mcpClient";
import {
  DRIVE_CANON_ID,
  DRIVE_CANON_ROOT_ID,
  listMockDriveCanonFolders,
} from "./mockDriveCanon";

export type DriveCanonSource = "mcp" | "mock";

export type DriveCanonListParams = {
  driveId: string;
  parentId: string | null;
  pageToken?: string | null;
};

export type DriveCanonListResult = {
  listing: DriveCanonListing;
  source: DriveCanonSource;
};

const DRIVE_CANON_SOURCE =
  (import.meta.env.VITE_DRIVE_CANON_SOURCE as DriveCanonSource | undefined) ??
  "mcp";

async function listCanonFoldersFromMcp(
  params: DriveCanonListParams
): Promise<DriveCanonListing> {
  const response = await mcpClient.fetchJson<{ data?: DriveCanonListing }>(
    "/tool/listCanonFolders",
    {
      method: "POST",
      body: JSON.stringify({
        params: {
          driveId: params.driveId,
          parentId: params.parentId,
          nextPageToken: params.pageToken ?? undefined,
        },
      }),
    }
  );

  if (response?.data) return response.data;
  return response as DriveCanonListing;
}

export async function listDriveCanonFolders(
  params: DriveCanonListParams
): Promise<DriveCanonListResult> {
  if (DRIVE_CANON_SOURCE === "mock") {
    return {
      listing: await listMockDriveCanonFolders(params.parentId),
      source: "mock",
    };
  }

  try {
    const listing = await listCanonFoldersFromMcp(params);
    return { listing, source: "mcp" };
  } catch {
    return {
      listing: await listMockDriveCanonFolders(params.parentId),
      source: "mock",
    };
  }
}

export { DRIVE_CANON_ID, DRIVE_CANON_ROOT_ID };
