document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('expenseForm');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const loadingIndicator = document.getElementById('loading');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading indicator
        loadingIndicator.style.display = 'block';
        successMessage.style.display = 'none';
        errorMessage.style.display = 'none';

        const formData = {
            properties: {
                amount: document.getElementById('amount').value,
                expense_date: document.getElementById('expense_date').value,
                expense_type: document.getElementById('expense_type').value,
                hubspot_owner_id: '1961905556', // Replace with actual HubSpot owner ID
                expense_name: document.getElementById('expense_name').value,
                expense_notes: document.getElementById('expense_notes').value,
                payment_type: document.getElementById('payment_type').value,
                visa_total: document.getElementById('amount').value
            }
        };

        try {
            const response = await fetch('/.netlify/functions/submit-expense', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                successMessage.style.display = 'block';
                form.reset();
            } else {
                throw new Error('Failed to submit expense');
            }
        } catch (error) {
            console.error('Error:', error);
            errorMessage.style.display = 'block';
        } finally {
            loadingIndicator.style.display = 'none';
        }
    });
});