#!/usr/bin/env python3
"""
SSMV Booking API Server
Centralized backend for appointment bookings
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
BOOKINGS_FILE = 'bookings.json'
ADMIN_CREDENTIALS = {
    'username': 'kshatriya302',
    'password': '0978'
}

def load_bookings():
    """Load bookings from JSON file"""
    try:
        if os.path.exists(BOOKINGS_FILE):
            with open(BOOKINGS_FILE, 'r') as f:
                return json.load(f)
        return []
    except Exception as e:
        logger.error(f"Error loading bookings: {e}")
        return []

def save_bookings(bookings):
    """Save bookings to JSON file"""
    try:
        with open(BOOKINGS_FILE, 'w') as f:
            json.dump(bookings, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error saving bookings: {e}")
        return False

def generate_id():
    """Generate unique booking ID"""
    return int(datetime.now().timestamp() * 1000)

# Serve static files (HTML, CSS, JS)
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

# API Routes
@app.route('/api/bookings', methods=['GET'])
def get_bookings():
    """Get all bookings"""
    bookings = load_bookings()
    return jsonify(bookings)

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    """Create new booking"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'phone', 'date', 'time', 'numberOfPeople', 'details']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        # Create booking object
        booking = {
            'id': generate_id(),
            'name': data['name'],
            'email': data['email'],
            'phone': data['phone'],
            'date': data['date'],
            'time': data['time'],
            'numberOfPeople': int(data['numberOfPeople']),
            'details': data['details'],
            'status': 'confirmed',
            'created_at': datetime.now().isoformat()
        }
        
        # Load existing bookings and add new one
        bookings = load_bookings()
        bookings.append(booking)
        
        # Save to file
        if save_bookings(bookings):
            logger.info(f"New booking created: {booking['id']}")
            return jsonify(booking), 201
        else:
            return jsonify({'error': 'Failed to save booking'}), 500
            
    except Exception as e:
        logger.error(f"Error creating booking: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/bookings/<int:booking_id>', methods=['DELETE'])
def delete_booking(booking_id):
    """Delete booking by ID"""
    try:
        bookings = load_bookings()
        original_count = len(bookings)
        
        # Filter out the booking to delete
        bookings = [b for b in bookings if b['id'] != booking_id]
        
        if len(bookings) == original_count:
            return jsonify({'error': 'Booking not found'}), 404
        
        if save_bookings(bookings):
            logger.info(f"Booking deleted: {booking_id}")
            return jsonify({'message': 'Booking deleted successfully'})
        else:
            return jsonify({'error': 'Failed to delete booking'}), 500
            
    except Exception as e:
        logger.error(f"Error deleting booking: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/bookings/search', methods=['POST'])
def search_bookings():
    """Search bookings by email or phone"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        
        if not email and not phone:
            return jsonify({'error': 'Email or phone required'}), 400
        
        bookings = load_bookings()
        results = []
        
        for booking in bookings:
            if (email and booking['email'] == email) or \
               (phone and phone in booking['phone']):
                results.append(booking)
        
        return jsonify(results)
        
    except Exception as e:
        logger.error(f"Error searching bookings: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    """Admin authentication"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if (username == ADMIN_CREDENTIALS['username'] and 
            password == ADMIN_CREDENTIALS['password']):
            return jsonify({'success': True, 'message': 'Login successful'})
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
            
    except Exception as e:
        logger.error(f"Error in admin login: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get booking statistics"""
    try:
        bookings = load_bookings()
        today = datetime.now().strftime('%Y-%m-%d')
        
        stats = {
            'total_bookings': len(bookings),
            'today_bookings': len([b for b in bookings if b['date'] == today]),
            'total_people': sum(b['numberOfPeople'] for b in bookings)
        }
        
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    # Create empty bookings file if it doesn't exist
    if not os.path.exists(BOOKINGS_FILE):
        save_bookings([])
        logger.info(f"Created empty {BOOKINGS_FILE}")
    
    logger.info("Starting SSMV Booking Server...")
    logger.info("Access the website at: http://localhost:5000")
    
    # Run the server
    app.run(host='0.0.0.0', port=5000, debug=True)