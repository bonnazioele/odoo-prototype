from flask import Flask, render_template, jsonify, request,make_response
import xmlrpc.client
from functools import wraps
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

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

@app.route('/api/products', methods=['GET', 'POST', 'DELETE'])
@handle_odoo_errors
def products():
    models, uid = get_odoo_connection()
    
    if request.method == 'GET':
        # Get all products
        products = models.execute_kw(
            ODOO_DB, uid, ODOO_PASSWORD,
            'product.product', 'search_read',
            [[]],
            {'fields': ['id', 'name', 'default_code', 'type']}
        )
        return jsonify(products)
    
    elif request.method == 'POST':
        # Add new product
        data = request.get_json()  # Changed from request.json for better compatibility
        if not data or 'name' not in data:
            return jsonify({"error": "Product name is required"}), 400
            
        product_id = models.execute_kw(
            ODOO_DB, uid, ODOO_PASSWORD,
            'product.product', 'create',
            [{
                'name': data['name'],
                'default_code': data.get('code', ''),
                'type': data.get('type', 'product')
            }]
        )
        return jsonify({"status": "success", "product_id": product_id})
    
    elif request.method == 'DELETE':
        # Delete product
        product_id = request.args.get('id')
        if not product_id:
            return jsonify({"error": "Product ID is required"}), 400
            
        models.execute_kw(
            ODOO_DB, uid, ODOO_PASSWORD,
            'product.product', 'unlink',
            [[int(product_id)]]
        )
        return jsonify({"status": "success"})

@app.route('/api/inventory', methods=['GET', 'POST', 'PUT', 'DELETE'])
def inventory():
    models, uid = get_odoo_connection()
    
    if request.method == 'GET':
        # Get all inventory
        inventory = models.execute_kw(
            ODOO_DB, uid, ODOO_PASSWORD,
            'stock.quant', 'search_read',
            [[]],
            {'fields': ['id', 'product_id', 'quantity', 'location_id']}
        )
        return jsonify(inventory)
    
    elif request.method == 'POST':
        # Add new inventory item
        data = request.json
        quant_id = models.execute_kw(
            ODOO_DB, uid, ODOO_PASSWORD,
            'stock.quant', 'create',
            [{
                'product_id': data['product_id'],
                'location_id': data['location_id'],
                'quantity': data['quantity']
            }]
        )
        return jsonify({"status": "success", "quant_id": quant_id})
    
    elif request.method == 'PUT':
        # Update inventory quantity
        data = request.json
        models.execute_kw(
            ODOO_DB, uid, ODOO_PASSWORD,
            'stock.quant', 'write',
            [[data['id']], {
                'quantity': data['quantity']
            }]
        )
        return jsonify({"status": "success"})
    
    elif request.method == 'DELETE':
        # Delete inventory item
        quant_id = request.args.get('id')
        models.execute_kw(
            ODOO_DB, uid, ODOO_PASSWORD,
            'stock.quant', 'unlink',
            [[int(quant_id)]]
        )
        return jsonify({"status": "success"})

@app.route('/api/transfers', methods=['POST'])
def create_transfer():
    try:
        data = request.json
        models, uid = get_odoo_connection()
        
        # First create a picking
        picking_id = models.execute_kw(
            ODOO_DB, uid, ODOO_PASSWORD,
            'stock.picking', 'create',
            [{
                'picking_type_id': 1,  # Internal transfer type
                'location_id': data['source_location_id'],
                'location_dest_id': data['dest_location_id']
            }]
        )
        
        # Then create the move
        move_id = models.execute_kw(
            ODOO_DB, uid, ODOO_PASSWORD,
            'stock.move', 'create',
            [{
                'name': f"API Transfer {data['product_id']}",
                'product_id': data['product_id'],
                'product_uom_qty': data['quantity'],
                'location_id': data['source_location_id'],
                'location_dest_id': data['dest_location_id'],
                'picking_id': picking_id
            }]
        )
        
        # Confirm the entire picking
        models.execute_kw(
            ODOO_DB, uid, ODOO_PASSWORD,
            'stock.picking', 'action_confirm',
            [[picking_id]]
        )
        
        return jsonify({
            "status": "success",
            "picking_id": picking_id,
            "move_id": move_id
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)