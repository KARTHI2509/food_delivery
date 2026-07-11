// ==========================================================================
// FOODHUB FOOD DELIVERY APP CORE JAVASCRIPT
// ==========================================================================

const BASE_URL = window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")
    ? "http://127.0.0.1:8000"
    : window.location.origin;

// Local caching state variables
let customersCached = [];
let restaurantsCached = [];
let foodsCached = [];
let cartCached = [];
let ordersCached = [];

// Edit states trackers
let editCustomerId = null;
let editRestaurantId = null;
let editFoodId = null;
let editOrderId = null;

// Get currently logged-in user
function getLoggedInUser() {
    const userStr = localStorage.getItem("food_user");
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch (e) {
        return null;
    }
}

// Route guard based on auth status and role
function checkAuthentication() {
    const user = getLoggedInUser();
    const currentPath = window.location.pathname.split("/").pop();

    if (currentPath === "login.html" || currentPath === "register.html") {
        if (user) {
            window.location.href = user.role === "admin" ? "dashboard.html" : "index.html";
        }
        return;
    }

    if (!user) {
        // Protect booking, cart, orders, and dashboard
        const protectedPages = ["cart.html", "orders.html", "dashboard.html", "restaurants.html"];
        if (protectedPages.includes(currentPath)) {
            window.location.href = "login.html";
        }
    } else {
        // Protect admin portals
        const adminPages = ["dashboard.html", "restaurants.html"];
        if (user.role !== "admin" && adminPages.includes(currentPath)) {
            window.location.href = "index.html";
        }
    }
}

// Render dynamic navbar links
function renderNavbar() {
    const navLinks = document.getElementById("navLinks");
    if (!navLinks) return;

    const user = getLoggedInUser();
    const currentPath = window.location.pathname.split("/").pop() || "index.html";

    let linksHTML = `<li><a href="index.html" class="${currentPath === 'index.html' ? 'active' : ''}">Home</a></li>`;

    if (!user) {
        linksHTML += `
            <li><a href="login.html" class="${currentPath === 'login.html' ? 'active' : ''}">Sign In</a></li>
            <li><a href="register.html" class="${currentPath === 'register.html' ? 'active' : ''}">Register</a></li>
        `;
    } else if (user.role === "admin") {
        linksHTML += `
            <li><a href="dashboard.html" class="${currentPath === 'dashboard.html' ? 'active' : ''}">Dashboard</a></li>
            <li><a href="restaurants.html" class="${currentPath === 'restaurants.html' ? 'active' : ''}">Restaurants</a></li>
            <li><a href="orders.html" class="${currentPath === 'orders.html' ? 'active' : ''}">Orders Logs</a></li>
            <li><a href="#" onclick="handleLogout(event)"><i class="fa-solid fa-power-off"></i> Logout</a></li>
        `;
    } else {
        // Customer
        linksHTML += `
            <li><a href="cart.html" class="${currentPath === 'cart.html' ? 'active' : ''}">My Cart</a></li>
            <li><a href="orders.html" class="${currentPath === 'orders.html' ? 'active' : ''}">My Orders</a></li>
            <li><a href="#" onclick="handleLogout(event)"><i class="fa-solid fa-power-off"></i> Logout (${user.full_name})</a></li>
        `;
    }

    navLinks.innerHTML = linksHTML;
}

// Authentication Handlers
function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();

    // Check special admin email pattern or query backend
    if (email === "admin@food.com") {
        const adminUser = { customer_id: 100, full_name: "System Admin", email: "admin@food.com", role: "admin" };
        localStorage.setItem("food_user", JSON.stringify(adminUser));
        alert("Welcome, Admin!");
        window.location.href = "dashboard.html";
        return;
    }

    fetch(BASE_URL + "/customers/")
        .then(res => res.json())
        .then(customers => {
            const customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase());
            if (customer) {
                const userObj = {
                    customer_id: customer.customer_id,
                    full_name: customer.full_name,
                    email: customer.email,
                    role: "customer"
                };
                localStorage.setItem("food_user", JSON.stringify(userObj));
                alert("Welcome back, " + customer.full_name + "!");
                window.location.href = "index.html";
            } else {
                alert("Customer email not registered. Please register first.");
            }
        })
        .catch(err => console.error("Login verification error:", err));
}

function handleRegisterSubmit(e) {
    e.preventDefault();
    const fullName = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const phone = document.getElementById("regPhone").value;
    const address = document.getElementById("regAddress").value;
    const city = document.getElementById("regCity").value;

    const payload = {
        full_name: fullName,
        email: email,
        phone: phone,
        address: address,
        city: city
    };

    fetch(BASE_URL + "/customers/add/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert("Error: " + data.error);
        } else {
            alert("Registration successful! Please sign in.");
            window.location.href = "login.html";
        }
    })
    .catch(err => console.error("Registration error:", err));
}

function handleLogout(e) {
    if (e) e.preventDefault();
    localStorage.removeItem("food_user");
    alert("Signed out successfully.");
    window.location.href = "index.html";
}

// ==========================================================================
// HOME PAGE - BROWSE RESTAURANTS & FEATURED FOODS
// ==========================================================================
function getRestaurantsAndFoods() {
    Promise.all([
        fetch(BASE_URL + "/restaurants/").then(res => res.json()).catch(() => []),
        fetch(BASE_URL + "/foods/").then(res => res.json()).catch(() => [])
    ]).then(([restaurants, foods]) => {
        restaurantsCached = restaurants;
        foodsCached = foods;

        displayRestaurants(restaurants);
        displayFeaturedFoods(foods.slice(0, 4)); // Get first 4 as featured
    });
}

function displayRestaurants(restaurants) {
    const container = document.getElementById("restaurantList");
    if (!container) return;

    container.innerHTML = "";
    if (restaurants.length === 0) {
        container.innerHTML = `<div class="no-records"><i class="fa-solid fa-store-slash"></i> No restaurants available in this region.</div>`;
        return;
    }

    const restImages = [
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=600&q=80"
    ];

    restaurants.forEach((r, index) => {
        const imgUrl = restImages[index % restImages.length];
        container.innerHTML += `
        <div class="restaurant-card">
            <span class="card-badge"><i class="fa-solid fa-star" style="color: #FBBF24;"></i> ${r.rating}</span>
            <div class="card-image" style="background-image: url('${imgUrl}')"></div>
            <div class="card-body">
                <h3>${r.restaurant_name}</h3>
                <p><i class="fa-solid fa-bowl-food"></i> <b>Cuisine:</b> ${r.cuisine}</p>
                <p><i class="fa-solid fa-location-dot"></i> <b>Location:</b> ${r.location}</p>
                <p><i class="fa-solid fa-user"></i> <b>Owner:</b> ${r.owner_name}</p>
                
                <div class="card-actions">
                    <a href="menu.html?restaurant=${encodeURIComponent(r.restaurant_name)}" class="btn" style="width:100%; display:inline-flex; justify-content:center;">
                        <i class="fa-solid fa-list"></i> View Menu & Order
                    </a>
                </div>
            </div>
        </div>
        `;
    });
}

function displayFeaturedFoods(foods) {
    const container = document.getElementById("featuredFoodList");
    if (!container) return;

    container.innerHTML = "";
    if (foods.length === 0) {
        container.innerHTML = `<div class="no-records"><i class="fa-solid fa-burger"></i> No food dishes currently featured.</div>`;
        return;
    }

    const foodImages = [
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80"
    ];

    foods.forEach((f, idx) => {
        const imgUrl = foodImages[idx % foodImages.length];
        container.innerHTML += `
        <div class="food-card">
            <span class="card-badge"><i class="fa-solid fa-tag"></i> ₹${f.price}</span>
            <div class="card-image" style="background-image: url('${imgUrl}')"></div>
            <div class="card-body">
                <h3>${f.food_name}</h3>
                <p><i class="fa-solid fa-store"></i> <b>Restaurant:</b> ${f.restaurant_name}</p>
                <p><i class="fa-solid fa-utensils"></i> <b>Category:</b> ${f.category}</p>
                <p><i class="fa-solid fa-circle-check"></i> <b>Status:</b> ${f.availability}</p>
                
                <div class="card-actions">
                    <button class="btn" onclick="addToCartDirectly('${f.restaurant_name}', '${f.food_name}', ${f.price})" ${f.availability === 'Out of Stock' ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                        <i class="fa-solid fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        </div>
        `;
    });
}

function triggerSearch() {
    const query = document.getElementById("searchQuery").value.trim().toLowerCase();
    if (!query) {
        getRestaurantsAndFoods();
        return;
    }

    const filteredRestaurants = restaurantsCached.filter(r => 
        r.restaurant_name.toLowerCase().includes(query) || 
        r.cuisine.toLowerCase().includes(query) || 
        r.location.toLowerCase().includes(query)
    );

    const filteredFoods = foodsCached.filter(f => 
        f.food_name.toLowerCase().includes(query) || 
        f.category.toLowerCase().includes(query)
    );

    displayRestaurants(filteredRestaurants);
    displayFeaturedFoods(filteredFoods);
}

function handleSearch(e) {
    if (e.key === "Enter") {
        triggerSearch();
    }
}

// ==========================================================================
// RESTAURANT MENU PAGE & ADD TO CART
// ==========================================================================
function loadMenuDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const restaurantName = urlParams.get("restaurant");
    if (!restaurantName) return;

    // Load Cart badge count
    updateCartCountBadge();

    // Set restaurant details info
    fetch(BASE_URL + "/restaurants/")
        .then(res => res.json())
        .then(restaurants => {
            const rest = restaurants.find(r => r.restaurant_name === restaurantName);
            if (rest) {
                document.getElementById("resDetailName").textContent = rest.restaurant_name;
                document.getElementById("resDetailMeta").textContent = `${rest.cuisine} | ${rest.location}`;
                document.getElementById("resDetailRating").innerHTML = `<i class="fa-solid fa-star"></i> ${rest.rating}`;
            }
        });

    // Load Menu Foods
    fetch(BASE_URL + "/foods/?restaurant=" + encodeURIComponent(restaurantName))
        .then(res => res.json())
        .then(foods => {
            const container = document.getElementById("foodMenuGrid");
            if (!container) return;

            container.innerHTML = "";
            if (foods.length === 0) {
                container.innerHTML = `<div class="no-records" style="grid-column:1/-1;"><i class="fa-solid fa-utensils"></i> No food dishes registered for this restaurant yet.</div>`;
                return;
            }

            const foodImages = [
                "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80"
            ];

            foods.forEach((f, idx) => {
                const imgUrl = foodImages[idx % foodImages.length];
                const isOutOfStock = f.availability === "Out of Stock";

                container.innerHTML += `
                <div class="food-card">
                    <span class="card-badge"><i class="fa-solid fa-tag"></i> ₹${f.price}</span>
                    <div class="card-image" style="background-image: url('${imgUrl}')"></div>
                    <div class="card-body">
                        <h3>${f.food_name}</h3>
                        <p><i class="fa-solid fa-utensils"></i> <b>Category:</b> ${f.category}</p>
                        <p><i class="fa-solid fa-circle-check"></i> <b>Status:</b> 
                            <span class="${isOutOfStock ? 'badge badge-danger' : 'badge badge-success'}">${f.availability}</span>
                        </p>
                        <div class="card-actions">
                            <button class="btn" onclick="addToCart('${f.food_name}', ${f.price})" ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                                <i class="fa-solid fa-cart-plus"></i> Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
                `;
            });
        });
}

function updateCartCountBadge() {
    const user = getLoggedInUser();
    const badge = document.getElementById("cartCountBadge");
    if (!badge || !user) return;

    fetch(BASE_URL + "/cart/?customer=" + encodeURIComponent(user.full_name))
        .then(res => res.json())
        .then(items => {
            badge.textContent = items.length;
        });
}

function addToCart(foodName, price) {
    const user = getLoggedInUser();
    if (!user) {
        alert("Please login to order food.");
        window.location.href = "login.html";
        return;
    }

    const payload = {
        customer_name: user.full_name,
        food_name: foodName,
        quantity: 1,
        price: price
    };

    fetch(BASE_URL + "/cart/add/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || data.error);
        updateCartCountBadge();
    })
    .catch(err => console.error("Error adding to cart:", err));
}

function addToCartDirectly(restaurantName, foodName, price) {
    const user = getLoggedInUser();
    if (!user) {
        alert("Please login to order food.");
        window.location.href = "login.html";
        return;
    }

    addToCart(foodName, price);
}

// ==========================================================================
// CART PAGE MANAGEMENT & CHECKOUT
// ==========================================================================
function getCartItems() {
    const user = getLoggedInUser();
    if (!user) return;

    fetch(BASE_URL + "/cart/?customer=" + encodeURIComponent(user.full_name))
        .then(res => res.json())
        .then(items => {
            cartCached = items;
            const tableBody = document.getElementById("cartItemsTable");
            if (!tableBody) return;

            tableBody.innerHTML = "";
            if (items.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="no-records" style="padding: 40px;">
                            <i class="fa-solid fa-cart-shopping"></i> Your shopping cart is empty.
                        </td>
                    </tr>
                `;
                document.getElementById("cartSubtotal").textContent = "₹0.00";
                document.getElementById("cartGrandTotal").textContent = "₹0.00";
                return;
            }

            let subtotal = 0;
            items.forEach(item => {
                subtotal += item.total_price;
                tableBody.innerHTML += `
                <tr>
                    <td><b>${item.food_name}</b></td>
                    <td>₹${item.price}</td>
                    <td>
                        <div class="qty-control">
                            <button class="qty-btn" onclick="changeQty(${item.cart_id}, ${item.quantity - 1})">-</button>
                            <b>${item.quantity}</b>
                            <button class="qty-btn" onclick="changeQty(${item.cart_id}, ${item.quantity + 1})">+</button>
                        </div>
                    </td>
                    <td><b>₹${item.total_price}</b></td>
                    <td>
                        <button class="btn btn-danger" onclick="removeFromCart(${item.cart_id})" style="padding: 6px 12px; font-size:12px;">
                            <i class="fa-solid fa-trash"></i> Remove
                        </button>
                    </td>
                </tr>
                `;
            });

            document.getElementById("cartSubtotal").textContent = `₹${subtotal.toFixed(2)}`;
            document.getElementById("cartGrandTotal").textContent = `₹${subtotal.toFixed(2)}`;
        });
}

function changeQty(cartId, newQty) {
    if (newQty <= 0) {
        removeFromCart(cartId);
        return;
    }

    const payload = { quantity: newQty };
    fetch(BASE_URL + "/cart/update/" + cartId + "/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(() => getCartItems());
}

function removeFromCart(cartId) {
    fetch(BASE_URL + "/cart/delete/" + cartId + "/", { method: "DELETE" })
        .then(res => res.json())
        .then(() => getCartItems());
}

function proceedToCheckout() {
    const user = getLoggedInUser();
    if (!user || cartCached.length === 0) return;

    // Build ordered items summary string, e.g. "Chicken Biryani x2, Margherita Pizza x1"
    const itemsStr = cartCached.map(item => `${item.food_name} x${item.quantity}`).join(", ");
    
    // Sum total
    const subtotal = cartCached.reduce((sum, item) => sum + item.total_price, 0);

    const payload = {
        customer_name: user.full_name,
        restaurant_name: document.getElementById("selectedRestaurantName").value,
        order_items: itemsStr,
        total_amount: subtotal,
        payment_status: "Paid",
        delivery_status: "Preparing"
    };

    fetch(BASE_URL + "/orders/add/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert("Checkout error: " + data.error);
        } else {
            alert("Order placed successfully! Order ID: #" + data.order_id);
            window.location.href = "orders.html";
        }
    })
    .catch(err => console.error("Checkout failure:", err));
}

// ==========================================================================
// CUSTOMER & ADMIN ORDERS LIST & TRACKING
// ==========================================================================
function getOrders() {
    const user = getLoggedInUser();
    if (!user) return;

    let url = BASE_URL + "/orders/";
    // Customers only see their own orders
    if (user.role !== "admin") {
        url += "?customer=" + encodeURIComponent(user.full_name);
    }

    fetch(url)
        .then(res => res.json())
        .then(orders => {
            const tableBody = document.getElementById("ordersListTable");
            if (!tableBody) return;

            tableBody.innerHTML = "";
            if (orders.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="no-records" style="padding: 40px;">
                            <i class="fa-solid fa-truck"></i> No orders recorded yet.
                        </td>
                    </tr>
                `;
                return;
            }

            orders.forEach(o => {
                let badgeClass = "badge-warning";
                if (o.delivery_status === "Delivered") badgeClass = "badge-success";
                else if (o.delivery_status === "Cancelled") badgeClass = "badge-danger";

                const isCancelable = o.delivery_status === "Preparing";

                tableBody.innerHTML += `
                <tr>
                    <td><b>#${o.order_id}</b></td>
                    <td><b>${o.restaurant_name}</b></td>
                    <td>${o.order_items}</td>
                    <td><b>₹${o.total_amount}</b></td>
                    <td><span class="badge badge-success">${o.payment_status}</span></td>
                    <td><span class="badge ${badgeClass}">${o.delivery_status}</span></td>
                    <td>
                        ${isCancelable ? `
                            <button class="btn btn-danger" onclick="cancelOrder(${o.order_id})" style="padding: 6px 12px; font-size:12px;">
                                Cancel Order
                            </button>
                        ` : '<span style="color:var(--text-muted); font-size:12px;">N/A</span>'}
                    </td>
                </tr>
                `;
            });
        });
}

function cancelOrder(orderId) {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    fetch(BASE_URL + "/orders/delete/" + orderId + "/", {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || data.error);
        getOrders();
    })
    .catch(err => console.error("Error cancelling order:", err));
}

// ==========================================================================
// ADMIN DASHBOARD OVERVIEW & CRUD LOGS
// ==========================================================================
function loadDashboardOverview() {
    Promise.all([
        fetch(BASE_URL + "/customers/").then(res => res.json()).catch(() => []),
        fetch(BASE_URL + "/restaurants/").then(res => res.json()).catch(() => []),
        fetch(BASE_URL + "/foods/").then(res => res.json()).catch(() => []),
        fetch(BASE_URL + "/orders/").then(res => res.json()).catch(() => [])
    ]).then(([customers, restaurants, foods, orders]) => {
        customersCached = customers;
        restaurantsCached = restaurants;
        foodsCached = foods;
        ordersCached = orders;

        // Populate statistic counters
        document.getElementById("statCustomers").textContent = customers.length;
        document.getElementById("statRestaurants").textContent = restaurants.length;
        document.getElementById("statFoods").textContent = foods.length;
        document.getElementById("statOrders").textContent = orders.length;

        const totalRevenue = orders.filter(o => o.delivery_status !== 'Cancelled').reduce((sum, o) => sum + o.total_amount, 0);
        document.getElementById("statRevenue").textContent = "₹" + totalRevenue.toFixed(2);

        // Load Tables
        displayAdminCustomers();
        displayAdminFoods();
        displayAdminOrders();

        // Populate restaurants dropdown inside food menu creator form
        const foodResSelect = document.getElementById("foodRestaurantSelect");
        if (foodResSelect) {
            foodResSelect.innerHTML = `<option value="">Select Restaurant</option>`;
            restaurants.forEach(r => {
                foodResSelect.innerHTML += `<option value="${r.restaurant_name}">${r.restaurant_name}</option>`;
            });
        }
    });
}

// Admin Customers Management
function displayAdminCustomers() {
    const tbody = document.getElementById("adminCustomerTable");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (customersCached.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 15px;">No customers found.</td></tr>`;
        return;
    }

    customersCached.forEach(c => {
        tbody.innerHTML += `
        <tr>
            <td><b>#${c.customer_id}</b></td>
            <td><b>${c.full_name}</b></td>
            <td>${c.email}</td>
            <td>${c.phone}</td>
            <td>${c.address} (${c.city})</td>
            <td>
                <button class="btn btn-success" onclick="loadCustomerForEdit(${c.customer_id})" style="padding: 6px 12px; font-size:12px;"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn btn-danger" onclick="deleteCustomer(${c.customer_id})" style="padding: 6px 12px; font-size:12px;"><i class="fas fa-trash"></i> Delete</button>
            </td>
        </tr>
        `;
    });
}

function handleCustomerCRUD(e) {
    e.preventDefault();
    const customer = {
        full_name: document.getElementById("custName").value,
        email: document.getElementById("custEmail").value,
        phone: document.getElementById("custPhone").value,
        address: document.getElementById("custAddress").value,
        city: document.getElementById("custCity").value
    };

    let url = BASE_URL + "/customers/add/";
    let method = "POST";

    if (editCustomerId !== null) {
        url = BASE_URL + "/customers/update/" + editCustomerId + "/";
        method = "PUT";
    }

    fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer)
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || data.error);
        clearCustomerForm();
        loadDashboardOverview();
    });
}

function loadCustomerForEdit(id) {
    const customer = customersCached.find(c => c.customer_id === id);
    if (!customer) return;

    editCustomerId = id;
    document.getElementById("customerFormTitle").textContent = "Edit Customer Profile";
    document.getElementById("custName").value = customer.full_name;
    document.getElementById("custEmail").value = customer.email;
    document.getElementById("custPhone").value = customer.phone;
    document.getElementById("custAddress").value = customer.address;
    document.getElementById("custCity").value = customer.city;

    scrollToForm();
}

function deleteCustomer(id) {
    if (!confirm("Are you sure you want to delete this customer profile?")) return;
    fetch(BASE_URL + "/customers/delete/" + id + "/", { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
            alert(data.message || data.error);
            loadDashboardOverview();
        });
}

function clearCustomerForm() {
    document.getElementById("customerFormTitle").textContent = "Add New Customer";
    document.getElementById("customerForm").reset();
    editCustomerId = null;
}

// Admin Food Menu Management
function displayAdminFoods() {
    const tbody = document.getElementById("adminFoodTable");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (foodsCached.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 15px;">No dishes registered.</td></tr>`;
        return;
    }

    foodsCached.forEach(f => {
        tbody.innerHTML += `
        <tr>
            <td><b>#${f.food_id}</b></td>
            <td><b>${f.restaurant_name}</b></td>
            <td><b>${f.food_name}</b></td>
            <td>${f.category}</td>
            <td><b>₹${f.price}</b></td>
            <td><span class="${f.availability === 'Available' ? 'badge badge-success' : 'badge badge-danger'}">${f.availability}</span></td>
            <td>
                <button class="btn btn-success" onclick="loadFoodForEdit(${f.food_id})" style="padding: 6px 12px; font-size:12px;"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn btn-danger" onclick="deleteFood(${f.food_id})" style="padding: 6px 12px; font-size:12px;"><i class="fas fa-trash"></i> Delete</button>
            </td>
        </tr>
        `;
    });
}

function handleFoodCRUD(e) {
    e.preventDefault();
    const food = {
        restaurant_name: document.getElementById("foodRestaurantSelect").value,
        food_name: document.getElementById("foodName").value,
        category: document.getElementById("foodCategory").value,
        price: document.getElementById("foodPrice").value,
        availability: document.getElementById("foodAvailability").value
    };

    let url = BASE_URL + "/foods/add/";
    let method = "POST";

    if (editFoodId !== null) {
        url = BASE_URL + "/foods/update/" + editFoodId + "/";
        method = "PUT";
    }

    fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(food)
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || data.error);
        clearFoodForm();
        loadDashboardOverview();
    });
}

function loadFoodForEdit(id) {
    const food = foodsCached.find(f => f.food_id === id);
    if (!food) return;

    editFoodId = id;
    document.getElementById("foodFormTitle").textContent = "Edit Dish details";
    document.getElementById("foodRestaurantSelect").value = food.restaurant_name;
    document.getElementById("foodName").value = food.food_name;
    document.getElementById("foodCategory").value = food.category;
    document.getElementById("foodPrice").value = food.price;
    document.getElementById("foodAvailability").value = food.availability;

    scrollToForm();
}

function deleteFood(id) {
    if (!confirm("Are you sure you want to delete this menu dish?")) return;
    fetch(BASE_URL + "/foods/delete/" + id + "/", { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
            alert(data.message || data.error);
            loadDashboardOverview();
        });
}

function clearFoodForm() {
    document.getElementById("foodFormTitle").textContent = "Add New Dish";
    document.getElementById("foodForm").reset();
    editFoodId = null;
}

// Admin Platform Orders Management
function displayAdminOrders() {
    const tbody = document.getElementById("adminOrderTable");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (ordersCached.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 15px;">No orders found.</td></tr>`;
        return;
    }

    ordersCached.forEach(o => {
        tbody.innerHTML += `
        <tr>
            <td><b>#${o.order_id}</b></td>
            <td><b>${o.customer_name}</b></td>
            <td>${o.restaurant_name}</td>
            <td>${o.order_items}</td>
            <td><b>₹${o.total_amount}</b></td>
            <td>
                <select onchange="updateOrderStatus(${o.order_id}, 'payment_status', this.value)" style="padding: 4px; font-size:12px; border-radius: 4px;">
                    <option value="Pending" ${o.payment_status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Paid" ${o.payment_status === 'Paid' ? 'selected' : ''}>Paid</option>
                </select>
            </td>
            <td>
                <select onchange="updateOrderStatus(${o.order_id}, 'delivery_status', this.value)" style="padding: 4px; font-size:12px; border-radius: 4px;">
                    <option value="Preparing" ${o.delivery_status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                    <option value="Out for Delivery" ${o.delivery_status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                    <option value="Delivered" ${o.delivery_status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${o.delivery_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td>
                <button class="btn btn-danger" onclick="cancelOrder(${o.order_id})" style="padding: 6px 12px; font-size:12px;">Cancel</button>
            </td>
        </tr>
        `;
    });
}

function updateOrderStatus(orderId, field, value) {
    const payload = {};
    payload[field] = value;

    fetch(BASE_URL + "/orders/update/" + orderId + "/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert("Error: " + data.error);
        } else {
            alert("Order status updated successfully.");
            loadDashboardOverview();
        }
    });
}

// ==========================================================================
// ADMINISTRATIVE RESTAURANTS MANAGEMENT
// ==========================================================================
function getAdminRestaurants() {
    fetch(BASE_URL + "/restaurants/")
        .then(res => res.json())
        .then(restaurants => {
            restaurantsCached = restaurants;
            const tableBody = document.getElementById("restaurantListTable");
            if (!tableBody) return;

            tableBody.innerHTML = "";
            if (restaurants.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7" class="no-records"><i class="fa-solid fa-utensils"></i> No restaurants registered.</td></tr>`;
                return;
            }

            restaurants.forEach(r => {
                tableBody.innerHTML += `
                <tr>
                    <td><b>#${r.restaurant_id}</b></td>
                    <td><b>${r.restaurant_name}</b></td>
                    <td>${r.owner_name}</td>
                    <td>${r.location}</td>
                    <td><span class="badge badge-success">${r.cuisine}</span></td>
                    <td><b><i class="fa-solid fa-star" style="color: #FBBF24;"></i> ${r.rating}</b></td>
                    <td>
                        <button class="btn btn-success" onclick="loadRestaurantForEdit(${r.restaurant_id})" style="padding: 6px 12px; font-size: 12px;"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn btn-danger" onclick="deleteRestaurant(${r.restaurant_id})" style="padding: 6px 12px; font-size: 12px;"><i class="fas fa-trash"></i> Delete</button>
                    </td>
                </tr>
                `;
            });
        });
}

function handleRestaurantFormSubmit(e) {
    e.preventDefault();
    const restaurant = {
        restaurant_name: document.getElementById("restaurantName").value,
        owner_name: document.getElementById("restaurantOwner").value,
        location: document.getElementById("restaurantLocation").value,
        cuisine: document.getElementById("restaurantCuisine").value,
        rating: document.getElementById("restaurantRating").value
    };

    let url = BASE_URL + "/restaurants/add/";
    let method = "POST";

    if (editRestaurantId !== null) {
        url = BASE_URL + "/restaurants/update/" + editRestaurantId + "/";
        method = "PUT";
    }

    fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restaurant)
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || data.error);
        clearRestaurantForm();
        getAdminRestaurants();
    });
}

function loadRestaurantForEdit(id) {
    const restaurant = restaurantsCached.find(r => r.restaurant_id === id);
    if (!restaurant) return;

    editRestaurantId = id;
    document.getElementById("formTitle").textContent = "Edit Restaurant Profile";
    document.getElementById("restaurantName").value = restaurant.restaurant_name;
    document.getElementById("restaurantOwner").value = restaurant.owner_name;
    document.getElementById("restaurantLocation").value = restaurant.location;
    document.getElementById("restaurantCuisine").value = restaurant.cuisine;
    document.getElementById("restaurantRating").value = restaurant.rating;

    scrollToForm();
}

function deleteRestaurant(id) {
    if (!confirm("Are you sure you want to delete this restaurant?")) return;

    fetch(BASE_URL + "/restaurants/delete/" + id + "/", { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
            alert(data.message || data.error);
            getAdminRestaurants();
        });
}

function clearRestaurantForm() {
    document.getElementById("formTitle").textContent = "Register Restaurant";
    document.getElementById("restaurantForm").reset();
    editRestaurantId = null;
}

// Help scrolling to edit forms on mobile layouts
function scrollToForm() {
    if (window.innerWidth <= 1024) {
        const form = document.querySelector("form");
        if (form) {
            form.scrollIntoView({ behavior: "smooth" });
        }
    }
}

// Mobile Hamburger Menu toggler
function toggleMobileMenu() {
    const navLinks = document.getElementById("navLinks");
    if (navLinks) {
        navLinks.classList.toggle("open");
    }
}

// ==========================================================================
// WINDOW LOAD DISPATCHER
// ==========================================================================
window.onload = function() {
    // 1. Force Auth Route guard
    checkAuthentication();

    // 2. Render Navbar by role
    renderNavbar();

    // 3. Dispatch functions by page
    const currentPath = window.location.pathname.split("/").pop() || "index.html";

    if (currentPath === "index.html") {
        getRestaurantsAndFoods();
    } else if (currentPath === "menu.html") {
        loadMenuDetails();
    } else if (currentPath === "cart.html") {
        getCartItems();
    } else if (currentPath === "orders.html") {
        getOrders();
    } else if (currentPath === "dashboard.html") {
        loadDashboardOverview();
    } else if (currentPath === "restaurants.html") {
        getAdminRestaurants();
    }
};
