from django.contrib import admin
from django.urls import path
from customers import views as customer_views
from restaurants import views as restaurant_views
from foods import views as food_views
from cart import views as cart_views
from orders import views as order_views

urlpatterns = [
    path('admin/', admin.site.urls),

    # Customer Management
    path('customers/', customer_views.get_customers, name='get_customers'),
    path('customers/add/', customer_views.add_customer, name='add_customer'),
    path('customers/update/<int:id>/', customer_views.update_customer, name='update_customer'),
    path('customers/delete/<int:id>/', customer_views.delete_customer, name='delete_customer'),

    # Restaurant Management
    path('restaurants/', restaurant_views.get_restaurants, name='get_restaurants'),
    path('restaurants/add/', restaurant_views.add_restaurant, name='add_restaurant'),
    path('restaurants/update/<int:id>/', restaurant_views.update_restaurant, name='update_restaurant'),
    path('restaurants/delete/<int:id>/', restaurant_views.delete_restaurant, name='delete_restaurant'),

    # Food Menu Management
    path('foods/', food_views.get_foods, name='get_foods'),
    path('foods/add/', food_views.add_food, name='add_food'),
    path('foods/update/<int:id>/', food_views.update_food, name='update_food'),
    path('foods/delete/<int:id>/', food_views.delete_food, name='delete_food'),

    # Cart Management
    path('cart/', cart_views.get_cart, name='get_cart'),
    path('cart/add/', cart_views.add_to_cart, name='add_to_cart'),
    path('cart/update/<int:id>/', cart_views.update_cart, name='update_cart'),
    path('cart/delete/<int:id>/', cart_views.delete_cart, name='delete_cart'),

    # Order Management
    path('orders/', order_views.get_orders, name='get_orders'),
    path('orders/add/', order_views.add_order, name='add_order'),
    path('orders/update/<int:id>/', order_views.update_order, name='update_order'),
    path('orders/delete/<int:id>/', order_views.delete_order, name='delete_order'),
]
