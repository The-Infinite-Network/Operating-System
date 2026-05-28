# Validation Guide: Drive Canon Enforcer

## Prerequisites Setup

### 1. Create scripts.env file

```powershell
# Navigate to scripts directory
cd mcp\scripts

# Copy example file
Copy-Item scripts.env.example scripts.env

# Edit scripts.env and set:
# GOOGLE_APPLICATION_CREDENTIALS=C:\keys\your-service-account.json
# GOOGLE_SHARED_DRIVE_ID=YOUR_SHARED_DRIVE_ID
```

### 2. Verify service account key file exists

```powershell
# Check if key file exists
Test-Path C:\keys\your-service-account.json

# If false, create directory and place key file
New-Item -ItemType Directory -Force -Path C:\keys
# Then place your service-account-key.json file at C:\keys\your-service-account.json
```

## Acceptance Tests

### Test 1: Missing Environment Variables

**Command:**

```powershell
cd mcp\scripts
$env:GOOGLE_APPLICATION_CREDENTIALS = ""
$env:GOOGLE_SHARED_DRIVE_ID = ""
Remove-Item scripts.env -ErrorAction SilentlyContinue
node enforce_gdrive_canon.js
```

**Expected Output:**

```
ERROR: Missing service account key path.
FIX: Set GOOGLE_APPLICATION_CREDENTIALS (or GOOGLE_SERVICE_ACCOUNT_KEY_PATH) in scripts.env.
Example (Windows): GOOGLE_APPLICATION_CREDENTIALS=C:\keys\your-service-account.json
```

### Test 2: Invalid Key File Path

**Command:**

```powershell
# Create scripts.env with invalid path
@"
GOOGLE_APPLICATION_CREDENTIALS=C:\keys\nonexistent.json
GOOGLE_SHARED_DRIVE_ID=YOUR_SHARED_DRIVE_ID
"@ | Out-File -FilePath scripts.env -Encoding utf8

node enforce_gdrive_canon.js
```

**Expected Output:**

```
ERROR: Service account key file not found: C:\keys\nonexistent.json
FIX: Verify the path in scripts.env is correct.
Current value: C:\keys\nonexistent.json
Resolved path: C:\keys\nonexistent.json
On Windows, use forward slashes or escaped backslashes: C:/keys/file.json or C:\\keys\\file.json
```

### Test 3: Diagnostic Mode

**Command:**

```powershell
# Ensure scripts.env is properly configured
# GOOGLE_APPLICATION_CREDENTIALS=C:\keys\your-service-account.json
# GOOGLE_SHARED_DRIVE_ID=YOUR_SHARED_DRIVE_ID

npm run diagnose
# or
node enforce_gdrive_canon.js --diagnose
```

**Expected Output (Success):**

```
== Infinite Network Drive Canon Enforcer ==
   Shared Drive ID: YOUR_SHARED_DRIVE_ID
   Canon Root: INFINITE_NETWORK_CANON

== Diagnostics ==

[1] Testing Shared Drive access...
✓ Drive access OK
  Name: Infinite Network Canon Drive
  ID: YOUR_SHARED_DRIVE_ID

[2] Testing root folder listing...
✓ Root listing OK (5 folders found)

[3] Checking for canon root "INFINITE_NETWORK_CANON"...
✓ Canon root found
  ID: 1a2b3c4d5e6f7g8h9i0j
  Last modified: 2025-12-28T10:00:00.000Z

[4] Testing canon root folder listing...
✓ Canon root listing OK (8 folders found)

✓ All expected canon folders present

[5] Permissions summary:
✓ Service account has read access to Shared Drive
✓ Service account has read access to canon root
✓ Service account has write access (can create folders)

== Diagnostics complete ==
All checks passed. Ready to enforce canon tree.
```

**Expected Output (Permission Error):**

```
✗ Diagnostic failed: insufficientFilePermissions: The user does not have sufficient permissions for this file.

Permission Error Hints:
- Service account email must be added to the Shared Drive
- Grant at least "Content Manager" or "Editor" role
- Verify in Google Workspace Admin Console
```

### Test 4: Enforce Canon Tree (Success)

**Command:**

```powershell
npm run enforce-canon
```

**Expected Output:**

```
== Infinite Network Drive Canon Enforcer ==
   Shared Drive ID: YOUR_SHARED_DRIVE_ID
   Canon Root: INFINITE_NETWORK_CANON

== Locating canon root: INFINITE_NETWORK_CANON ==
- Found existing folder: INFINITE_NETWORK_CANON

== Enforcing canon folders ==
- Found existing folder: 00_Trust_Layer
- Found existing folder: 01_Infinite_Earth_HQ
- Found existing folder: 02_Time_Vault_IP_HQ
- Found existing folder: 03_Guardian_Marks_BrandCo
- Found existing folder: 04_Fulcrum_Fortress_Consulting
- Found existing folder: 05_Operating_Ventures
- Found existing folder: 10_Cross_System_Folders
- Found existing folder: 99_Archive

Manifest:
{
  "sharedDriveId": "YOUR_SHARED_DRIVE_ID",
  "canonRootName": "INFINITE_NETWORK_CANON",
  "canonRootId": "1a2b3c4d5e6f7g8h9i0j",
  "generatedAt": "2025-12-28T22:11:00.000Z",
  "folders": {
    "INFINITE_NETWORK_CANON/00_Trust_Layer": "2b3c4d5e6f7g8h9i0j1k",
    "INFINITE_NETWORK_CANON/01_Infinite_Earth_HQ": "3c4d5e6f7g8h9i0j1k2l",
    "INFINITE_NETWORK_CANON/02_Time_Vault_IP_HQ": "4d5e6f7g8h9i0j1k2l3m",
    "INFINITE_NETWORK_CANON/03_Guardian_Marks_BrandCo": "5e6f7g8h9i0j1k2l3m4n",
    "INFINITE_NETWORK_CANON/04_Fulcrum_Fortress_Consulting": "6f7g8h9i0j1k2l3m4n5o",
    "INFINITE_NETWORK_CANON/05_Operating_Ventures": "7g8h9i0j1k2l3m4n5o6p",
    "INFINITE_NETWORK_CANON/10_Cross_System_Folders": "8h9i0j1k2l3m4n5o6p7q",
    "INFINITE_NETWORK_CANON/99_Archive": "9i0j1k2l3m4n5o6p7q8r"
  }
}

OK: Canon tree enforced successfully.
```

### Test 5: Idempotency (Re-run without duplicates)

**Command:**

```powershell
# Run twice in a row
npm run enforce-canon
npm run enforce-canon
```

**Expected:** Both runs show "Found existing folder" for all folders, no duplicates created.

### Test 6: listCanonFolders Function Shape

**Command:** Create a test script `test_list.js`:

```javascript
import { initializeDriveClient, listCanonFolders } from './enforce_gdrive_canon.js';

const drive = initializeDriveClient();
const result = await listCanonFolders(drive, null);
console.log(JSON.stringify(result, null, 2));
```

**Expected Output Shape:**

```json
{
  "driveId": "YOUR_SHARED_DRIVE_ID",
  "parentId": null,
  "folders": [
    {
      "id": "1a2b3c4d5e6f7g8h9i0j",
      "name": "INFINITE_NETWORK_CANON",
      "parentId": null,
      "lastModified": "2025-12-28T10:00:00.000Z",
      "hasChildren": true
    }
  ],
  "nextPageToken": null
}
```

## Validation Checklist

- [ ] `scripts.env` is gitignored (check `.gitignore`)
- [ ] `C:\keys\` is gitignored (check `.gitignore`)
- [ ] `node_modules` is gitignored everywhere
- [ ] `.vite` is gitignored everywhere
- [ ] Missing env shows actionable error
- [ ] Invalid key path shows actionable error with Windows path hints
- [ ] Diagnostic mode prints drive name/id
- [ ] Diagnostic mode checks canon root existence
- [ ] Diagnostic mode provides permission hints on errors
- [ ] `listCanonFolders` returns correct schema shape
- [ ] `listCanonFolders` uses `corpora: 'drive'` and `driveId`
- [ ] Re-running enforce-canon is idempotent (no duplicates)
- [ ] Manifest JSON output matches expected structure
