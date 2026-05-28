import type { DriveCanonFolder, DriveCanonListing } from "./types";

export const DRIVE_CANON_ID = "0AA9yG-ZObGxnUk9PVA";
export const DRIVE_CANON_ROOT_ID = "drive-root";

const ROOT_FOLDER: DriveCanonFolder = {
  id: DRIVE_CANON_ROOT_ID,
  name: "INFINITE_NETWORK_CANON",
  parentId: null,
  lastModified: "2025-12-18T21:10:00Z",
  hasChildren: true,
};

const MOCK_LISTINGS: Record<string, DriveCanonListing> = {
  root: {
    driveId: DRIVE_CANON_ID,
    parentId: null,
    folders: [ROOT_FOLDER],
    files: [],
  },
  [DRIVE_CANON_ROOT_ID]: {
    driveId: DRIVE_CANON_ID,
    parentId: DRIVE_CANON_ROOT_ID,
    folders: [
      {
        id: "canon-00-governance",
        name: "00_GOVERNANCE",
        parentId: DRIVE_CANON_ROOT_ID,
        lastModified: "2025-12-17T09:14:00Z",
        hasChildren: true,
      },
      {
        id: "canon-01-operations",
        name: "01_OPERATIONS",
        parentId: DRIVE_CANON_ROOT_ID,
        lastModified: "2025-12-19T14:32:00Z",
        hasChildren: true,
      },
      {
        id: "canon-02-products",
        name: "02_PRODUCTS",
        parentId: DRIVE_CANON_ROOT_ID,
        lastModified: "2025-12-15T16:40:00Z",
        hasChildren: true,
      },
      {
        id: "canon-90-archive",
        name: "90_ARCHIVE",
        parentId: DRIVE_CANON_ROOT_ID,
        lastModified: "2025-11-28T22:05:00Z",
        hasChildren: false,
      },
    ],
    files: [],
  },
  "canon-00-governance": {
    driveId: DRIVE_CANON_ID,
    parentId: "canon-00-governance",
    folders: [
      {
        id: "canon-00-legal",
        name: "Legal",
        parentId: "canon-00-governance",
        lastModified: "2025-12-01T12:00:00Z",
        hasChildren: false,
      },
      {
        id: "canon-00-policies",
        name: "Policies",
        parentId: "canon-00-governance",
        lastModified: "2025-12-10T08:20:00Z",
        hasChildren: false,
      },
      {
        id: "canon-00-boards",
        name: "Boards",
        parentId: "canon-00-governance",
        lastModified: "2025-12-05T18:30:00Z",
        hasChildren: false,
      },
    ],
    files: [],
  },
  "canon-01-operations": {
    driveId: DRIVE_CANON_ID,
    parentId: "canon-01-operations",
    folders: [
      {
        id: "canon-01-ops-systems",
        name: "Ops Systems",
        parentId: "canon-01-operations",
        lastModified: "2025-12-18T05:45:00Z",
        hasChildren: true,
      },
      {
        id: "canon-01-people",
        name: "People",
        parentId: "canon-01-operations",
        lastModified: "2025-12-16T11:05:00Z",
        hasChildren: false,
      },
      {
        id: "canon-01-finance",
        name: "Finance",
        parentId: "canon-01-operations",
        lastModified: "2025-12-13T19:50:00Z",
        hasChildren: false,
      },
    ],
    files: [],
  },
  "canon-01-ops-systems": {
    driveId: DRIVE_CANON_ID,
    parentId: "canon-01-ops-systems",
    folders: [
      {
        id: "canon-01-playbooks",
        name: "Playbooks",
        parentId: "canon-01-ops-systems",
        lastModified: "2025-12-11T13:20:00Z",
        hasChildren: false,
      },
      {
        id: "canon-01-sops",
        name: "SOPs",
        parentId: "canon-01-ops-systems",
        lastModified: "2025-12-09T09:10:00Z",
        hasChildren: false,
      },
    ],
    files: [],
  },
  "canon-02-products": {
    driveId: DRIVE_CANON_ID,
    parentId: "canon-02-products",
    folders: [
      {
        id: "canon-02-ino",
        name: "Infinite Network OS",
        parentId: "canon-02-products",
        lastModified: "2025-12-14T07:15:00Z",
        hasChildren: true,
      },
      {
        id: "canon-02-ffc",
        name: "Fulcrum Fortress",
        parentId: "canon-02-products",
        lastModified: "2025-12-03T21:05:00Z",
        hasChildren: false,
      },
    ],
    files: [],
  },
  "canon-02-ino": {
    driveId: DRIVE_CANON_ID,
    parentId: "canon-02-ino",
    folders: [
      {
        id: "canon-02-ino-specs",
        name: "Specs",
        parentId: "canon-02-ino",
        lastModified: "2025-12-02T10:00:00Z",
        hasChildren: false,
      },
      {
        id: "canon-02-ino-design",
        name: "Design",
        parentId: "canon-02-ino",
        lastModified: "2025-12-07T16:22:00Z",
        hasChildren: false,
      },
    ],
    files: [],
  },
};

export async function listMockDriveCanonFolders(
  parentId: string | null
): Promise<DriveCanonListing> {
  const key = parentId ?? "root";
  const listing = MOCK_LISTINGS[key];
  if (!listing) {
    return {
      driveId: DRIVE_CANON_ID,
      parentId,
      folders: [],
      files: [],
    };
  }
  return listing;
}
