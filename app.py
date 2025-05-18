from flask import Flask, render_template, jsonify, request, make_response
import xmlrpc.client
from functools import wraps

app = Flask(__name__)

# Odoo connection settings
ODOO_URL = "https://usjr10.odoo.com"
ODOO_DB = "usjr10"
ODOO_USERNAME = "azioele123@gmail.com"
ODOO_PASSWORD = "Azioele123##"

def handle_odoo_errors(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except xmlrpc.client.Fault as e:
            return jsonify({"error": f"Odoo error: {e.faultString}"}), 500
        except xmlrpc.client.ProtocolError as e:
            return jsonify({"error": f"Connection error: {e.errmsg}"}), 503
        except Exception as e:
            return jsonify({"error": f"Server error: {str(e)}"}), 500
    return wrapper

def get_odoo_connection():
    try:
        common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
        uid = common.authenticate(ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {})
        if not uid:
            raise ValueError("Authentication failed")
        return xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object'), uid
    except Exception as e:
        raise Exception(f"Could not connect to Odoo: {str(e)}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/products')
@handle_odoo_errors
def get_products():
    models, uid = get_odoo_connection()
    products = models.execute_kw(
        ODOO_DB, uid, ODOO_PASSWORD,
        'product.product', 'search_read',
        [[]],
        {'fields': ['id', 'name']}
    )
    return jsonify(products)

@app.route('/api/inventory')
@handle_odoo_errors
def get_inventory():
    models, uid = get_odoo_connection()
    inventory = models.execute_kw(
        ODOO_DB, uid, ODOO_PASSWORD,
        'stock.quant', 'search_read',
        [[]],
        {'fields': ['product_id', 'quantity', 'location_id']}
    )
    return jsonify(inventory)

@app.route('/api/transfers', methods=['POST'])
@handle_odoo_errors
def create_transfer():
    data = request.json
    models, uid = get_odoo_connection()
    
    transfer_id = models.execute_kw(
        ODOO_DB, uid, ODOO_PASSWORD,
        'stock.move', 'create',
        [{
            'name': f"API Transfer {data['product_id']}",
            'product_id': data['product_id'],
            'product_uom_qty': data['quantity'],
            'location_id': data['source_location_id'],
            'location_dest_id': data['dest_location_id']
        }]
    )
    
    models.execute_kw(
        ODOO_DB, uid, ODOO_PASSWORD,
        'stock.move', 'action_confirm',
        [[transfer_id]]
    )
    
    return jsonify({"status": "success", "transfer_id": transfer_id})

if __name__ == '__main__':
    app.run(debug=True, port=5000)