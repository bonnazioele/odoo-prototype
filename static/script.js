document.addEventListener('DOMContentLoaded', function() {
    const productTable = document.querySelector('#productTable tbody');
    const addProductForm = document.getElementById('addProductForm');
    const editProductForm = document.getElementById('editProductForm');
    const editModal = document.getElementById('editProductModal');
    const closeModal = document.querySelector('.close');

    // Load products on page load
    loadProducts();

    // Handle form submission
    addProductForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addProduct();
    });

    // Handle edit form submission
    editProductForm.addEventListener('submit', function(e) {
        e.preventDefault();
        updateProduct();
    });

    // Close modal when clicking the X
    closeModal.addEventListener('click', function() {
        editModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target == editModal) {
            editModal.style.display = 'none';
        }
    });

    // Load all products
    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            const products = await response.json();
            
            productTable.innerHTML = '';
            products.forEach(product => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>${product.default_code || ''}</td>
                    <td>${product.type}</td>
                    <td>
                        <button class="edit-btn" data-id="${product.id}" 
                            data-name="${product.name}" 
                            data-code="${product.default_code || ''}" 
                            data-type="${product.type}">Edit</button>
                        <button class="delete-btn" data-id="${product.id}">Delete</button>
                    </td>
                `;
                productTable.appendChild(row);
            });

            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    if (confirm('Are you sure you want to delete this product?')) {
                        deleteProduct(this.dataset.id);
                    }
                });
            });

            // Add event listeners to edit buttons
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    // Populate form with current values
                    document.getElementById('editProductId').value = this.dataset.id;
                    document.getElementById('editProductName').value = this.dataset.name;
                    document.getElementById('editProductCode').value = this.dataset.code;
                    document.getElementById('editProductType').value = this.dataset.type;
                    
                    // Display the modal
                    editModal.style.display = 'block';
                });
            });
        } catch (error) {
            console.error('Error loading products:', error);
            alert('Failed to load products');
        }
    }

    // Add new product
    async function addProduct() {
        const productName = document.getElementById('productName').value;
        const productCode = document.getElementById('productCode').value;
        const productPrice = document.getElementById('productPrice').value || 0;
        const productCost = document.getElementById('productCost').value || 0;

        if (!productName) {
            alert('Product name is required');
            return;
        }

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: productName,
                    code: productCode,
                    price: parseFloat(productPrice),
                    cost: parseFloat(productCost),
                    type: 'consu'  // Using 'consu' as default type (consumable product)
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add product');
            }

            const result = await response.json();
            alert(`Product added successfully! ID: ${result.product_id}`);
            document.getElementById('productName').value = '';
            document.getElementById('productCode').value = '';
            document.getElementById('productPrice').value = '';
            document.getElementById('productCost').value = '';
            loadProducts();

        } catch (error) {
            console.error('Error adding product:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Update product
    async function updateProduct() {
        const productId = document.getElementById('editProductId').value;
        const productName = document.getElementById('editProductName').value;
        const productCode = document.getElementById('editProductCode').value;
        const productType = document.getElementById('editProductType').value;

        if (!productName) {
            alert('Product name is required');
            return;
        }

        try {
            const response = await fetch('/api/products', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: parseInt(productId),
                    name: productName,
                    default_code: productCode,
                    type: productType
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update product');
            }

            const result = await response.json();
            alert('Product updated successfully!');
            editModal.style.display = 'none';
            loadProducts();

        } catch (error) {
            console.error('Error updating product:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Delete product
    async function deleteProduct(id) {
        try {
            const response = await fetch(`/api/products?id=${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            if (result.status === 'success') {
                alert('Product deleted successfully!');
                loadProducts();
            } else {
                throw new Error('Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Failed to delete product');
        }
    }
});