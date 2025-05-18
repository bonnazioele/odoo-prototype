document.addEventListener('DOMContentLoaded', function() {
    const productTable = document.querySelector('#productTable tbody');
    const addProductForm = document.getElementById('addProductForm');

    // Load products on page load
    loadProducts();

    // Handle form submission
    addProductForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addProduct();
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
                cost: parseFloat(productCost)
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