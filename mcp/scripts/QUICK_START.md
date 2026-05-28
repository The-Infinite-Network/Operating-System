# Quick Start: Google Drive Canon Folder Enforcement

## Prerequisites

1. **Service Account JSON Key File**

   - Download from Google Cloud Console
   - Ensure it has access to Shared Drive: `YOUR_SHARED_DRIVE_ID`
   - Place the file in a secure location

2. **Install Dependencies**

   ```bash
   cd mcp/scripts
   npm install
   ```

## Setup

1. **Create `scripts.env` file** (copy from example):

   ```bash
   # In mcp/scripts directory
   # Create scripts.env file with:
   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account-key.json
   GOOGLE_SHARED_DRIVE_ID=YOUR_SHARED_DRIVE_ID
   CANON_ROOT_NAME=INFINITE_NETWORK_CANON
   CANON_ROOT_ID=optional-root-id-to-skip-name-lookup
   ```

2. **Verify Service Account Access**
   - Service account email must be added to the Shared Drive
   - Grant appropriate permissions (Content Manager or Editor)

## Run

```bash
npm run enforce-canon
```

Or directly:

```bash
node enforce_gdrive_canon.js
```

Optional overrides:

```bash
node enforce_gdrive_canon.js --drive-id "0AAY9G-ZObGxnUk9PVA" --root-id "18w6S2QwqpYmBhAbyqIuny-u_yuJsH4I1" --root "INFINITE_NETWORK_CANON"
```

## Expected Output

```
🚀 Enforcing Infinite Network Canon Folder Tree
   Shared Drive ID: YOUR_SHARED_DRIVE_ID
   Canon Root: INFINITE_NETWORK_CANON

📁 Locating/creating canon root: INFINITE_NETWORK_CANON...
✓ Created canon root: INFINITE_NETWORK_CANON (1a2b3c4d...)

📂 Enforcing folder tree...
✓ Created folder: 00_Trust_Layer (2b3c4d5e...)
✓ Created folder: 01_Infinite_Earth_HQ (3c4d5e6f...)
...

✅ Canon folder tree enforced successfully!

{
  "00_Trust_Layer": "1a2b3c4d5e6f7g8h9i0j",
  "01_Infinite_Earth_HQ": "2b3c4d5e6f7g8h9i0j1k",
  ...
}
```

## Troubleshooting

**Error: "Missing GOOGLE_APPLICATION_CREDENTIALS"**

- Set the environment variable in `scripts.env`
- Use absolute path to the JSON key file

**Error: "Failed to get Shared Drive root"**

- Verify service account has access to the Shared Drive
- Check that Shared Drive ID is correct
- Ensure Google Drive API is enabled

**Error: "Failed to create folder"**

- Check service account permissions on Shared Drive
- Verify Shared Drive ID is correct
- Check API quotas/limits

## Notes

- **Idempotent**: Running multiple times is safe - existing folders are reused
- **No UI Required**: Pure service account authentication
- **JSON Output**: Folder map returned for integration/automation
