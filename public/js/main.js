let contacts = [];
let companies = [];
let selectedContact = null;
let selectedCompany = null;
let mavsGames = [];
let selectedMavsGame = null;

// Fetch contacts from HubSpot
async function fetchContacts() {
    try {
        console.log('Fetching contacts...');
        const response = await fetch('/api/contacts');
        const data = await response.json();
        console.log('Contacts data:', data);
        contacts = data.results;
        return contacts;
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return [];
    }
}

// Fetch companies from HubSpot
async function fetchCompanies() {
    try {
        console.log('Fetching companies...');
        const response = await fetch('/api/companies');
        const data = await response.json();
        console.log('Companies data:', data);
        companies = data.results;
        return companies;
    } catch (error) {
        console.error('Error fetching companies:', error);
        return [];
    }
}

// Fetch Mavs games from HubSpot
async function fetchMavsGames() {
    try {
        console.log('Fetching Mavs games...');
        const response = await fetch('/api/mavs-games');
        const data = await response.json();
        console.log('Mavs games data:', data);
        mavsGames = data.results;
        return mavsGames;
    } catch (error) {
        console.error('Error fetching Mavs games:', error);
        return [];
    }
}

// Initialize search functionality
async function initializeSearch() {
    // Fetch the data first
    await Promise.all([fetchContacts(), fetchCompanies(), fetchMavsGames()]);
    
    console.log('Data loaded - Contacts:', contacts.length, 'Companies:', companies.length, 'Mavs games:', mavsGames.length);

    // Set up contact search
    const contactSearch = document.getElementById('contact-search');
    const contactResults = document.getElementById('search-results');

    // Show all contacts when clicking into the field
    contactSearch.addEventListener('focus', () => {
        displayContactResults(contacts);
    });

    // Filter contacts when typing
    contactSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = contacts.filter(contact => {
            const firstName = (contact.properties.firstname || '').toLowerCase();
            const lastName = (contact.properties.lastname || '').toLowerCase();
            return `${firstName} ${lastName}`.includes(searchTerm);
        });
        displayContactResults(filtered);
    });

    // Set up company search
    const companySearch = document.getElementById('company-search');
    const companyResults = document.getElementById('company-search-results');

    // Show all companies when clicking into the field
    companySearch.addEventListener('focus', () => {
        displayCompanyResults(companies);
    });

    // Filter companies when typing
    companySearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = companies.filter(company => {
            const name = (company.properties.name || '').toLowerCase();
            return name.includes(searchTerm);
        });
        displayCompanyResults(filtered);
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.matches('#contact-search') && !e.target.matches('#company-search')) {
            contactResults.style.display = 'none';
            companyResults.style.display = 'none';
        }
    });

    // Set up Mavs game search
    const mavsGameSearch = document.getElementById('mavs-game-search');
    const mavsGameResults = document.getElementById('mavs-game-search-results');

    // Show all Mavs games when clicking into the field
    mavsGameSearch.addEventListener('focus', () => {
        displayMavsGamesSearchResults(mavsGames);
    });

    // Filter Mavs games when typing
    mavsGameSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredGames = mavsGames.filter(game => 
            game.properties.name.toLowerCase().includes(searchTerm)
        );
        displayMavsGamesSearchResults(filteredGames);
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.matches('#mavs-game-search')) {
            mavsGameResults.style.display = 'none';
        }
    });
}

// Helper function to display contact results
function displayContactResults(contactsToShow) {
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = '';
    
    contactsToShow.forEach(contact => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.textContent = `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim();
        div.addEventListener('click', () => {
            document.getElementById('contact-search').value = div.textContent;
            selectedContact = contact.id;
            resultsDiv.style.display = 'none';
        });
        resultsDiv.appendChild(div);
    });
    
    resultsDiv.style.display = contactsToShow.length ? 'block' : 'none';
}

// Helper function to display company results
function displayCompanyResults(companiesToShow) {
    const resultsDiv = document.getElementById('company-search-results');
    resultsDiv.innerHTML = '';
    
    companiesToShow.forEach(company => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.textContent = company.properties.name || '';
        div.addEventListener('click', () => {
            document.getElementById('company-search').value = div.textContent;
            selectedCompany = company.id;
            resultsDiv.style.display = 'none';
        });
        resultsDiv.appendChild(div);
    });
    
    resultsDiv.style.display = companiesToShow.length ? 'block' : 'none';
}

// Helper function to display Mavs games results
function displayMavsGamesSearchResults(results) {
    const searchResults = document.getElementById('mavs-game-search-results');
    const selectedMavsGameDiv = document.getElementById('selected-mavs-game');
    
    searchResults.innerHTML = '';
    
    results.forEach(game => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.textContent = game.properties.name;
        
        div.addEventListener('click', () => {
            selectedMavsGame = game.id;
            searchResults.style.display = 'none';
            selectedMavsGameDiv.textContent = game.properties.name;
            selectedMavsGameDiv.style.display = 'block';
            document.getElementById('mavs-game-search').value = '';
        });
        
        searchResults.appendChild(div);
    });
    
    searchResults.style.display = results.length > 0 ? 'block' : 'none';
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing search...');
    initializeSearch();
});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('expenseForm');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const loadingIndicator = document.getElementById('loading');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        console.log('Selected Contact at submission:', selectedContact);
        
        const formData = new FormData();

        const expenseData = {
            properties: {
                amount: document.getElementById('amount').value,
                expense_date: document.getElementById('expense_date').value,
                expense_type: document.getElementById('expense_type').value,
                hubspot_owner_id: '1961905556',
                expense_name: document.getElementById('expense_name').value,
                expense_notes: document.getElementById('expense_notes').value,
                payment_type: document.getElementById('payment_type').value,
                visa_total: document.getElementById('amount').value
            }
        };

        formData.append('data', JSON.stringify(expenseData));

        try {
            // First create the expense
            const response = await fetch('/api/submit-expense', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log('Expense created:', responseData);
            
            // If we have both an expense ID and contact ID, create the association
            if (responseData.expense && responseData.expense.id && selectedContact) {
                console.log('Creating association between expense and contact');
                const associationResponse = await fetch('/api/create-association', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        expenseId: responseData.expense.id,
                        contactId: selectedContact
                    })
                });
                
                if (!associationResponse.ok) {
                    throw new Error(`Association error! status: ${associationResponse.status}`);
                }

                const associationData = await associationResponse.json();
                console.log('Association response:', associationData);
            }

            if (selectedCompany) {
                console.log('Creating association between expense and company');
                const companyAssociationResponse = await fetch('/api/create-company-association', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        expenseId: responseData.expense.id,
                        companyId: selectedCompany
                    })
                });
                
                if (!companyAssociationResponse.ok) {
                    throw new Error(`Company association error! status: ${companyAssociationResponse.status}`);
                }

                const companyAssociationData = await companyAssociationResponse.json();
                console.log('Company Association response:', companyAssociationData);
            }

            if (selectedMavsGame) {
                console.log('Creating association between expense and Mavs game');
                const mavsGameAssociationResponse = await fetch('/api/create-mavs-game-association', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        expenseId: responseData.expense.id,
                        mavsGameId: selectedMavsGame
                    })
                });
                
                if (!mavsGameAssociationResponse.ok) {
                    throw new Error(`Mavs game association error! status: ${mavsGameAssociationResponse.status}`);
                }

                const mavsGameAssociationData = await mavsGameAssociationResponse.json();
                console.log('Mavs Game Association response:', mavsGameAssociationData);
            }

            successMessage.style.display = 'block';
            form.reset();
            selectedMavsGame = null;
            document.getElementById('selected-mavs-game').style.display = 'none';
            document.getElementById('selected-mavs-game').textContent = '';
        } catch (error) {
            console.error('Error:', error);
            errorMessage.textContent = `Error: ${error.message}`;
            errorMessage.style.display = 'block';
        } finally {
            loadingIndicator.style.display = 'none';
        }
    });
});