import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .db import food_collection

# GET: List Food Menu Items
def get_foods(request):
    if request.method == "GET":
        try:
            # Allow filtering by restaurant_name if query param is passed
            restaurant_name = request.GET.get("restaurant")
            query = {}
            if restaurant_name:
                query["restaurant_name"] = restaurant_name

            foods = []
            for item in food_collection.find(query, {"_id": 0}):
                foods.append(item)
            return JsonResponse(foods, safe=False)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=400)

# POST: Add Food Item
@csrf_exempt
def add_food(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            food_id = data.get("food_id")
            if not food_id:
                max_food = food_collection.find_one(sort=[("food_id", -1)])
                food_id = (max_food["food_id"] + 1) if max_food else 301
            else:
                food_id = int(food_id)

            if food_collection.find_one({"food_id": food_id}):
                return JsonResponse({"error": f"Food ID {food_id} already exists"}, status=400)

            food_doc = {
                "food_id": food_id,
                "restaurant_name": data.get("restaurant_name", ""),
                "food_name": data.get("food_name", ""),
                "category": data.get("category", ""),
                "price": float(data.get("price", 0)),
                "availability": data.get("availability", "Available")
            }

            food_collection.insert_one(food_doc)
            return JsonResponse({"message": "Food item added successfully", "food_id": food_id})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

# PUT: Update Food Item by ID
@csrf_exempt
def update_food(request, id):
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            data.pop("food_id", None)

            if "price" in data:
                data["price"] = float(data["price"])

            result = food_collection.update_one(
                {"food_id": int(id)},
                {"$set": data}
            )

            if result.modified_count > 0 or result.matched_count > 0:
                return JsonResponse({"message": "Food item updated successfully"})
            return JsonResponse({"error": "Food item not found or no changes made"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

# DELETE: Delete Food Item by ID
@csrf_exempt
def delete_food(request, id):
    if request.method == "DELETE":
        try:
            result = food_collection.delete_one({"food_id": int(id)})
            if result.deleted_count > 0:
                return JsonResponse({"message": "Food item deleted successfully"})
            return JsonResponse({"error": "Food item not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)
