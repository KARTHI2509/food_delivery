import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .db import cart_collection

# GET: View Cart
def get_cart(request):
    if request.method == "GET":
        try:
            # Allow filtering by customer_name if query param is passed
            customer_name = request.GET.get("customer")
            query = {}
            if customer_name:
                query["customer_name"] = customer_name

            cart_items = []
            for item in cart_collection.find(query, {"_id": 0}):
                cart_items.append(item)
            return JsonResponse(cart_items, safe=False)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=400)

# POST: Add Item to Cart
@csrf_exempt
def add_to_cart(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            customer_name = data.get("customer_name")
            food_name = data.get("food_name")
            quantity = int(data.get("quantity", 1))
            price = float(data.get("price", 0))

            if not customer_name or not food_name:
                return JsonResponse({"error": "Customer name and food name are required"}, status=400)

            # Check if this food item already exists in the customer's cart
            existing = cart_collection.find_one({"customer_name": customer_name, "food_name": food_name})
            if existing:
                # Update quantity and total price
                new_qty = existing["quantity"] + quantity
                new_total = new_qty * price
                cart_collection.update_one(
                    {"cart_id": existing["cart_id"]},
                    {"$set": {"quantity": new_qty, "total_price": new_total}}
                )
                return JsonResponse({"message": "Cart item quantity updated", "cart_id": existing["cart_id"]})

            # Otherwise, insert as a new item
            cart_id = data.get("cart_id")
            if not cart_id:
                max_cart = cart_collection.find_one(sort=[("cart_id", -1)])
                cart_id = (max_cart["cart_id"] + 1) if max_cart else 401
            else:
                cart_id = int(cart_id)

            total_price = quantity * price

            cart_doc = {
                "cart_id": cart_id,
                "customer_name": customer_name,
                "food_name": food_name,
                "quantity": quantity,
                "price": price,
                "total_price": total_price
            }

            cart_collection.insert_one(cart_doc)
            return JsonResponse({"message": "Item added to cart successfully", "cart_id": cart_id})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

# PUT: Update Cart Quantity by ID
@csrf_exempt
def update_cart(request, id):
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            data.pop("cart_id", None)

            # Find the existing cart item to get price
            item = cart_collection.find_one({"cart_id": int(id)})
            if not item:
                return JsonResponse({"error": "Cart item not found"}, status=404)

            quantity = int(data.get("quantity", item.get("quantity")))
            price = float(data.get("price", item.get("price")))
            data["quantity"] = quantity
            data["price"] = price
            data["total_price"] = quantity * price

            result = cart_collection.update_one(
                {"cart_id": int(id)},
                {"$set": data}
            )

            if result.modified_count > 0 or result.matched_count > 0:
                return JsonResponse({"message": "Cart item updated successfully"})
            return JsonResponse({"error": "Cart item not found or no changes made"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

# DELETE: Delete Cart Item by ID
@csrf_exempt
def delete_cart(request, id):
    if request.method == "DELETE":
        try:
            # Check if deleting specific ID or clearing entire cart for a user (special endpoint helper)
            # If id is -1, we clear cart based on customer query parameter
            if int(id) == -1:
                customer = request.GET.get("customer")
                if customer:
                    cart_collection.delete_many({"customer_name": customer})
                    return JsonResponse({"message": "Cart cleared successfully"})
                return JsonResponse({"error": "Customer name parameter required to clear cart"}, status=400)

            result = cart_collection.delete_one({"cart_id": int(id)})
            if result.deleted_count > 0:
                return JsonResponse({"message": "Item removed from cart"})
            return JsonResponse({"error": "Cart item not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)
