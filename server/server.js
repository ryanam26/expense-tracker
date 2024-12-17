const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.post('/api/submit-expense', async (req, res) => {
    try {
        const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
        
        console.log('Received data:', req.body);

        // Access the nested properties correctly using req.body.properties
        const hubspotData = {
            properties: {
                amount: req.body.properties.amount?.toString() || '0',
                expense_date: req.body.properties.expense_date || '',
                expense_type: req.body.properties.expense_type || '',
                hubspot_owner_id: req.body.properties.hubspot_owner_id || '1961905556',
                expense_name: req.body.properties.expense_name || '',
                expense_notes: req.body.properties.expense_notes || '',
                payment_type: req.body.properties.payment_type || '',
                visa_total: req.body.properties.visa_total?.toString() || '0'
            }
        };

        console.log('Sending to HubSpot:', hubspotData);

        const response = await axios({
            method: 'post',
            url: 'https://api.hubapi.com/crm/v3/objects/expenses',
            headers: {
                'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            data: hubspotData
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error creating expense:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to create expense',
            details: error.response?.data || error.message 
        });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
