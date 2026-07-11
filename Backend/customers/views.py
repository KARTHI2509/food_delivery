import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .db import customer_collection

# GET: List Customers
def get_customers(request):
    if request.method == "GET":
        try:
            customers = []
            for customer in customer_collection.find({}, {"_id": 0}):
                customers.append(customer)
            return JsonResponse(customers, safe=False)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=400)

# POST: Add Customer
@csrf_exempt
def add_customer(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            # Auto-increment customer_id if not present or duplicate checks
            customer_id = data.get("customer_id")
            if not customer_id:
                # Find maximum customer_id and increment, starting at 101
                max_cust = customer_collection.find_one(sort=[("customer_id", -1)])
                customer_id = (max_cust["customer_id"] + 1) if max_cust else 101
            else:
                customer_id = int(customer_id)

            if customer_collection.find_one({"customer_id": customer_id}):
                return JsonResponse({"error": f"Customer ID {customer_id} already exists"}, status=400)

            customer_doc = {
                "customer_id": customer_id,
                "full_name": data.get("full_name", ""),
                "email": data.get("email", ""),
                "phone": data.get("phone", ""),
                "address": data.get("address", ""),
                "city": data.get("city", "")
            }

            customer_collection.insert_one(customer_doc)
            return JsonResponse({"message": "Customer added successfully", "customer_id": customer_id})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
            
    return JsonResponse({"error": "Invalid request method"}, status=400)

# PUT: Update Customer by ID
@csrf_exempt
def update_customer(request, id):
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            # Remove helper IDs
            data.pop("customer_id", None)

            result = customer_collection.update_one(
                {"customer_id": int(id)},
                {"$set": data}
            )

            if result.modified_count > 0 or result.matched_count > 0:
                return JsonResponse({"message": "Customer updated successfully"})
            return JsonResponse({"error": "Customer not found or no changes made"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

# DELETE: Delete Customer by ID
@csrf_exempt
def delete_customer(request, id):
    if request.method == "DELETE":
        try:
            result = customer_collection.delete_one({"customer_id": int(id)})
            if result.deleted_count > 0:
                return JsonResponse({"message": "Customer deleted successfully"})
            return JsonResponse({"error": "Customer not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)
