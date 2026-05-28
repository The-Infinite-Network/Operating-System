import axios from 'axios';

async function testIdempotency() {
    const syncKey = `test_sync_${Date.now()}`;
    const payload = {
        event_type: "TASK_CREATED",
        sync_key: syncKey,
        source: "Idempotency Test",
        timestamp: new Date().toISOString(),
        summary: "Test idempotency event"
    };

    try {
        console.log('--- TEST: Idempotency (PoLE Deduplication) ---');
        console.log(`Using sync_key: ${syncKey}`);

        console.log('Sending first request...');
        const res1 = await axios.post('http://localhost:3002/tool/timeline.log', { params: payload });
        console.log('First request response ID:', res1.data.data.id);

        console.log('Sending second request (same sync_key)...');
        const res2 = await axios.post('http://localhost:3002/tool/timeline.log', { params: payload });
        console.log('Second request response ID:', res2.data.data.id);

        if (res1.data.data.id === res2.data.data.id) {
            console.log('SUCCESS: Idempotency verified. Both requests returned the same ID.');
        } else {
            console.error('FAILURE: Idempotency failed. Requests returned different IDs.');
            console.log('ID 1:', res1.data.data.id);
            console.log('ID 2:', res2.data.data.id);
        }
    } catch (error) {
        console.error('Error testing idempotency:', error.response?.data || error.message);
    }
}

testIdempotency();
