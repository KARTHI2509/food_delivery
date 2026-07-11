import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .db import order_collection
from pymongo import MongoClient
import os

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("DATABASE_NAME")]

# GET: List Orders
def get_orders(request):
    if request.method == "GET":
        try:
            customer_name = request.GET.get("customer")
            query = {}
            if customer_name:
                query["customer_name"] = customer_name

            orders = []
            for order in order_collection.find(query, {"_id": 0}):
                orders.append(order)
            return JsonResponse(orders, safe=False)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=400)

# POST: Place Order (Add Order)
@csrf_exempt
def add_order(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            customer_name = data.get("customer_name")
            restaurant_name = data.get("restaurant_name")
            order_items = data.get("order_items")
            total_amount = float(data.get("total_amount", 0))

            if not customer_name or not restaurant_name or not order_items:
                return JsonResponse({"error": "Customer name, restaurant name, and order items are required"}, status=400)

            # Auto-increment ID
            order_id = data.get("order_id")
            if not order_id:
                max_order = order_collection.find_one(sort=[("order_id", -1)])
                order_id = (max_order["order_id"] + 1) if max_order else 501
            else:
                order_id = int(order_id)

            if order_collection.find_one({"order_id": order_id}):
                return JsonResponse({"error": f"Order ID {order_id} already exists"}, status=400)

            order_doc = {
                "order_id": order_id,
                "customer_name": customer_name,
                "restaurant_name": restaurant_name,
                "order_items": order_items,
                "total_amount": total_amount,
                "payment_status": data.get("payment_status", "Paid"),
                "delivery_status": data.get("delivery_status", "Preparing")
            }

            order_collection.insert_one(order_doc)

            # Clear cart for this customer after order placement
            db["cart"].delete_many({"customer_name": customer_name})

            return JsonResponse({"message": "Order placed successfully", "order_id": order_id})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

# PUT: Update Order (e.g. Delivery status: Preparing/Out for Delivery/Delivered, Payment status)
@csrf_exempt
def update_order(request, id):
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            data.pop("order_id", None)

            if "total_amount" in data:
                data["total_amount"] = float(data["total_amount"])

            result = order_collection.update_one(
                {"order_id": int(id)},
                {"$set": data}
            )

            if result.modified_count > 0 or result.matched_count > 0:
                return JsonResponse({"message": "Order updated successfully"})
            return JsonResponse({"error": "Order not found or no changes made"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

# DELETE: Delete/Cancel Order by ID
@csrf_exempt
def delete_order(request, id):
    if request.method == "DELETE":
        try:
            # Instead of deleting, cancel the order (delivery_status = "Cancelled")
            result = order_collection.update_one(
                {"order_id": int(id)},
                {"$set": {"delivery_status": "Cancelled"}}
            )
            if result.modified_count > 0 or result.matched_count > 0:
                return JsonResponse({"message": "Order cancelled successfully"})
            return JsonResponse({"error": "Order not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)
