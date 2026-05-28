import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DB_TIMELINE;

async function testQuery() {
    try {
        console.log(`Querying database ${databaseId} for SYNC_KEY...`);
        const response = await client.databases.query({
            database_id: databaseId,
            filter: {
                property: "SYNC_KEY",
                rich_text: { equals: "test_value" },
            },
        });
        console.log('SUCCESS: Query executed.', response.results.length, 'results.');
    } catch (error) {
        console.error('FAILURE: Query failed.');
        console.error(error.message);
        if (error.body) console.error(JSON.stringify(error.body, null, 2));
    }
}

testQuery();
