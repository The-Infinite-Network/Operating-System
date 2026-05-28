import { Client } from "@notionhq/client";
import dotenv from "dotenv";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const dbId = process.env.NOTION_DB_MISSIONS;

async function checkSchema() {
    try {
        console.log(`Checking schema for Missions DB: ${dbId}`);
        const db = await notion.databases.retrieve({ database_id: dbId });
        console.log("Properties:");
        for (const [name, prop] of Object.entries(db.properties)) {
            console.log(`- ${name} (${prop.type})`);
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

checkSchema();
