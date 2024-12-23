// Import required dependencies
const express = require('express');              // Web application framework
const cors = require('cors');                    // Enable Cross-Origin Resource Sharing
const path = require('path');                    // Handle file paths
const dotenv = require('dotenv');                // Load environment variables
const multer = require('multer');                // Handle file uploads
const axios = require('axios');                  // Make HTTP requests
const FormData = require('form-data');           // Create multipart form data
const fs = require('fs');                        // File system operations

// Load environment variables from .env file
dotenv.config();

// Initialize Express app and set port
const app = express();
const PORT = process.env.PORT || 3000;           // Use environment port or default to 3000

// Configure multer for handling file uploads
const upload = multer({
    storage: multer.memoryStorage(),             // Store files in memory
    limits: {
        fileSize: 5 * 1024 * 1024               // Limit file size to 5MB
    }
});

// Apply middleware
app.use(cors());                                // Enable CORS for all routes
app.use(express.json());                        // Parse JSON request bodies
app.use(express.static(path.join(__dirname, '../public'))); // Serve static files

// Function to get or create a folder in HubSpot
async function getOrCreateFolder(token) {
    try {
        // Search for existing folders in HubSpot
        const searchResponse = await axios.get(
            'https://api.hubapi.com/filemanager/api/v3/folders',
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Existing folders:', searchResponse.data);

        // Check if our folder already exists
        const existingFolder = searchResponse.data.objects.find(
            f => f.name === 'expense-receipts' || f.name === 'expense-receipts-test'
        );
        
        // Return existing folder ID if found
        if (existingFolder) {
            console.log('Using existing folder:', existingFolder.id);
            return existingFolder.id;
        }

        // Create new folder if it doesn't exist
        console.log('Creating new folder with token:', `Bearer ${token.substring(0, 10)}...`);
        const createFolderResponse = await axios.post(
            'https://api.hubapi.com/filemanager/api/v3/folders',
            {
                name: 'expense-receipts',
                parentFolderId: 0                 // Create at root level
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('New folder created:', createFolderResponse.data);
        return createFolderResponse.data.id;
    } catch (error) {
        // Fallback to first available folder if search succeeded but creation failed
        if (searchResponse?.data?.objects?.length > 0) {
            const folder = searchResponse.data.objects[0];
            console.log('Using first available folder:', folder.id);
            return folder.id;
        }
        
        console.error('Folder operation error:', error.response?.data || error);
        throw new Error('Could not create or find folder');
    }
}

// Handle expense submission endpoint with file uploads
app.post('/api/submit-expense', upload.fields([
    { name: 'receipt_photo_1', maxCount: 1 },    // Accept up to 2 receipt photos
    { name: 'receipt_photo_2', maxCount: 1 }
]), async (req, res) => {
    try {
        // Get HubSpot access token from environment variables
        const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
        
        // Verify token exists
        if (!HUBSPOT_ACCESS_TOKEN) {
            throw new Error('HUBSPOT_ACCESS_TOKEN is not configured');
        }

        // Parse the expense data from request body
        const expenseData = JSON.parse(req.body.data);
        const fileUrls = [];                     // Store uploaded file URLs

        // Process file uploads if any files were submitted
        if (req.files && Object.keys(req.files).length > 0) {
            for (const [fieldName, files] of Object.entries(req.files)) {
                const file = files[0];
                
                // Create temporary file for upload
                const tempFilePath = path.join(__dirname, `temp_${file.originalname}`);
                fs.writeFileSync(tempFilePath, file.buffer);
                
                // Prepare form data for HubSpot upload
                const formData = new FormData();
                formData.append('file', fs.createReadStream(tempFilePath));
                formData.append('folderId', '184056570773');
                formData.append('options', JSON.stringify({
                    access: 'PUBLIC_INDEXABLE',
                    overwrite: true,
                    duplicateValidationStrategy: 'NONE',
                    duplicateValidationScope: 'EXACT_FOLDER'
                }));

                try {
                    // Upload file to HubSpot
                    const fileResponse = await axios({
                        method: 'POST',
                        url: 'https://api.hubapi.com/files/v3/files',
                        data: formData,
                        headers: {
                            'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
                            ...formData.getHeaders()
                        }
                    });

                    // Store successful upload URL
                    if (fileResponse.data && fileResponse.data.url) {
                        fileUrls.push({
                            fieldName,
                            url: fileResponse.data.url
                        });
                    }

                } catch (uploadError) {
                    console.error('File upload error:', uploadError.response?.data || uploadError.message);
                    throw uploadError;
                } finally {
                    // Clean up temporary file
                    if (fs.existsSync(tempFilePath)) {
                        fs.unlinkSync(tempFilePath);
                    }
                }
            }
        }

        // Add uploaded file URLs to expense data
        if (fileUrls.length > 0) {
            fileUrls.forEach((file, index) => {
                const propertyName = `receipt_photo_${index + 1}`;
                expenseData.properties[propertyName] = file.url;
            });
        }

        // Create expense record in HubSpot
        const expenseResponse = await axios.post(
            'https://api.hubapi.com/crm/v3/objects/expenses',
            expenseData,
            {
                headers: {
                    'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Send success response
        res.json({ 
            message: 'Expense submitted successfully',
            expense: expenseResponse.data,
            fileUrls 
        });

    } catch (error) {
        // Log and send error response
        console.error('Upload Error:', {
            message: error.response?.data?.message,
            status: error.response?.status,
            data: error.response?.data,
            error: error.message
        });
        
        res.status(500).json({ 
            error: 'Failed to create expense',
            details: error.response?.data?.message || error.message
        });
    }
});

// Endpoint to get ALL contacts from HubSpot
app.get('/api/contacts', async (req, res) => {
    try {
        let allContacts = [];
        let hasMore = true;
        let after = undefined;

        while (hasMore) {
            const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
                headers: {
                    'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    limit: 100,
                    properties: ['firstname', 'lastname', 'email'],
                    archived: false,
                    after: after
                }
            });

            allContacts = [...allContacts, ...response.data.results];
            
            // Check if there are more pages
            hasMore = response.data.paging?.next?.after;
            after = response.data.paging?.next?.after;

            console.log(`Fetched ${allContacts.length} contacts so far...`);
        }

        console.log('Total contacts fetched:', allContacts.length);
        
        // Format the response data
        const formattedContacts = allContacts.map(contact => ({
            id: contact.id,
            properties: {
                firstname: contact.properties.firstname || '',
                lastname: contact.properties.lastname || '',
                email: contact.properties.email || ''
            }
        }));

        res.json({
            count: formattedContacts.length,
            results: formattedContacts
        });
    } catch (error) {
        console.error('Error fetching contacts from HubSpot:', error.response?.data || error);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

// Endpoint to get ALL companies from HubSpot
app.get('/api/companies', async (req, res) => {
    try {
        let allCompanies = [];
        let hasMore = true;
        let after = undefined;

        while (hasMore) {
            const response = await axios.get('https://api.hubapi.com/crm/v3/objects/companies', {
                headers: {
                    'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    limit: 100,
                    properties: ['name'],
                    archived: false,
                    after: after
                }
            });

            allCompanies = [...allCompanies, ...response.data.results];
            
            // Check if there are more pages
            hasMore = response.data.paging?.next?.after;
            after = response.data.paging?.next?.after;

            console.log(`Fetched ${allCompanies.length} companies so far...`);
        }

        console.log('Total companies fetched:', allCompanies.length);
        
        // Format the response data
        const formattedCompanies = allCompanies.map(company => ({
            id: company.id,
            properties: {
                name: company.properties.name || ''
            }
        }));

        res.json({
            count: formattedCompanies.length,
            results: formattedCompanies
        });
    } catch (error) {
        console.error('Error fetching companies from HubSpot:', error.response?.data || error);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});

// Add new endpoint to create association
app.post('/api/create-association', async (req, res) => {
    try {
        const { expenseId, contactId } = req.body;
        
        console.log('Creating association:', { expenseId, contactId });

        // First, get the valid association types between contacts and expenses
        const typesResponse = await axios.get(
            `https://api.hubapi.com/crm/v3/associations/contacts/p44120672_expenses/types`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`
                }
            }
        );

        console.log('Available Types:', typesResponse.data);

        // Create the association using the first available type
        const response = await axios.post(
            'https://api.hubapi.com/crm/v3/associations/contacts/p44120672_expenses/batch/create',
            {
                inputs: [
                    {
                        from: { id: contactId },
                        to: { id: expenseId },
                        type: typesResponse.data.results[0].id  // Use the ID from the types response
                    }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('Association Response:', response.data);
        
        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Association Error Details:', error.response?.data);
        res.status(500).json({ 
            error: 'Failed to create association',
            details: error.response?.data || error.message
        });
    }
});

// Add a new endpoint to check available association types
app.get('/api/association-types', async (req, res) => {
    try {
        const response = await axios.get(
            'https://api.hubapi.com/crm/v3/associations/contacts/p44120672_expenses/types',
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('Available Association Types:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching association types:', error.response?.data);
        res.status(500).json({ 
            error: 'Failed to fetch association types',
            details: error.response?.data || error.message
        });
    }
});

// Add endpoint to create company association
app.post('/api/create-company-association', async (req, res) => {
    try {
        const { expenseId, companyId } = req.body;
        
        console.log('Creating company association:', { expenseId, companyId });

        // First, get the valid association types between companies and expenses
        const typesResponse = await axios.get(
            `https://api.hubapi.com/crm/v4/associations/companies/p44120672_expenses/labels`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`
                }
            }
        );

        console.log('Available company association types:', typesResponse.data);

        // Create the association using the first available type
        const response = await axios.post(
            'https://api.hubapi.com/crm/v3/associations/companies/p44120672_expenses/batch/create',
            {
                inputs: [
                    {
                        from: { id: companyId },
                        to: { id: expenseId },
                        type: typesResponse.data.results[0].typeId // Use the first available type
                    }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('Company Association Response:', response.data);
        
        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Company Association Error Details:', error.response?.data);
        res.status(500).json({ 
            error: 'Failed to create company association',
            details: error.response?.data || error.message
        });
    }
});

// Add this new endpoint with the other API endpoints
app.get('/api/mavs-games', async (req, res) => {
    try {
        console.log('Fetching Mavs games from HubSpot...');
        
        const response = await axios.get(
            'https://api.hubapi.com/crm/v3/objects/p44120672_mavs_games', // Adjust this if the custom object name is different
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`
                },
                params: {
                    limit: 100,
                    properties: ['name', 'game_date', 'opponent'] // Add any other properties you need
                }
            }
        );
        
        console.log('Mavs games response:', response.data);
        
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching Mavs games:', error.response?.data || error);
        res.status(500).json({ 
            error: 'Failed to fetch Mavs games',
            details: error.response?.data || error.message
        });
    }
});

// Add the association endpoint
app.post('/api/create-mavs-game-association', async (req, res) => {
    try {
        const { expenseId, mavsGameId } = req.body;
        
        console.log('Creating Mavs game association:', { expenseId, mavsGameId });

        // First, get the valid association types between Mavs games and expenses
        const typesResponse = await axios.get(
            `https://api.hubapi.com/crm/v3/associations/p44120672_mavs_games/p44120672_expenses/types`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`
                }
            }
        );

        console.log('Available Mavs game association types:', typesResponse.data);

        // Create the association using the first available type
        const response = await axios.post(
            'https://api.hubapi.com/crm/v3/associations/p44120672_mavs_games/p44120672_expenses/batch/create',
            {
                inputs: [
                    {
                        from: { id: mavsGameId },
                        to: { id: expenseId },
                        type: typesResponse.data.results[0].id
                    }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('Mavs Game Association Response:', response.data);
        
        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Mavs Game Association Error Details:', error.response?.data);
        res.status(500).json({ 
            error: 'Failed to create Mavs game association',
            details: error.response?.data || error.message
        });
    }
});

// Catch-all route to serve the frontend application
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
