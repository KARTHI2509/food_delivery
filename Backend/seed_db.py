import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load env variables from local path
load_dotenv()

def seed_database():
    mongo_uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DATABASE_NAME", "food_delivery_db")
    
    print(f"Connecting to MongoDB database '{db_name}'...")
    client = MongoClient(mongo_uri)
    db = client[db_name]

    # Clean existing data
    print("Clearing collections...")
    db["customers"].delete_many({})
    db["restaurants"].delete_many({})
    db["foods"].delete_many({})
    db["cart"].delete_many({})
    db["orders"].delete_many({})

    # Seed Customers
    print("Seeding Customers...")
    customers = [
        {
            "customer_id": 101,
            "full_name": "Rahul Sharma",
            "email": "rahul@gmail.com",
            "phone": "9876543210",
            "address": "KPHB Colony",
            "city": "Hyderabad"
        },
        {
            "customer_id": 102,
            "full_name": "Priya Verma",
            "email": "priya@gmail.com",
            "phone": "9876543211",
            "address": "Whitefield",
            "city": "Bengaluru"
        },
        {
            "customer_id": 100,  # admin
            "full_name": "Admin",
            "email": "admin@food.com",
            "phone": "9998887770",
            "address": "Food Junction Office",
            "city": "Hyderabad"
        }
    ]
    db["customers"].insert_many(customers)

    # Seed Restaurants
    print("Seeding Restaurants...")
    restaurants = [
        {
            "restaurant_id": 201,
            "restaurant_name": "Spicy Kitchen",
            "owner_name": "Kiran Kumar",
            "location": "Hyderabad",
            "cuisine": "South Indian",
            "rating": 4.6
        },
        {
            "restaurant_id": 202,
            "restaurant_name": "Burger Bite",
            "owner_name": "Rajesh Gupta",
            "location": "Bengaluru",
            "cuisine": "Fast Food",
            "rating": 4.2
        },
        {
            "restaurant_id": 203,
            "restaurant_name": "Royal Punjab",
            "owner_name": "Gurmeet Singh",
            "location": "Delhi",
            "cuisine": "North Indian",
            "rating": 4.5
        },
        {
            "restaurant_id": 204,
            "restaurant_name": "Bella Italia",
            "owner_name": "Marco Rossi",
            "location": "Mumbai",
            "cuisine": "Italian",
            "rating": 4.4
        }
    ]
    db["restaurants"].insert_many(restaurants)

    # Seed Foods
    print("Seeding Menu Items...")
    foods = [
        {
            "food_id": 301,
            "restaurant_name": "Spicy Kitchen",
            "food_name": "Chicken Biryani",
            "category": "Main Course",
            "price": 299.0,
            "availability": "Available"
        },
        {
            "food_id": 302,
            "restaurant_name": "Spicy Kitchen",
            "food_name": "Masala Dosa",
            "category": "Breakfast",
            "price": 99.0,
            "availability": "Available"
        },
        {
            "food_id": 303,
            "restaurant_name": "Burger Bite",
            "food_name": "Cheese Burger Combo",
            "category": "Fast Food",
            "price": 199.0,
            "availability": "Available"
        },
        {
            "food_id": 304,
            "restaurant_name": "Royal Punjab",
            "food_name": "Paneer Butter Masala",
            "category": "Main Course",
            "price": 249.0,
            "availability": "Available"
        },
        {
            "food_id": 305,
            "restaurant_name": "Royal Punjab",
            "food_name": "Butter Naan",
            "category": "Bread",
            "price": 49.0,
            "availability": "Available"
        },
        {
            "food_id": 306,
            "restaurant_name": "Bella Italia",
            "food_name": "Margherita Pizza",
            "category": "Main Course",
            "price": 279.0,
            "availability": "Available"
        },
        {
            "food_id": 307,
            "restaurant_name": "Bella Italia",
            "food_name": "Garlic Bread Sticks",
            "category": "Sides",
            "price": 129.0,
            "availability": "Out of Stock"
        }
    ]
    db["foods"].insert_many(foods)

    # Seed Cart
    print("Seeding Cart Items...")
    carts = [
        {
            "cart_id": 401,
            "customer_name": "Rahul Sharma",
            "food_name": "Chicken Biryani",
            "quantity": 2,
            "price": 299.0,
            "total_price": 598.0
        }
    ]
    db["cart"].insert_many(carts)

    # Seed Orders
    print("Seeding Orders...")
    orders = [
        {
            "order_id": 501,
            "customer_name": "Rahul Sharma",
            "restaurant_name": "Spicy Kitchen",
            "order_items": "Chicken Biryani x2",
            "total_amount": 598.0,
            "payment_status": "Paid",
            "delivery_status": "Preparing"
        }
    ]
    db["orders"].insert_many(orders)

    print("Database seeding completed successfully for Food Delivery DB!")

if __name__ == "__main__":
    seed_database()
