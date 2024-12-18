document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('expenseForm');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const loadingIndicator = document.getElementById('loading');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        loadingIndicator.style.display = 'block';
        successMessage.style.display = 'none';
        errorMessage.style.display = 'none';

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

        console.log('Sending data:', expenseData);

        formData.append('data', JSON.stringify(expenseData));

        const receipt1 = document.getElementById('receipt_photo_1').files[0];
        const receipt2 = document.getElementById('receipt_photo_2').files[0];

        if (receipt1) formData.append('receipt_photo_1', receipt1);
        if (receipt2) formData.append('receipt_photo_2', receipt2);

        try {
            const response = await fetch('/api/submit-expense', {
                method: 'POST',
                body: formData
            });

            const responseData = await response.json();
            console.log('Response:', responseData);

            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to submit expense');
            }

            successMessage.style.display = 'block';
            form.reset();
        } catch (error) {
            console.error('Error:', error);
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        } finally {
            loadingIndicator.style.display = 'none';
        }
    });
});