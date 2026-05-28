import express from 'express';
import multer from 'multer';
import { Client } from '@notionhq/client';
import OpenAI from 'openai';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize clients (OpenAI optional for dev)
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const TWIN_PROFILES_DB = process.env.NOTION_DB_TWIN_PROFILES || "";

// ===== HELPER FUNCTIONS =====

function generateTwinID() {
    const year = new Date().getFullYear();
    const sequence = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `TPROF-${year}-${sequence}`;
}

async function extractProfileFromDocument(content: string, contentType: string = 'text/plain') {
    if (!openai) {
        console.warn("OPENAI_API_KEY missing; returning mock Twin Profile extract.");
        return {
            identity: { human_name: "Unknown" },
            gaps: ["OPENAI_API_KEY not set: extraction skipped"],
            confidence_scores: {}
        };
    }
    // Read prompt from artifact file if possible, else use fallback
    let promptContent = "";
    try {
        // Assuming executed from mcp-notion root or dist
        const promptPath = path.resolve(process.cwd(), 'prompts', 'twin-profile-extractor.txt');
        if (fs.existsSync(promptPath)) {
            promptContent = fs.readFileSync(promptPath, 'utf-8');
        } else {
            const srcPromptPath = path.resolve(process.cwd(), 'src/prompts', 'twin-profile-extractor.txt'); // Check src
            if (fs.existsSync(srcPromptPath)) promptContent = fs.readFileSync(srcPromptPath, 'utf-8');
        }
    } catch (e) {
        console.warn("Could not load prompt file, using default.");
    }

    // Fallback prompt if file read fails
    if (!promptContent) {
        promptContent = `You are the Fulcrum System Philosophy Parser. Extract Twin Profile data from the input. Return valid JSON only matching the standard schema.`;
    }

    const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview', // Using turbo-preview or similar
        messages: [
            { role: 'system', content: promptContent },
            { role: 'user', content: `Extract Twin Profile data from the provided document.\n\nTYPE: ${contentType}\n\nCONTENT:\n${content.slice(0, 20000)}` } // Truncate to avoid context limit if huge
        ],
        response_format: { type: 'json_object' }
    });

    const contentStr = response.choices[0].message.content;
    if (!contentStr) throw new Error("No content returned from LLM");
    return JSON.parse(contentStr);
}

async function createNotionProfile(twinID: string, profileData: any) {
    if (!TWIN_PROFILES_DB) throw new Error("NOTION_DB_TWIN_PROFILES env var not set");

    const identity = profileData.identity || {};

    const properties: any = {
        'Twin ID': { title: [{ text: { content: twinID } }] },
        'Status': { select: { name: 'draft' } },
        'Version': { number: 1.0 },
        'Human Name': { rich_text: [{ text: { content: identity.human_name || '' } }] },
        'Preferred Name': { rich_text: [{ text: { content: identity.preferred_name || '' } }] },
        'SYNC_KEY': { rich_text: [{ text: { content: `TPROF-${twinID}` } }] }
    };

    // Map other fields loosely for now (Notion schema is complex, dynamic mapping suggested)
    // For V1, we just dump what we can map easily.

    return await notion.pages.create({
        parent: { database_id: TWIN_PROFILES_DB },
        properties
    });
}

// ===== ENDPOINTS =====

/**
 * POST /api/v1/twin-profiles/intake
 * Upload philosophy doc → extract → return draft profile
 */
router.post('/intake', upload.single('document'), async (req, res) => {
    try {
        const { content_type, raw_answers } = req.body;
        const file = req.file;

        // Generate Twin ID
        const twinID = generateTwinID();

        // Extract document content
        let docContent = "";
        if (file) {
            docContent = file.buffer.toString('utf-8'); // Assuming text-based (txt, md, json). For PDF/DOCX, needed extraction lib, skipped for V1 text support.
        } else if (req.body.document_content) {
            docContent = req.body.document_content;
        }

        // Extract profile data
        let profileData;
        if (docContent) {
            profileData = await extractProfileFromDocument(docContent, content_type || 'text/plain');
        } else if (raw_answers) {
            // Process Socratic Q&A
            profileData = await extractProfileFromDocument(
                JSON.stringify(raw_answers),
                'application/json'
            );
        } else {
            // Just return a mock for testing if no logic possible
            // return res.status(400).json({ error: 'Must provide document_content or raw_answers' });

            // Mocking for Phase 3 Demo if no backend fully wired
            profileData = { identity: { human_name: "Mock User" } };
        }

        // Create Notion record (Mocked if no DB ID)
        let notionPage = { id: "mock-notion-id" };
        if (TWIN_PROFILES_DB) {
            notionPage = await createNotionProfile(twinID, profileData);
        }

        // Return draft for review
        res.json({
            twin_id: twinID,
            status: 'draft',
            profile: profileData,
            notion_page_id: notionPage.id,
            confidence_scores: profileData.confidence_scores || {},
            gaps: profileData.gaps || [],
            next_steps: [
                'Review extracted profile',
                'Edit fields via PUT /twin-profiles/:id/update',
                'Lock profile via POST /twin-profiles/:id/lock'
            ]
        });
    } catch (error: any) {
        console.error('Intake error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
