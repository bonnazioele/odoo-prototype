document.addEventListener('DOMContentLoaded', () => {
  const inventoryList = document.getElementById('inventoryList');
  const searchBar = document.getElementById('searchBar');
  let allProducts = [];

  // Fetch inventory from backend
  fetch('/inventory')
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        inventoryList.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
        return;
      }
      allProducts = data;
      displayProducts(allProducts); // Show all by default
    });

  // Display products function
  function displayProducts(products) {
    inventoryList.innerHTML = '';

    if (products.length === 0) {
      inventoryList.innerHTML = `<div class="alert alert-warning">No matching products found.</div>`;
      return;
    }

    products.forEach(item => {
      const el = document.createElement('div');
      el.className = 'list-group-item';
      el.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h5>${item.name}</h5>
            <p class="mb-1">
              <strong>SKU:</strong> ${item.default_code || 'N/A'}<br>
              <strong>Price:</strong> ₱${item.list_price?.toFixed(2) || '0.00'}<br>
              <strong>In stock:</strong> ${item.qty_available}
            </p>
          </div>
        </div>
      `;
      inventoryList.appendChild(el);
    });
  }

  // Live search
  searchBar.addEventListener('input', () => {
    const searchTerm = searchBar.value.trim().toLowerCase();

    if (searchTerm === '') {
      displayProducts(allProducts); // Show all if search is empty
    } else {
      const filtered = allProducts.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        (item.default_code && item.default_code.toLowerCase().includes(searchTerm))
      );
      displayProducts(filtered);
    }
  });
});
