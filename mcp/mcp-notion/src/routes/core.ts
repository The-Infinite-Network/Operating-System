import { Router } from "express";
import { Client } from "@notionhq/client";
import { getConfig } from "../config.js";
import { MCPError, ErrorCodes } from "../errors.js";

const router = Router();
const config = getConfig();
const notion = new Client({ auth: config.NOTION_API_KEY });

// Constants for Lane Enforcement
const ALLOWED_EXECUTION_OWNERS = ["WAR", "GEM", "EYE", "BOB", "BUILD", "CLASS", "MOM", "MIND", "BANK", "AIR", "FOOD", "NANO", "ARK", "HEART", "VOICE"];
const NON_EXECUTION_LANES = ["TWIN", "CORE", "AIM", "ARC", "LAW"];

// Helper: Validate Lane Compliance
function validateLaneCompliance(owner: string): { pass: boolean; reason?: string } {
    if (NON_EXECUTION_LANES.includes(owner)) {
        return { pass: false, reason: `Lane Violation: '${owner}' is a Command/Constraint lane and cannot execute work.` };
    }
    if (!ALLOWED_EXECUTION_OWNERS.includes(owner)) {
        // Soft fail for unknown agents, strict fail for known non-executors
        return { pass: true, reason: `Warning: '${owner}' is not a recognized Standard Pod.` };
    }
    return { pass: true };
}

// POST /tool/core.create_directive
router.post("/core.create_directive", async (req, res) => {
    try {
        const params = req.body.params || {};
        const {
            summary,
            directive_type,
            priority,
            owner_execution,
            acceptance_tests,
            mission_id,
            entity_id
        } = params;

        // 1. Validate Required Fields
        if (!summary || !directive_type || !priority || !owner_execution || !acceptance_tests) {
            throw new MCPError(ErrorCodes.BAD_REQUEST, "Missing required fields for CORE_DIRECTIVE", { required: ["summary", "directive_type", "priority", "owner_execution", "acceptance_tests"] });
        }

        // 2. Enforce Lane Rules
        const compliance = validateLaneCompliance(owner_execution);
        if (!compliance.pass) {
            throw new MCPError(ErrorCodes.VALIDATION_ERROR, compliance.reason || "Lane Violation");
        }

        // 3. Map to Notion Timeline Event
        // We reuse the Timeline DB but with "CORE_DIRECTIVE" type logic
        const dbId = config.NOTION_DB_TIMELINE;
        if (!dbId) throw new MCPError(ErrorCodes.INTERNAL_ERROR, "NOTION_DB_TIMELINE not configured");

        const response = await notion.pages.create({
            parent: { database_id: dbId },
            properties: {
                Name: { title: [{ text: { content: summary } }] },
                Type: { select: { name: "CORE_DIRECTIVE" } }, // Overloading existing Type field
                Status: { select: { name: "ISSUED" } }, // Default status
                Date: { date: { start: new Date().toISOString() } },
                // Custom properties for Directives (assumed to exist or mapped to text)
                // Since we don't want to break schema, we store structured directive data in the JSON "Payload" or equivalent if available,
                // OR we map to existing fields best effort.
                // For v0.1, we will map essential fields to existing Timeline columns and put the rest in the body block.

                // Existing Timeline Mappings:
                // "Event Type" -> directive_type
                // "Impact Level" -> priority
                "Event Type": { select: { name: directive_type } },
                "Impact Level": { select: { name: priority === "P0" ? "Critical" : priority === "P1" ? "Major" : "Minor" } },

                // Relations
                ...(mission_id ? { "Mission": { relation: [{ id: mission_id }] } } : {}),

                // Storage of strict owner and acceptance tests in text/notes fields for now if columns don't exist
                // Ideally we'd have columns, but we'll put them in the page block for durability
            },
            children: [
                {
                    object: "block",
                    type: "code",
                    code: {
                        language: "json",
                        caption: [{ text: { content: "CORE_DIRECTIVE_METADATA" } }],
                        rich_text: [{
                            text: {
                                content: JSON.stringify({
                                    directive_id: `DIR-${Date.now()}`, // Simple ID generation
                                    owner_execution,
                                    acceptance_tests,
                                    compliance_check: compliance,
                                    raw_params: params
                                }, null, 2)
                            }
                        }]
                    }
                }
            ]
        });

        res.json({
            ok: true,
            data: {
                directive: {
                    id: response.id,
                    status: "ISSUED",
                    summary,
                    owner_execution
                }
            }
        });

    } catch (error: any) {
        console.error("Error creating directive:", error);
        const mcpError = error instanceof MCPError ? error : new MCPError(ErrorCodes.INTERNAL_ERROR, error.message);
        res.status(mcpError.code === ErrorCodes.INTERNAL_ERROR ? 500 : 400).json(mcpError.toResponse());
    }
});

// POST /tool/core.list_directives
router.post("/core.list_directives", async (req, res) => {
    try {
        const { status } = req.body.params || {};
        const dbId = config.NOTION_DB_TIMELINE;

        const response = await notion.databases.query({
            database_id: dbId!,
            filter: {
                and: [
                    { property: "Type", select: { equals: "CORE_DIRECTIVE" } },
                    ...(status ? [{ property: "Status", select: { equals: status } }] : [])
                ]
            },
            sorts: [{ timestamp: "created_time", direction: "descending" }]
        });

        const directives = response.results.map((page: any) => {
            const props = page.properties;
            // Extract metadata we might need? 
            // Ideally we parse the page content for the JSON block, but for list view we rely on properties
            return {
                id: page.id,
                summary: props.Name?.title?.[0]?.plain_text || "Untitled Directive",
                status: props.Status?.select?.name || "Unknown",
                priority: props["Impact Level"]?.select?.name || "Minor",
                type: props["Event Type"]?.select?.name || "GENERIC",
                date: props.Date?.date?.start || page.created_time
            };
        });

        res.json({ ok: true, data: { directives } });

    } catch (error: any) {
        const mcpError = error instanceof MCPError ? error : new MCPError(ErrorCodes.INTERNAL_ERROR, error.message);
        res.status(500).json(mcpError.toResponse());
    }
});

// POST /tool/core.check_lane
router.post("/core.check_lane", async (req, res) => {
    try {
        const { agent_id, action_type } = req.body.params || {};
        
        if (!agent_id) throw new MCPError(ErrorCodes.BAD_REQUEST, "agent_id is required");
        
        const compliance = validateLaneCompliance(agent_id);
        
        // Custom logic for action_type can be added here
        // For now, we strictly follow validateLaneCompliance rules
        res.json({ 
            ok: true, 
            data: { 
                pass: compliance.pass, 
                reason: compliance.reason || "Authorized",
                context: { agent: agent_id, action: action_type }
            } 
        });
    } catch (error: any) {
        const mcpError = error instanceof MCPError ? error : new MCPError(ErrorCodes.INTERNAL_ERROR, error.message);
        res.status(500).json(mcpError.toResponse());
    }
});

export default router;
