# Quick Start - Sakura-Sushi 🍣

## Project Structure

### Backend

```
server/
├── server.js              # Express server entry point
├── db.js                   # MariaDB connection and database functions
├── routes/                 # API route handlers
│   ├── auth.js            # Authentication routes (/api/auth/*)
│   ├── menu.js            # Menu routes (/api/menu/*)
│   ├── restaurants.js     # Restaurant routes (/api/restaurants/*)
│   ├── orders.js          # Order routes (/api/orders/*)
│   ├── admin.js           # Admin routes (/api/admin/*)
│   └── pages.js            # Static page routes
├── services/               # Business logic services
│   ├── userService.js     # User management operations
│   ├── menuService.js     # Menu operations
│   ├── restaurantService.js # Restaurant operations
│   └── orderService.js    # Order operations
└── middleware/             # Express middleware
    └── auth.js            # JWT authentication and admin authorization
```

### Frontend

```
front/
├── *.html         # HTML application pages
├── js/            # TypeScript source files
│   ├── index.ts   # Main page and initialization
│   ├── api.ts     # API client for server requests
│   ├── cart.ts    # Shopping cart logic
│   ├── menu.ts    # Menu display and filters
│   ├── checkout.ts # Checkout page
│   ├── orders.ts  # Order history
│   ├── admin.ts   # Administrative panel
│   ├── user.ts    # User management (authentication)
│   ├── theme.ts   # Theme switching (light/dark)
│   └── utils.ts   # Utility functions
├── js-dist/       # Compiled JavaScript files
├── Components/    # CSS styles for components
└── images/        # Project images
```

## Architecture

- **Routes** (`server/routes/`) - Handle HTTP requests and responses, delegate business logic to services
- **Services** (`server/services/`) - Contain business logic and database operations
- **Middleware** (`server/middleware/`) - Handle cross-cutting concerns like authentication and authorization
- **Database** (`server/db.js`) - Manages database connections and provides query utilities

## Main Features

### 1. User Management

- **Registration** - create new account
- **Authentication** - login to system (JWT tokens)
- **Profile** - view and manage user data
- **Roles** - separation between regular users and administrators

### 2. Restaurant Menu

- **Menu Viewing** - display all dishes
- **Type Filtering** - Rolls, Sushi, Hot Dishes
- **Day of Week Filtering** - dish availability on specific days
- **Dish Tags** - Vegan, Gluten-free, Spicy, etc.
- **Administrative Management** - CRUD operations for menu (admin only)

### 3. Shopping Cart

- **Add Items** - select dishes from menu
- **Quantity Modification** - increase/decrease items
- **Remove Items** - delete items from cart
- **localStorage Persistence** - cart persists between sessions
- **Total Price Calculation** - automatic order total calculation

### 4. Orders

- **Order Creation** - checkout from cart
- **Restaurant Selection** - choose delivery location
- **Delivery Date and Time** - specify desired delivery time
- **Order History** - view all user orders
- **Order Statuses** - pending, confirmed, preparing, ready, delivered, cancelled
- **Administrative Management** - status changes and order deletion

### 5. Restaurants

- **Restaurant Information** - addresses, coordinates, working hours
- **Map Integration** - display on map (Leaflet)
- **Public Transport Stops** - HSL API integration

### 6. Administrative Panel

- **Menu Management** - add, edit, delete dishes
- **Order Management** - view all orders, change statuses
- **Admin Access Only** - protected via JWT and role verification

## API Endpoints

### Public

- `GET /api/menu` - get menu
- `GET /api/menu/days?days=1,2,3` - menu by days of week
- `GET /api/restaurants` - get restaurant list
- `POST /api/auth/register` - registration
- `POST /api/auth/login` - login

### Protected (require JWT token)

- `GET /api/orders` - get user orders
- `POST /api/orders` - create new order
- `POST /api/auth/validate` - validate token
- `POST /api/auth/logout` - logout

### Administrative (require admin role)

- `GET /api/admin/menu` - get menu (admin)
- `POST /api/admin/menu` - add dish
- `PUT /api/admin/menu/:id` - update dish
- `DELETE /api/admin/menu/:id` - delete dish
- `PUT /api/admin/orders/:id/status` - change order status
- `DELETE /api/admin/orders/:id` - delete order

## Main Pages

- `/` - main page
- `/menu` - restaurant menu
- `/checkout` - checkout page
- `/orders` - order history
- `/profile` - user profile
- `/admin` - administrative panel
- `/contact` - contacts
- `/about` - about us
