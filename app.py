from flask import Flask, render_template

app = Flask(__name__)

# Mock Data
users = [
    {
        "id": 1,
        "name": "Ahmed Rahman",
        "image": "https://cdn-icons-png.flaticon.com/512/1077/1077114.png",
        "district": "Dhaka",
        "division": "Dhaka",
        "map_link": "https://www.google.com/maps",
        "ponds": [
            {"id": 101, "name": "Pond A - North", "status": "online", 
             "metrics": {"ph": [7.1, 7.0, 7.2, 7.1, 7.3, 7.2, 7.4], "ammonia": [0.02, 0.01, 0.02, 0.01, 0.01, 0.03, 0.02], "oxygen": [6.4, 6.5, 6.4, 6.6, 6.3, 6.5, 6.7]}
            },
            {"id": 102, "name": "Pond B - East", "status": "offline"},
            {"id": 103, "name": "Pond C - South", "status": "online",
             "metrics": {"ph": [6.9, 6.8, 6.9, 7.0, 7.1, 7.0, 6.9], "ammonia": [0.04, 0.05, 0.04, 0.04, 0.03, 0.04, 0.05], "oxygen": [5.6, 5.5, 5.6, 5.8, 5.9, 5.7, 5.6]}
            },
        ]
    },
    {
        "id": 2,
        "name": "Fatima Begum",
        "image": "https://cdn-icons-png.flaticon.com/512/1077/1077114.png",
        "district": "Chittagong",
        "division": "Chittagong",
        "map_link": "https://www.google.com/maps",
        "ponds": [
            {"id": 201, "name": "Main Hatchery", "status": "online",
             "metrics": {"ph": [7.4, 7.5, 7.6, 7.5, 7.4, 7.5, 7.6], "ammonia": [0.01, 0.00, 0.01, 0.00, 0.00, 0.01, 0.00], "oxygen": [7.1, 7.0, 7.2, 7.1, 7.3, 7.2, 7.4]}
            },
        ]
    },
    {
        "id": 3,
        "name": "Karim Ullah",
        "image": "https://cdn-icons-png.flaticon.com/512/1077/1077114.png",
        "district": "Khulna",
        "division": "Khulna",
        "map_link": "https://www.google.com/maps",
        "ponds": [
            {"id": 301, "name": "Shrimp Farm 1", "status": "offline"},
            {"id": 302, "name": "Shrimp Farm 2", "status": "offline"},
        ]
    }
]

@app.route('/')
@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html', users=users, active_page='dashboard')

@app.route('/device-measurement')
def device_measurement():
    return render_template('device_measurement.html', active_page='device_measurement')

@app.route('/logout')
def logout():
    return "Logged out"

if __name__ == '__main__':
    app.run()
