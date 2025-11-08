# Database Design for Sakura Sushi

## 1. Application Requirements and Functionality

### Main Features:

1. **User Management**
    - New user registration
    - Authentication (login/logout)
    - User profile management
    - Role separation (administrator, regular user)

2. **Menu Management**
    - Menu viewing for customers
    - Filtering by dish types (Rolls, Sushi, Hot Dishes)
    - Filtering by days of week availability
    - Administrative menu management (CRUD operations)
    - Tags for dishes (Vegan, Gluten-free, Spicy, etc.)

3. **Restaurant Management**
    - Information about multiple restaurant branches
    - Addresses and coordinates for map
    - Working hours for each restaurant
    - Menu to restaurants relationship (different restaurants can have different menus)

4. **Order Management**
    - Creating orders from cart
    - Order history storage
    - Order relationships with users and restaurants
    - Order details (menu items, quantities, prices)

5. **Shopping Cart**
    - Adding/removing items
    - Quantity modification
    - Total cost calculation

## 2. Entities (Tables) and Relationships

### Main Entities:

1. **users** - System users
2. **roles** - User roles (admin, user)
3. **restaurants** - Restaurants
4. **menu** - Menu dishes
5. **menu_tags** - Tags for dishes (Vegan, Spicy, etc.)
6. **menu_item_tags** - Dishes to tags relationship (N:M)
7. **menu_available_days** - Days of week when dishes are available
8. **restaurant_menu** - Restaurants to menu relationship (N:M)
9. **orders** - Orders
10. **order_items** - Order line items

### Table Relationships:

- `users` → `roles` (Many-to-One): each user has one role
- `restaurants` ↔ `menu` (Many-to-Many): through `restaurant_menu` table
- `menu` ↔ `menu_tags` (Many-to-Many): through `menu_item_tags` table
- `menu` ↔ days of week (Many-to-Many): through `menu_available_days` table
- `users` → `orders` (One-to-Many): one user can have many orders
- `restaurants` → `orders` (One-to-Many): one restaurant can have many orders
- `orders` → `order_items` (One-to-Many): one order contains many items
- `menu` → `order_items` (One-to-Many): one dish can be in different order items

## 3. Database Structure Diagram

```
┌─────────────┐
│    roles    │
│─────────────│
│ id (PK)     │
│ name        │
│ description │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────┐
│    users    │
│─────────────│
│ id (PK)     │
│ email       │
│ password    │
│ role_id(FK) │
│ created_at  │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────┐      ┌──────────────┐
│   orders    │      │ restaurants  │
│─────────────│      │──────────────│
│ id (PK)     │      │ id (PK)      │
│ user_id(FK) │      │ name         │
│ restaurant  │◄─────┤ address      │
│ _id (FK)    │  N:1 │ working_hours│
│ total_price │      │ latitude     │
│ status      │      │ longitude    │
│ created_at  │      └──────┬───────┘
└──────┬──────┘             │
       │                    │ N:M
       │ 1:N                │
       │                    │
┌──────▼──────────┐    ┌────▼──────────────┐
│  order_items    │    │  restaurant_menu  │
│─────────────────│    │──────────────────│
│ id (PK)         │    │ restaurant_id(FK)│
│ order_id (FK)   │    │ menu_id (FK)     │
│ menu_id (FK)    │    └────┬─────────────┘
│ quantity        │         │
│ price           │         │ N:1
│ subtotal        │         │
└──────┬──────────┘         │
       │                    │
       │ N:1                │
       │                    │
┌──────▼──────────┐    ┌────▼──────────────┐
│     menu        │    │                   │
│─────────────────│    │                   │
│ id (PK)         │    │                   │
│ type            │    │                   │
│ title           │    │                   │
│ description     │    │                   │
│ price           │    │                   │
└──────┬──────────┘    │                   │
       │               │                   │
       │ N:M           │                   │
       │               │                   │
┌──────▼───────────────▼──────┐    ┌───────▼──────────────┐
│    menu_item_tags           │    │   menu_available_   │
│─────────────────────────────│    │      days           │
│ menu_id (FK)                │    │─────────────────────│
│ tag_id (FK)                 │    │ menu_id (FK)        │
└──────┬──────────┬───────────┘    │ day_of_week         │
       │          │                 └─────────────────────┘
       │ N:1      │ N:1
       │          │
┌──────▼──────────▼───────────┐
│      menu_tags              │
│─────────────────────────────│
│ id (PK)                     │
│ color                       │
│ name                        │
└─────────────────────────────┘
```

## 4. Primary and Foreign Keys

### Primary Keys:

- All tables have `id` as PRIMARY KEY, except junction tables which use composite keys

### Foreign Keys:

- `users.role_id` → `roles.id`
- `orders.user_id` → `users.id`
- `orders.restaurant_id` → `restaurants.id`
- `order_items.order_id` → `orders.id`
- `order_items.menu_id` → `menu.id`
- `menu_item_tags.menu_id` → `menu.id`
- `menu_item_tags.tag_id` → `menu_tags.id`
- `menu_available_days.menu_id` → `menu.id`
- `restaurant_menu.restaurant_id` → `restaurants.id`
- `restaurant_menu.menu_id` → `menu.id`

## 5. Use Cases and SQL Query Examples

### 5.1. Queries for Customers

**USE CASE 1: Get menu filtered by type**

- Description: Customer wants to see all rolls
- SQL: Filter by `menu.type = 'Rolls'` with tag grouping

**USE CASE 2: Get menu available on specific days**

- Description: Customer wants to see menu available on Monday and Wednesday
- SQL: JOIN with `menu_available_days` and filter by `day_of_week IN (1, 3)`

### 5.2. Queries for Users

**USE CASE 4: Get user order history**

- Description: User wants to see all their orders
- SQL: JOIN `orders` with `restaurants` and `order_items`, group by orders

### 5.3. Queries for Administrators

**USE CASE 9: Update order status**

- Description: Administrator updates order status to "ready"
- SQL: `UPDATE orders SET status = 'ready' WHERE id = ?`

**USE CASE 10: Add new menu item**

- Description: Administrator adds a new dish
- SQL: `INSERT INTO menu`, then `INSERT INTO menu_available_days` and `INSERT INTO restaurant_menu`

**USE CASE 13: Delete menu item**

- Description: Administrator deletes a dish (cascade deletion of relationships)
- SQL: `DELETE FROM menu WHERE id = ?` (relationships will be deleted cascadingly)

### 5.4. Data Creation and Update Operations

**USE CASE 12: Create new order**

- Description: User creates an order from cart
- SQL: `INSERT INTO orders`, then `INSERT INTO order_items` for each item

**USE CASE 16: Cancel order**

- Description: User or administrator cancels an order
- SQL: `UPDATE orders SET status = 'cancelled' WHERE id = ? AND status IN ('pending', 'confirmed')`

**USE CASE 20: Get restaurants with count of available dishes**

- Description: Display restaurant information with count of dishes in menu
- SQL: JOIN `restaurants` with `restaurant_menu` and count dishes
