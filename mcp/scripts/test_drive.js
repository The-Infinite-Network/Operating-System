import { google } from "googleapis";
import { readFileSync } from "fs";

async function test() {
    try {
        const key = JSON.parse(readFileSync("C:/keys/ie-mcp-drive.json", "utf8"));
        console.log(`[INFO] Service Account Email: ${key.client_email}`);
        const auth = new google.auth.GoogleAuth({
            credentials: key,
            scopes: ["https://www.googleapis.com/auth/drive.file"],
        });
        const drive = google.drive({ version: "v3", auth });

        const driveId = "0AAY9G-ZObGxnUk9PVA";
        const folderName = "00_Trust_Layer";
        const effectiveParentId = "18w6S2QwqpYmBhAbyqIuny-u_yuJsH4I1";

        console.log(`[TEST] Checking access to Root ID: ${effectiveParentId}`);
        try {
            const rootFile = await drive.files.get({
                fileId: effectiveParentId,
                supportsAllDrives: true,
                fields: "id, name, parents"
            });
            console.log(`[SUCCESS] Found Root: ${rootFile.data.name} (ID: ${rootFile.data.id})`);
        } catch (error) {
            console.error(`[FAILURE] Could not get Root ID: ${error.message}`);
        }

        console.log(`Testing files.list with: name='${folderName}', parent='${effectiveParentId}', driveId='${driveId}'`);

        console.log(`[TEST] files.list WITHOUT driveId/corpora`);
        const res = await drive.files.list({
            // driveId,  <-- REMOVED
            // corpora: "drive", <-- REMOVED
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
            q: [
                `name = '${folderName}'`,
                "mimeType = 'application/vnd.google-apps.folder'",
                "trashed = false",
                `'${effectiveParentId}' in parents`,
            ].join(" and "),
            fields: "files(id, name)",
        });

        console.log("Success! Files found:", res.data.files?.length || 0);
    } catch (err) {
        console.error("Test failed:", err.message);
        if (err.stack) console.error(err.stack);
    }
}

test();
