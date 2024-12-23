let contacts = [];
let companies = [];
let selectedContact = null;
let selectedCompany = null;
let mavsGames = [];
let selectedMavsGame = null;

const MAVS_GAMES = [
    { id: "17145723550", name: "Mav's vs Toronto Raptors" },
    { id: "18868287318", name: "Mav's vs Los Angeles Lakers 2" },
    { id: "17145723546", name: "Mav's vs Atlanta Hawks" },
    { id: "17145723512", name: "Mav's vs Brooklyn Nets" },
    { id: "17145723510", name: "Mav's vs Detroit Pistons" },
    { id: "17145723509", name: "Mav's vs Philadelphia 76ers" },
    { id: "17145723506", name: "Mav's vs Phoenix Suns 2" },
    { id: "18868287270", name: "Mav's vs Memphis Grizzlies 2" },
    { id: "18868287265", name: "Mav's vs Sacramento Kings 2" },
    { id: "18868287261", name: "Mav's vs Milwaukee Bucks" },
    { id: "17145723498", name: "Mav's vs Charlotte Hornets" },
    { id: "17145723497", name: "Mav's vs New Orleans Pelicans 3" },
    { id: "17145723458", name: "Mav's vs Miami Heat" },
    { id: "18868287152", name: "Mav's vs Golden State Warriors" },
    { id: "18868287146", name: "Mav's vs Sacramento Kings 1" },
    { id: "17145723455", name: "Mav's vs Houston Rockets 2" },
    { id: "17145723453", name: "Mav's vs Washington Wizards" },
    { id: "17145723452", name: "Mav's vs Boston Celtics" },
    { id: "17145723450", name: "Mav's vs Minnesota Timberwolves 2" },
    { id: "18868287139", name: "Mav's vs Oklahoma City Thunder" },
    { id: "18868287100", name: "Mav's vs Denver Nuggets 2" },
    { id: "17145723405", name: "Mav's vs Denver Nuggets 1" },
    { id: "18868287093", name: "Mav's vs Portland Trailblazers 2" },
    { id: "18868287089", name: "Mav's vs Los Angeles Lakers" },
    { id: "18868287086", name: "Mav's vs Cleveland Cavaliers" },
    { id: "18868287079", name: "Mav's vs Minnesota Timberwolves 1" },
    { id: "17145723394", name: "Mav's vs Portland Trailblazers 1" },
    { id: "18868287003", name: "Mav's vs Los Angeles Clippers 2" },
    { id: "17145723239", name: "Mav's vs Los Angeles Clippers 1" },
    { id: "18868287001", name: "Mav's vs Memphis Grizzlies 1" },
    { id: "18868286998", name: "Mav's vs New Orleans Pelicans 2" },
    { id: "18868286996", name: "Mav's vs New Orleans Pelicans 1" },
    { id: "17145723224", name: "Mav's vs San Antonio Spurs" },
    { id: "18868286991", name: "Mav's vs Phoenix Suns 1" },
    { id: "18868286989", name: "Mav's vs Chicago Bulls" },
    { id: "18868286984", name: "Mav's vs Indiana Pacers" },
    { id: "18868286982", name: "Mav's vs Orlando Magic" },
    { id: "18868286978", name: "Mav's vs Houston Rockets 1" },
    { id: "18868286360", name: "Mav's vs Utah Jazz" },
    { id: "17145722523", name: "Mav's 1st Season Game vs San Antonio Spurs" },
    { id: "18868286348", name: "Mav's PRESEASON vs Milwaukee Bucks" },
    { id: "18868286331", name: "Mav's PRESEASON vs Utah Jazz" },
    { id: "16614392865", name: "Mav's PRESEASON vs Memphis Grizzlies" }
];

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

// Remove the old fetchMavsGames function and replace with this simplified version
function initializeMavsGames() {
    console.log('Initializing Mavs games...');
    mavsGames = MAVS_GAMES;
}

// Initialize search functionality
async function initializeSearch() {
    // Fetch the data first
    await Promise.all([fetchContacts(), fetchCompanies()]);
    
    console.log('Data loaded - Contacts:', contacts.length, 'Companies:', companies.length);

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
        console.log('Search input event triggered');
        const searchTerm = e.target.value.toLowerCase();
        console.log('Search term:', searchTerm);
        
        const filteredGames = MAVS_GAMES.filter(game => 
            game.name.toLowerCase().includes(searchTerm)
        );
        console.log('Filtered games:', filteredGames);
        
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
    
    searchResults.innerHTML = '';
    
    results.forEach(game => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.textContent = game.name;
        
        div.addEventListener('click', () => {
            selectedMavsGame = game.id;
            searchResults.style.display = 'none';
            document.getElementById('mavs-game-search').value = game.name;
        });
        
        searchResults.appendChild(div);
    });
    
    searchResults.style.display = 'block';
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing search...');
    initializeSearch();
    
    // Initialize Mavs games
    initializeMavsGames();
    
    // Add event listener for Mavs game search
    const mavsGameSearch = document.getElementById('mavs-game-search');
    if (mavsGameSearch) {
        console.log('Mavs game search input found, adding event listener');
        mavsGameSearch.addEventListener('input', (e) => {
            console.log('Search input event triggered');
            const searchTerm = e.target.value.toLowerCase();
            const filteredGames = MAVS_GAMES.filter(game => 
                game.name.toLowerCase().includes(searchTerm)
            );
            displayMavsGamesSearchResults(filteredGames);
        });
    } else {
        console.error('Mavs game search input not found!');
    }
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

// Add this function to immediately show all games when clicking the search field
document.getElementById('mavs-game-search').addEventListener('focus', (e) => {
    console.log('Search field focused');
    // Show all games immediately when focusing on the search field
    displayMavsGamesSearchResults(MAVS_GAMES);
});

// Modify the input event listener to handle both empty and non-empty searches
document.getElementById('mavs-game-search').addEventListener('input', (e) => {
    console.log('Search input event triggered');
    const searchTerm = e.target.value.toLowerCase();
    console.log('Search term:', searchTerm);
    
    // If search is empty, show all games
    if (searchTerm === '') {
        displayMavsGamesSearchResults(MAVS_GAMES);
    } else {
        // Filter games based on search term
        const filteredGames = MAVS_GAMES.filter(game => 
            game.name.toLowerCase().includes(searchTerm)
        );
        displayMavsGamesSearchResults(filteredGames);
    }
});