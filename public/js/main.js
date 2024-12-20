let contacts = [];
let selectedContact = null;

function filterContacts(searchTerm) {
    if (!searchTerm) {
        document.getElementById('search-results').style.display = 'none';
        return;
    }

    const filteredContacts = contacts.filter(contact => {
        const firstName = contact.properties.firstname || '';
        const lastName = contact.properties.lastname || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });

    displaySearchResults(filteredContacts);
}

function displaySearchResults(results) {
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = '';
    
    if (results.length > 0) {
        results.forEach(contact => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.textContent = `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`;
            
            div.addEventListener('click', () => {
                selectContact(contact);
            });
            
            searchResults.appendChild(div);
        });
        searchResults.style.display = 'block';
    } else {
        searchResults.style.display = 'none';
    }
}

function selectContact(contact) {
    selectedContact = contact.id;
    console.log('Selected Contact ID:', selectedContact);
    console.log('Full Contact Object:', contact);
    
    const searchInput = document.getElementById('contact-search');
    searchInput.value = `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`;
    document.getElementById('search-results').style.display = 'none';
}

async function fetchContacts() {
    try {
        const response = await fetch('/api/contacts');
        const data = await response.json();
        contacts = data.results;
        
        const searchInput = document.getElementById('contact-search');
        searchInput.addEventListener('input', (e) => {
            filterContacts(e.target.value);
        });

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                document.getElementById('search-results').style.display = 'none';
            }
        });

    } catch (error) {
        console.error('Error fetching contacts:', error);
    }
}

document.addEventListener('DOMContentLoaded', fetchContacts);

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

            successMessage.style.display = 'block';
            form.reset();
        } catch (error) {
            console.error('Error:', error);
            errorMessage.textContent = `Error: ${error.message}`;
            errorMessage.style.display = 'block';
        } finally {
            loadingIndicator.style.display = 'none';
        }
    });
});