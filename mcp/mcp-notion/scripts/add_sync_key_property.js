import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DB_TIMELINE;

async function updateDatabase() {
    try {
        console.log(`Updating database ${databaseId}...`);
        // Add SYNC_KEY as a rich_text property (canonical pole_id)
        const response = await client.databases.update({
            database_id: databaseId,
            properties: {
                'SYNC_KEY': {
                    rich_text: {}
                }
            }
        });
        console.log('SUCCESS: SYNC_KEY property added to Timeline database.');
        console.log(JSON.stringify(response.properties['SYNC_KEY'], null, 2));
    } catch (error) {
        console.error('Error updating database:', error.message);
        if (error.body) console.error(JSON.stringify(error.body, null, 2));
    }
}

updateDatabase();
