import { Router } from "express";
import { Client } from "@notionhq/client";
import { getConfig } from "../config.js";

const router = Router();
const config = getConfig();
const notion = new Client({ auth: config.NOTION_API_KEY });

// GET /tool/entities.list
router.post("/entities.list", async (req, res) => {
    try {
        const dbId = config.NOTION_DB_ENTITIES;
        if (!dbId) {
            return res.status(500).json({
                ok: false,
                error: { message: "NOTION_DB_ENTITIES not configured" },
            });
        }

        const response = await notion.databases.query({
            database_id: dbId,
            page_size: 100, // Fetch up to 100 entities
            sorts: [
                {
                    property: "Code",
                    direction: "ascending",
                },
            ],
        });

        const entities = response.results.map((page: any) => {
            const props = page.properties;
            return {
                id: page.id,
                code: props.Code?.title?.[0]?.plain_text || "UNKNOWN",
                legalName: props["Legal Name"]?.rich_text?.[0]?.plain_text || "Untitled Entity",
                type: props.Type?.select?.name || "Unknown",
                status: props.Status?.status?.name || "Active",
                jurisdiction: props.Jurisdiction?.select?.name || "Unknown",
                description: props.Description?.rich_text?.[0]?.plain_text || "",
                shortName: props["Short Name"]?.rich_text?.[0]?.plain_text || "",
            };
        });

        res.json({
            ok: true,
            data: { entities },
        });
    } catch (error: any) {
        console.error("Error fetching entities:", error);
        res.status(500).json({
            ok: false,
            error: {
                message: "Failed to list entities",
                details: error.message,
            },
        });
    }
});

export default router;
