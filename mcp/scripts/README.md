# Google Drive Canon Folder Enforcement

Scripts for enforcing the Infinite Network canon folder tree in Google Drive Shared Drive.

## Prerequisites

1. **Service Account**: A Google Cloud service account with:

   - Google Drive API enabled
   - Access to the Shared Drive (ID: `YOUR_SHARED_DRIVE_ID`)
   - Service account JSON key file downloaded

2. **Node.js**: Node.js 20+ with ES modules support

3. **Dependencies**: Install dependencies:

   ```bash
   cd mcp/scripts
   npm install
   ```

## Setup

1. **Service Account Key**:

   - Download the service account JSON key file from Google Cloud Console
   - Place it in a secure location (not in version control)
   - Note the path to the file

2. **Environment Variables**:
   - Copy `scripts.env.example` to `scripts.env`:

     ```bash
     cp scripts.env.example scripts.env
     ```

   - Edit `scripts.env` and set:

     ```
     GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
     GOOGLE_SHARED_DRIVE_ID=YOUR_SHARED_DRIVE_ID
     CANON_ROOT_NAME=INFINITE_NETWORK_CANON
     CANON_ROOT_ID=optional-root-id-to-skip-name-lookup
     ```

## Usage

### Enforce Canon Folder Tree

```bash
npm run enforce-canon
```

Or directly:

```bash
node enforce_gdrive_canon.js

Or override IDs explicitly:

```bash
node enforce_gdrive_canon.js --drive-id "0AAY9G-ZObGxnUk9PVA" --root-id "18w6S2QwqpYmBhAbyqIuny-u_yuJsH4I1" --root "INFINITE_NETWORK_CANON"
```

```

### Output

The script outputs a JSON manifest of canonical paths to folder IDs:

```json
{
  "sharedDriveId": "YOUR_SHARED_DRIVE_ID",
  "canonRootName": "INFINITE_NETWORK_CANON",
  "canonRootId": "1a2b3c4d5e6f7g8h9i0j",
  "generatedAt": "2025-12-28T22:11:00.000Z",
  "folders": {
    "INFINITE_NETWORK_CANON/00_Trust_Layer": "2b3c4d5e6f7g8h9i0j1k",
    "INFINITE_NETWORK_CANON/01_Infinite_Earth_HQ": "3c4d5e6f7g8h9i0j1k2l"
  }
}
```

## Behavior

- **Idempotent**: If folders exist, they are reused (not recreated)
- **Canon Root**: Creates `/INFINITE_NETWORK_CANON` in Shared Drive root if missing
- **Folder Tree**: Creates all 8 canon folders under the root
- **Error Handling**: Explicit errors with context for debugging

## Canon Folder Structure

```
Shared Drive (YOUR_SHARED_DRIVE_ID)
└── INFINITE_NETWORK_CANON
    ├── 00_Trust_Layer
    ├── 01_Infinite_Earth_HQ
    ├── 02_Time_Vault_IP_HQ
    ├── 03_Guardian_Marks_BrandCo
    ├── 04_Fulcrum_Fortress_Consulting
    ├── 05_Operating_Ventures
    ├── 10_Cross_System_Folders
    └── 99_Archive
```

## Error Handling

The script handles common errors:

- **Missing Service Account Key**: Clear error if `GOOGLE_APPLICATION_CREDENTIALS` not set
- **Invalid Key File**: Error if JSON key file cannot be read or parsed
- **API Errors**: Wrapped with context (folder name, operation)
- **Permission Errors**: Explicit message if service account lacks Shared Drive access

## Troubleshooting

### "Failed to initialize Google Drive client"

- Check that `GOOGLE_APPLICATION_CREDENTIALS` points to a valid JSON file
- Verify the JSON file is valid and contains service account credentials

### "Failed to find folder" or "Failed to create folder"

- Verify service account has access to the Shared Drive
- Check that Shared Drive ID is correct
- Ensure Google Drive API is enabled for the service account's project

### "Access Denied" or Permission Errors

- Service account must be added to the Shared Drive with appropriate permissions
- Verify service account email has access in Google Workspace Admin Console

## Integration

This script can be integrated into an MCP server (e.g., `mcp-gdrive`) by:

1. Importing the functions:

   ```javascript
   import {
     getOrCreateFolder,
     findFolder,
   } from "./scripts/enforce_gdrive_canon.js";
   ```

2. Using as an MCP tool that returns the folder map

3. Calling from other scripts or automation

## Security Notes

- **Never commit** service account JSON key files to version control
- Use `scripts.env` file (gitignored) for local development
- For production, use environment variables or secret management
- Service account should have minimal required permissions (Drive access only)
