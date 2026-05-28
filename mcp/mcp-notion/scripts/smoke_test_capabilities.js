import axios from 'axios';

async function testCapabilities() {
    try {
        const response = await axios.post('http://localhost:3002/tool/system.capabilities', {});
        console.log('Capabilities Response:');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error calling system.capabilities:', error.response?.data || error.message);
    }
}

testCapabilities();
