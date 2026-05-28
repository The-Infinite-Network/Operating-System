import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DB_TIMELINE;

async function checkDatabase() {
    try {
        const response = await client.databases.retrieve({ database_id: databaseId });
        console.log('Database Properties:');
        console.log(JSON.stringify(response.properties, null, 2));
    } catch (error) {
        console.error('Error retrieving database:', error.message);
    }
}

checkDatabase();
