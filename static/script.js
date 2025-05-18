document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const inventoryTable = document.getElementById('inventoryTable').querySelector('tbody');
    const productSelect = document.getElementById('productSelect');
    const transferForm = document.getElementById('transferForm');
    const refreshBtn = document.getElementById('refreshBtn');

    // Load initial data
    loadProducts();
    loadInventory();

    // Event Listeners
    refreshBtn.addEventListener('click', loadInventory);
    transferForm.addEventListener('submit', handleTransferSubmit);

    // Load product dropdown
    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            const products = await response.json();
            
            productSelect.innerHTML = '';
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = product.name;
                productSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading products:', error);
            alert('Failed to load products');
        }
    }

    // Load inventory data
    async function loadInventory() {
        try {
            const response = await fetch('/api/inventory');
            const inventory = await response.json();
            
            inventoryTable.innerHTML = '';
            inventory.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.product_id[1]}</td>
                    <td>${item.quantity}</td>
                    <td>${item.location_id[1]}</td>
                    <td>
                        <button class="update-btn" data-id="${item.id}">Update</button>
                    </td>
                `;
                inventoryTable.appendChild(row);
            });

            // Add event listeners to update buttons
            document.querySelectorAll('.update-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const itemId = this.getAttribute('data-id');
                    // Implement update functionality
                    alert(`Update item ${itemId} - functionality to be implemented`);
                });
            });
        } catch (error) {
            console.error('Error loading inventory:', error);
            alert('Failed to load inventory');
        }
    }

    // Handle transfer form submission
    async function handleTransferSubmit(e) {
        e.preventDefault();
        
        const transferData = {
            product_id: parseInt(productSelect.value),
            quantity: parseInt(document.getElementById('quantityInput').value),
            source_location_id: parseInt(document.getElementById('sourceLocation').value),
            dest_location_id: parseInt(document.getElementById('destLocation').value)
        };

        try {
            const response = await fetch('/api/transfers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transferData)
            });

            const result = await response.json();
            if (result.status === 'success') {
                alert('Transfer created successfully!');
                loadInventory(); // Refresh inventory
                transferForm.reset(); // Clear form
            } else {
                throw new Error('Transfer failed');
            }
        } catch (error) {
            console.error('Error creating transfer:', error);
            alert('Failed to create transfer');
        }
    }
});