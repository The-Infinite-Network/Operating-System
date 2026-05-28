import axios from 'axios';

const PORT = 3004;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
    console.log('--- Phase One Tools v1.1 Smoke Test ---');

    try {
        // 1. Test /health
        console.log('\nTesting /health...');
        const health = await axios.get(`${BASE_URL}/health`);
        console.log('Health:', JSON.stringify(health.data, null, 2));

        // 2. Test /tools
        console.log('\nTesting /tools...');
        const tools = await axios.get(`${BASE_URL}/tools`);
        console.log('Tools:', tools.data);

        // 3. Test rooms.list
        console.log('\nTesting tool: rooms.list...');
        const rooms = await axios.post(`${BASE_URL}/tool/rooms.list`, { params: { limit: 5 } });
        console.log('Rooms Count:', rooms.data.data?.rooms?.length || 0);

        // 4. Test missions.list
        console.log('\nTesting tool: missions.list...');
        const missions = await axios.post(`${BASE_URL}/tool/missions.list`, { params: { limit: 5, status: 'Active' } });
        console.log('Missions Count (Filtered):', missions.data.data?.missions?.length || 0);

        // 5. Test tasks.list
        console.log('\nTesting tool: tasks.list...');
        const tasks = await axios.post(`${BASE_URL}/tool/tasks.list`, { params: { limit: 5 } });
        console.log('Tasks Count:', tasks.data.data?.tasks?.length || 0);

        // 6. Test guilds.list
        console.log('\nTesting tool: guilds.list...');
        const guilds = await axios.post(`${BASE_URL}/tool/guilds.list`, {});
        console.log('Guilds:', guilds.data.data?.guilds?.map(g => g.guild_code));

        // 7. Test Error Contract (Invalid tool)
        console.log('\nTesting Error Contract (Invalid tool)...');
        try {
            await axios.post(`${BASE_URL}/tool/non_existent_tool`, {});
        } catch (error) {
            console.log('Error Contract (Expected):', JSON.stringify(error.response?.data, null, 2));
        }

    } catch (error) {
        if (error.response) {
            console.error('Test Failed (Response):', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Test Failed (Internal):', error.message);
        }
    }
}

runTests();
