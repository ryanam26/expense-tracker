class OwnerManager {
    constructor() {
        this.selectedOwnerId = null;
        this.ownerSelect = document.getElementById('hubspot-owner');
        this.initializeOwners();
        this.setupEventListeners();
    }

    initializeOwners() {
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Select an owner...";
        this.ownerSelect.appendChild(defaultOption);

        // Add all owners (sorted alphabetically)
        HUBSPOT_OWNERS.sort((a, b) => a.name.localeCompare(b.name)).forEach(owner => {
            const option = document.createElement('option');
            option.value = owner.id;
            option.textContent = owner.name;
            this.ownerSelect.appendChild(option);
        });
    }

    setupEventListeners() {
        this.ownerSelect.addEventListener('change', (e) => {
            this.selectedOwnerId = e.target.value;
            console.log('Owner selected:', this.selectedOwnerId);
        });
    }

    getSelectedOwnerId() {
        return this.ownerSelect ? this.ownerSelect.value : null;
    }
}

window.OwnerManager = OwnerManager; 