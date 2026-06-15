import { Router } from "express";
import { Client } from "@notionhq/client";
import { getConfig } from "../config.js";

const router = Router();
const config = getConfig();
const notion = new Client({ auth: config.NOTION_API_KEY });

function readPlainText(prop: any): string {
    if (!prop) return "";
    if (Array.isArray(prop.title) && prop.title[0]?.plain_text) return prop.title[0].plain_text;
    if (Array.isArray(prop.rich_text) && prop.rich_text[0]?.plain_text) return prop.rich_text[0].plain_text;
    if (Array.isArray(prop.multi_select) && prop.multi_select.length > 0) {
        return prop.multi_select.map((item: any) => item.name).join(", ");
    }
    if (prop.select?.name) return prop.select.name;
    if (prop.status?.name) return prop.status.name;
    return "";
}

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
        });

        const entities = response.results.map((page: any) => {
            const props = page.properties;
            const code =
                readPlainText(props.Code) ||
                readPlainText(props["Entity Code"]) ||
                readPlainText(props.Handle) ||
                "UNKNOWN";
            const legalName =
                readPlainText(props["Legal Name"]) ||
                readPlainText(props.Name) ||
                readPlainText(props.Title) ||
                code;

            return {
                id: page.id,
                code,
                legalName,
                name: legalName,
                type: readPlainText(props.Type) || "Unknown",
                status: readPlainText(props.Status) || "Active",
                jurisdiction: readPlainText(props.Jurisdiction) || "Unknown",
                description: readPlainText(props.Description),
                shortName: readPlainText(props["Short Name"]) || code,
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
