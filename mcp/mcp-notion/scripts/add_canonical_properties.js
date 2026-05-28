import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DB_TIMELINE;

async function updateDatabase() {
    try {
        console.log(`Updating database ${databaseId}...`);
        const response = await client.databases.update({
            database_id: databaseId,
            properties: {
                'Event Type': { select: {} },
                'Timestamp': { date: {} },
                'Summary': { rich_text: {} },
                'External Refs': { rich_text: {} },
                'Actor': { people: {} }
            }
        });
        console.log('SUCCESS: Canonical properties added to Timeline database.');
    } catch (error) {
        console.error('Error updating database:', error.message);
        if (error.body) console.error(JSON.stringify(error.body, null, 2));
    }
}

updateDatabase();
