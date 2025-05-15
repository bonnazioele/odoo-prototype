from flask import Flask, render_template, jsonify
import xmlrpc.client

app = Flask(__name__)

# Odoo credentials
url = 'https://usjr3.odoo.com'
db = 'usjr3'         # Replace with your DB name
username = 'azioele123@gmail.com'      # Replace with your Odoo email
password = 'Azioele123##'   # Your Odoo password

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/inventory')
def get_inventory():
    try:
        # Authenticate
        common = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/common')
        uid = common.authenticate(db, username, password, {})

        if not uid:
            return jsonify({"error": "Login failed"}), 401

        models = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/object')

        # Get products with available quantity
       # Replace inside your /inventory route
        products = models.execute_kw(db, uid, password,
            'product.product', 'search_read',
            [[['qty_available', '>', 0]]],
            {
                'fields': ['name', 'qty_available', 'default_code', 'list_price'],
                'limit': 50
            }
        )


        return jsonify(products)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
