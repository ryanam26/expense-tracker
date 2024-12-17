const axios = require('axios');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
        const data = JSON.parse(event.body);

        const response = await axios.post('https://api.hubapi.com/crm/v3/objects/expenses', data, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify(response.data)
        };
    } catch (error) {
        console.error('Error creating expense:', error.response?.data || error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to create expense',
                details: error.response?.data || error.message 
            })
        };
    }
};
