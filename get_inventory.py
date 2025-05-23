import xmlrpc.client

# Odoo server info
url = 'https://usjr3.odoo.com'
db = 'usjr3'          # Replace with your actual DB name
username = 'azioele123@gmail.com'       # Your Odoo login email
password = 'Azioele123##'  # Your Odoo login password

# XML-RPC endpoints
common = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/common')
uid = common.authenticate(db, username, password, {})

if not uid:
    print("❌ Login failed. Check your credentials.")
    exit()

models = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/object')

# Search for all products with stock > 0
products = models.execute_kw(db, uid, password,
    'product.product', 'search_read',
    [[['qty_available', '>', 0]]],
    {'fields': ['name', 'qty_available'], 'limit': 10}
)

# Display the stock
for p in products:
    print(f"✅ {p['name']}: {p['qty_available']} in stock")
