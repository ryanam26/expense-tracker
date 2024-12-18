const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Add this function to create a folder if it doesn't exist
async function getOrCreateFolder(token) {
    try {
        // First try to get the folder
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

        // Look for both possible folder names
        const existingFolder = searchResponse.data.objects.find(
            f => f.name === 'expense-receipts' || f.name === 'expense-receipts-test'
        );
        
        if (existingFolder) {
            console.log('Using existing folder:', existingFolder.id);
            return existingFolder.id;
        }

        // If folder doesn't exist, create it
        console.log('Creating new folder with token:', `Bearer ${token.substring(0, 10)}...`);
        const createFolderResponse = await axios.post(
            'https://api.hubapi.com/filemanager/api/v3/folders',
            {
                name: 'expense-receipts',
                parentFolderId: 0
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
        // If we have an existing folder, use it despite the error
        if (searchResponse?.data?.objects?.length > 0) {
            const folder = searchResponse.data.objects[0];
            console.log('Using first available folder:', folder.id);
            return folder.id;
        }
        
        console.error('Folder operation error:', error.response?.data || error);
        throw new Error('Could not create or find folder');
    }
}

// Handle file uploads and expense submission
app.post('/api/submit-expense', upload.fields([
    { name: 'receipt_photo_1', maxCount: 1 },
    { name: 'receipt_photo_2', maxCount: 1 }
]), async (req, res) => {
    try {
        const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
        
        if (!HUBSPOT_ACCESS_TOKEN) {
            throw new Error('HUBSPOT_ACCESS_TOKEN is not configured');
        }

        // Parse the expense data
        const expenseData = JSON.parse(req.body.data);
        const fileUrls = [];

        // Handle file uploads
        if (req.files && Object.keys(req.files).length > 0) {
            for (const [fieldName, files] of Object.entries(req.files)) {
                const file = files[0];
                
                // Create a temporary file
                const tempFilePath = path.join(__dirname, `temp_${file.originalname}`);
                fs.writeFileSync(tempFilePath, file.buffer);
                
                // Create a new FormData instance
                const formData = new FormData();

                // Append the file
                formData.append('file', fs.createReadStream(tempFilePath));

                // Add folderId as a separate field (not inside options)
                formData.append('folderId', '184056570773');

                // Append other options
                formData.append('options', JSON.stringify({
                    access: 'PUBLIC_INDEXABLE',
                    overwrite: true,
                    duplicateValidationStrategy: 'NONE',
                    duplicateValidationScope: 'EXACT_FOLDER'
                }));

                console.log('Uploading file with options:', JSON.stringify({
                    access: 'PUBLIC_INDEXABLE',
                    folderId: 184056570773,  // as number, not string
                    overwrite: true,
                    duplicateValidationStrategy: 'NONE',
                    duplicateValidationScope: 'EXACT_FOLDER'
                }));

                try {
                    const fileResponse = await axios({
                        method: 'POST',
                        url: 'https://api.hubapi.com/files/v3/files',
                        data: formData,
                        headers: {
                            'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
                            ...formData.getHeaders()
                        }
                    });

                    console.log('File upload response:', fileResponse.data);

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

        // Add file URLs to expense data
        if (fileUrls.length > 0) {
            fileUrls.forEach((file, index) => {
                const propertyName = `receipt_photo_${index + 1}`;
                expenseData.properties[propertyName] = file.url;
            });
        }

        // Create expense record
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

        res.json({ 
            message: 'Expense submitted successfully',
            expense: expenseResponse.data,
            fileUrls 
        });

    } catch (error) {
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

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
