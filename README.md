# FoodHub - Food Delivery Website

A premium, full-stack food delivery platform built with **Django REST API backend**, **MongoDB Atlas (PyMongo)**, and a **warm orange glassmorphic frontend**.

---

## Features

- **Restaurant Discovery**: Browse restaurants with ratings, cuisine types, and delivery info
- **Menu Browsing**: View restaurant menus with prices and categories
- **Cart System**: Add items, update quantities, and manage your cart
- **Order Placement**: Place orders with delivery address and payment method
- **Order Tracking**: Track order status (Pending, Confirmed, Delivered)
- **User Authentication**: Secure registration and login
- **Admin Dashboard**: Analytics with total orders, revenue, and restaurant stats
- **Mobile Responsive**: Beautiful warm-toned responsive design

---

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| Frontend | HTML5, CSS3 (Glassmorphism, Warm Orange Theme), JavaScript ES6 |
| Backend | Python, Django 5.2 |
| Database | MongoDB Atlas (via PyMongo) |
| Deployment | Gunicorn, WhiteNoise, Heroku/Render |

---

## Project Structure

```
food_delivery/
├── Frontend/                    # Static HTML/CSS/JS
│   ├── index.html              # Landing page
│   ├── login.html              # User login
│   ├── register.html           # User registration
│   ├── dashboard.html          # Admin dashboard
│   ├── restaurants.html        # Restaurant listing
│   ├── menu.html               # Restaurant menu
│   ├── cart.html               # Shopping cart
│   ├── orders.html             # Order history
│   ├── style.css               # Premium warm food styling
│   └── script.js               # API calls & DOM logic
│
├── Backend/                    # Django project root
│   ├── manage.py
│   ├── requirements.txt
│   ├── Procfile
│   ├── seed_db.py
│   ├── restaurants/            # Restaurants app
│   ├── menu/                   # Menu items app
│   ├── orders/                 # Orders app
│   └── users/                  # Authentication app
```

---

## Setup Instructions

### Prerequisites
- Python 3.11+
- MongoDB Atlas account

### 1. Clone the repository
```bash
git clone https://github.com/KARTHI2509/food_delivery.git
cd food_delivery
```

### 2. Install dependencies
```bash
cd Backend
pip install -r requirements.txt
```

### 3. Configure environment variables
Create a `.env` file in `Backend/`:
```env
SECRET_KEY=your_django_secret_key
DEBUG=True
MONGO_URI=your_mongodb_connection_string
DB_NAME=foodhub_db
```

### 4. Seed the database
```bash
python seed_db.py
```

### 5. Run the backend server
```bash
python manage.py runserver
```

### 6. Open the frontend
Open `Frontend/index.html` in your browser.

---

## API Endpoints

| Module | Method | Endpoint | Description |
|:-------|:-------|:---------|:------------|
| Auth | `POST` | `/api/register` | Register new user |
| Auth | `POST` | `/api/login` | User login |
| Restaurants | `GET` | `/api/restaurants` | List restaurants |
| Menu | `GET` | `/api/menu` | List menu items |
| Cart | `POST` | `/api/cart/add` | Add to cart |
| Orders | `POST` | `/api/orders/place` | Place order |
| Dashboard | `GET` | `/api/dashboard` | Admin analytics |

---

## Deployment

Set environment variables and deploy using `Procfile`:
```
web: gunicorn <project>.wsgi
```

---

## Developer

**Karthi** — [KARTHI2509](https://github.com/KARTHI2509)
