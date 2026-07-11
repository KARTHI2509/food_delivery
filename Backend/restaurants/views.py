import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .db import restaurant_collection

# GET: List Restaurants
def get_restaurants(request):
    if request.method == "GET":
        try:
            restaurants = []
            for res in restaurant_collection.find({}, {"_id": 0}):
                restaurants.append(res)
            return JsonResponse(restaurants, safe=False)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=400)

# POST: Add Restaurant
@csrf_exempt
def add_restaurant(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            restaurant_id = data.get("restaurant_id")
            if not restaurant_id:
                max_res = restaurant_collection.find_one(sort=[("restaurant_id", -1)])
                restaurant_id = (max_res["restaurant_id"] + 1) if max_res else 201
            else:
                restaurant_id = int(restaurant_id)

            if restaurant_collection.find_one({"restaurant_id": restaurant_id}):
                return JsonResponse({"error": f"Restaurant ID {restaurant_id} already exists"}, status=400)

            restaurant_doc = {
                "restaurant_id": restaurant_id,
                "restaurant_name": data.get("restaurant_name", ""),
                "owner_name": data.get("owner_name", ""),
                "location": data.get("location", ""),
                "cuisine": data.get("cuisine", ""),
                "rating": float(data.get("rating", 4.0))
            }

            restaurant_collection.insert_one(restaurant_doc)
            return JsonResponse({"message": "Restaurant added successfully", "restaurant_id": restaurant_id})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

# PUT: Update Restaurant by ID
@csrf_exempt
def update_restaurant(request, id):
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            data.pop("restaurant_id", None)

            if "rating" in data:
                data["rating"] = float(data["rating"])

            result = restaurant_collection.update_one(
                {"restaurant_id": int(id)},
                {"$set": data}
            )

            if result.modified_count > 0 or result.matched_count > 0:
                return JsonResponse({"message": "Restaurant updated successfully"})
            return JsonResponse({"error": "Restaurant not found or no changes made"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

# DELETE: Delete Restaurant by ID
@csrf_exempt
def delete_restaurant(request, id):
    if request.method == "DELETE":
        try:
            result = restaurant_collection.delete_one({"restaurant_id": int(id)})
            if result.deleted_count > 0:
                return JsonResponse({"message": "Restaurant deleted successfully"})
            return JsonResponse({"error": "Restaurant not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)
