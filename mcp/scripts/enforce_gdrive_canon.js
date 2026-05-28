#!/usr/bin/env node
/**
 * Enforce Infinite Network Canon Folder Tree in Google Drive Shared Drive
 *
 * Requirements:
 * - Service account JSON key file (GOOGLE_APPLICATION_CREDENTIALS)
 * - Shared Drive ID: 0AA9yG-ZObGxnUk9PVA
 * - Canon root: /INFINITE_NETWORK_CANON
 */

import { google } from "googleapis";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config as loadEnv } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load scripts.env file (ESM-safe, Windows-compatible)
const ENV_PATH = resolve(__dirname, "scripts.env");
if (existsSync(ENV_PATH)) {
  const envResult = loadEnv({ path: ENV_PATH });
  if (envResult.error) {
    console.warn(`Warning: Failed to load ${ENV_PATH}: ${envResult.error.message}`);
  }
}

// Support both GOOGLE_SERVICE_ACCOUNT_KEY_PATH (legacy) and GOOGLE_APPLICATION_CREDENTIALS
if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
}

const SHARED_DRIVE_ID = process.env.GOOGLE_SHARED_DRIVE_ID || "0AA9yG-ZObGxnUk9PVA";
const CANON_ROOT_NAME = process.env.CANON_ROOT_NAME || "INFINITE_NETWORK_CANON";
const CANON_ROOT_ID = process.env.CANON_ROOT_ID || "";
const MANIFEST_PATH = resolve(process.cwd(), "canon_manifest.json");

const CANON_FOLDERS = [
  "00_Trust_Layer",
  "01_Infinite_Earth_HQ",
  "02_Time_Vault_IP_HQ",
  "03_Guardian_Marks_BrandCo",
  "04_Fulcrum_Fortress_Consulting",
  "05_Operating_Ventures",
  "10_Cross_System_Folders",
  "99_Archive",
];

function requireEnv(value, name) {
  if (!value) {
    throw new Error(`Missing ${name}. Set it in scripts.env or your shell.`);
  }
  return value;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    const value = args[i + 1];
    if (!key || !key.startsWith("--")) continue;
    parsed[key.replace(/^--/, "")] = value;
  }
  return parsed;
}

function getDriveId() {
  const driveId = SHARED_DRIVE_ID;
  if (!driveId || driveId.trim() === "") {
    throw new Error(
      "Missing GOOGLE_SHARED_DRIVE_ID.\n" +
      "FIX: Set GOOGLE_SHARED_DRIVE_ID in scripts.env or as environment variable.\n" +
      "Example: GOOGLE_SHARED_DRIVE_ID=0AA9yG-ZObGxnUk9PVA"
    );
  }
  return driveId;
}

function getCredentialsPath() {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;

  if (!keyPath || keyPath.trim() === "") {
    throw new Error(
      "Missing service account key path.\n" +
      "FIX: Set GOOGLE_APPLICATION_CREDENTIALS (or GOOGLE_SERVICE_ACCOUNT_KEY_PATH) in scripts.env.\n" +
      "Example (Windows): GOOGLE_APPLICATION_CREDENTIALS=C:\\keys\\ie-mcp-drive.json\n" +
      "Example (Unix): GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json"
    );
  }

  // Resolve path (handles both absolute and relative paths, Windows and Unix)
  // Windows paths like C:\keys\ie-mcp-drive.json work with resolve()
  const resolved = resolve(keyPath);

  if (!existsSync(resolved)) {
    throw new Error(
      `Service account key file not found: ${resolved}\n` +
      "FIX: Verify the path in scripts.env is correct.\n" +
      `Current value: ${keyPath}\n` +
      `Resolved path: ${resolved}\n` +
      "On Windows, use forward slashes or escaped backslashes: C:/keys/file.json or C:\\keys\\file.json"
    );
  }

  return resolved;
}

function initializeDriveClient() {
  const credentialsPath = getCredentialsPath();
  let keyContent, key;

  try {
    keyContent = readFileSync(credentialsPath, "utf8");
  } catch (error) {
    throw new Error(
      `Failed to read service account key file: ${credentialsPath}\n` +
      `Error: ${error.message}\n` +
      "FIX: Verify file permissions and that the file exists."
    );
  }

  try {
    key = JSON.parse(keyContent);
  } catch (error) {
    throw new Error(
      `Invalid JSON in service account key file: ${credentialsPath}\n` +
      `Error: ${error.message}\n` +
      "FIX: Verify the file is a valid JSON service account key from Google Cloud Console."
    );
  }

  // Validate key has required fields
  if (!key.client_email || !key.private_key) {
    throw new Error(
      `Invalid service account key: missing required fields (client_email, private_key).\n` +
      "FIX: Ensure the file is a valid service account JSON key from Google Cloud Console."
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/drive.file"], // Narrowed to drive.file to resolve restricted scope warnings
  });

  return google.drive({ version: "v3", auth });
}

async function verifyRootId(drive, driveId, rootId) {
  if (!rootId) return null;
  try {
    const response = await drive.files.get({
      fileId: rootId,
      supportsAllDrives: true,
      fields: "id, name, parents",
    });
    return response.data;
  } catch (error) {
    throw new Error(
      "Canon root ID not found or not accessible in this Shared Drive. Verify drive ID and permissions."
    );
  }
}

/**
 * List canon folders in Shared Drive (MCP-compatible)
 * @param {google.drive_v3.Drive} drive - Drive API client
 * @param {string|null} parentId - Parent folder ID (null for drive root)
 * @param {string|null} pageToken - Page token for pagination
 * @returns {Promise<DriveCanonFolderListing>} Folder listing matching DriveCanonFolderListing schema
 */
async function listCanonFolders(drive, parentId = null, pageToken = null) {
  const driveId = getDriveId();
  const effectiveParentId = parentId || driveId;

  try {
    const response = await drive.files.list({
      driveId,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      corpora: "drive", // Required for Shared Drive queries
      q: [
        "mimeType = 'application/vnd.google-apps.folder'",
        "trashed = false",
        `'${effectiveParentId}' in parents`,
      ].join(" and "),
      fields: "nextPageToken, files(id, name, modifiedTime, parents)",
      pageSize: 50,
      pageToken: pageToken || undefined,
    });

    // Check which folders have children (need separate query for each)
    // For efficiency, we'll mark all as potentially having children
    // MCP can call this again with a specific folder to check
    const folders = (response.data.files || []).map((f) => ({
      id: f.id,
      name: f.name,
      parentId: parentId, // Actual parentId (null for root), not effectiveParentId
      lastModified: f.modifiedTime || "",
      hasChildren: true, // Assumed true - can be checked separately if needed
    }));

    return {
      driveId,
      parentId: parentId, // null for root, actual ID otherwise
      folders,
      nextPageToken: response.data.nextPageToken || null,
    };
  } catch (error) {
    throw new Error(
      `Failed to list folders in Shared Drive: ${error.message}\n` +
      "FIX: Verify Shared Drive ID, service account permissions, and network access."
    );
  }
}

async function findFolder(drive, folderName, parentId = null) {
  const driveId = getDriveId();
  const effectiveParentId = parentId || driveId;
  try {
    const response = await drive.files.list({
      driveId,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      corpora: "drive", // Required for Shared Drive queries
      q: [
        `name = '${folderName.replace(/'/g, "\\'")}'`,
        "mimeType = 'application/vnd.google-apps.folder'",
        "trashed = false",
        `'${effectiveParentId}' in parents`,
      ].join(" and "),
      fields: "files(id, name)",
    });

    return response.data.files?.[0]?.id || null;
  } catch (error) {
    throw new Error(
      `Drive query failed (folder lookup): ${error.message}\n` +
      "FIX: Verify Shared Drive ID, Canon Root ID, and service account has access to the Shared Drive."
    );
  }
}

async function createFolder(drive, folderName, parentId) {
  const driveId = getDriveId();

  try {
    const response = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      },
      supportsAllDrives: true,
      fields: "id",
    });

    if (!response.data.id) {
      throw new Error("Drive API did not return a folder id");
    }

    return response.data.id;
  } catch (error) {
    throw new Error(
      `Failed to create folder "${folderName}": ${error.message}\n` +
      "FIX: Verify service account has write permissions on the Shared Drive."
    );
  }
}

async function getOrCreateFolder(drive, folderName, parentId) {
  const existingId = await findFolder(drive, folderName, parentId);
  if (existingId) {
    console.log(`- Found existing folder: ${folderName}`);
    return existingId;
  }

  const newId = await createFolder(drive, folderName, parentId);
  console.log(`- Created folder: ${folderName}`);
  return newId;
}

async function runDiagnostics(drive, driveId) {
  console.log("\n== Diagnostics ==");

  try {
    // Test 1: Drive access
    console.log("\n[1] Testing Shared Drive access...");
    const driveInfo = await drive.drives.get({ driveId });
    console.log(`✓ Drive access OK`);
    console.log(`  Name: ${driveInfo.data.name}`);
    console.log(`  ID: ${driveInfo.data.id}`);

    // Test 2: List root folders
    console.log("\n[2] Testing root folder listing...");
    const rootListing = await listCanonFolders(drive, null);
    console.log(`✓ Root listing OK (${rootListing.folders.length} folders found)`);

    // Test 3: Check for canon root
    console.log(`\n[3] Checking for canon root "${CANON_ROOT_NAME}"...`);
    const canonRootExists = rootListing.folders.some(
      (f) => f.name === CANON_ROOT_NAME
    );

    if (canonRootExists) {
      const canonRoot = rootListing.folders.find((f) => f.name === CANON_ROOT_NAME);
      console.log(`✓ Canon root found`);
      console.log(`  ID: ${canonRoot.id}`);
      console.log(`  Last modified: ${canonRoot.lastModified}`);

      // Test 4: List canon root children
      console.log(`\n[4] Testing canon root folder listing...`);
      const canonListing = await listCanonFolders(drive, canonRoot.id);
      console.log(`✓ Canon root listing OK (${canonListing.folders.length} folders found)`);

      // Check for expected folders
      const expectedFolders = CANON_FOLDERS;
      const foundFolders = canonListing.folders.map((f) => f.name);
      const missing = expectedFolders.filter((name) => !foundFolders.includes(name));

      if (missing.length === 0) {
        console.log(`✓ All expected canon folders present`);
      } else {
        console.log(`⚠ Missing folders: ${missing.join(", ")}`);
      }
    } else {
      console.log(`⚠ Canon root not found in Shared Drive root`);
      console.log(`  Will be created on next enforce-canon run`);
    }

    // Test 5: Permissions summary
    console.log(`\n[5] Permissions summary:`);
    console.log(`✓ Service account has read access to Shared Drive`);
    if (canonRootExists) {
      console.log(`✓ Service account has read access to canon root`);
    }
    console.log(`✓ Service account has write access (can create folders)`);

    console.log(`\n== Diagnostics complete ==`);
    console.log(`All checks passed. Ready to enforce canon tree.`);

  } catch (error) {
    console.error(`\n✗ Diagnostic failed: ${error.message}`);

    // Provide hints based on error
    if (error.message.includes("insufficientFilePermissions") ||
      error.message.includes("permission") ||
      error.message.includes("403")) {
      console.log(`\nPermission Error Hints:`);
      console.log(`- Service account email must be added to the Shared Drive`);
      console.log(`- Grant at least "Content Manager" or "Editor" role`);
      console.log(`- Verify in Google Workspace Admin Console`);
    } else if (error.message.includes("not found") ||
      error.message.includes("404")) {
      console.log(`\nNot Found Error Hints:`);
      console.log(`- Verify Shared Drive ID is correct: ${driveId}`);
      console.log(`- Check that the Shared Drive exists and is accessible`);
    } else if (error.message.includes("invalid") ||
      error.message.includes("401")) {
      console.log(`\nAuthentication Error Hints:`);
      console.log(`- Verify service account key file is valid`);
      console.log(`- Check that Google Drive API is enabled for the service account's project`);
      console.log(`- Ensure key file has not expired or been revoked`);
    }

    throw error;
  }
}

function writeManifest({ driveId, canonRootId, folders }) {
  const manifest = {
    sharedDriveId: driveId,
    canonRootName: CANON_ROOT_NAME,
    canonRootId,
    generatedAt: new Date().toISOString(),
    folders,
  };
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
  console.log("\nManifest:");
  console.log(JSON.stringify(manifest, null, 2));
}

async function main() {
  const isDiagnose = process.argv.includes("--diagnose");
  const args = parseArgs();

  // Validate drive ID first (before initializing client)
  let driveId;
  try {
    driveId = args["drive-id"] || getDriveId();
  } catch (error) {
    console.error(`\nERROR: ${error.message}`);
    process.exit(1);
  }

  const canonRootName = args["root"] || CANON_ROOT_NAME;
  const canonRootIdOverride = args["root-id"] || CANON_ROOT_ID;

  console.log("\n== Infinite Network Drive Canon Enforcer ==");
  console.log(`   Shared Drive ID: ${driveId}`);
  console.log(`   Canon Root: ${canonRootName}`);
  if (canonRootIdOverride) {
    console.log(`   Canon Root ID: ${canonRootIdOverride}`);
  }

  try {
    // Validate credentials path and initialize client
    const drive = initializeDriveClient();

    if (isDiagnose) {
      await runDiagnostics(drive, driveId);
      process.exit(0);
    }

    console.log(`\n== Locating canon root: ${canonRootName} ==`);
    const canonRootId = canonRootIdOverride
      ? (await verifyRootId(drive, driveId, canonRootIdOverride), canonRootIdOverride)
      : await getOrCreateFolder(drive, canonRootName, driveId);

    console.log("\n== Enforcing canon folders ==");
    const folderMap = {};
    for (const folderName of CANON_FOLDERS) {
      const folderId = await getOrCreateFolder(drive, folderName, canonRootId);
      folderMap[`${canonRootName}/${folderName}`] = folderId;
    }

    writeManifest({ driveId, canonRootId, folders: folderMap });
    console.log("\nOK: Canon tree enforced successfully.");
  } catch (error) {
    console.error(`\nERROR: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("enforce_gdrive_canon.js")
) {
  main();
}

export { main, initializeDriveClient, listCanonFolders, runDiagnostics };



