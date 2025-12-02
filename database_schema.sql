-- ============================================
-- Database for Sakura Sushi Restaurant
-- ============================================

-- Create database
DROP DATABASE IF EXISTS sakura_sushi;
CREATE DATABASE sakura_sushi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sakura_sushi;

-- ============================================
-- CREATE TABLES
-- ============================================

-- User roles table
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL COMMENT 'Hashed password (bcrypt)',
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_email (email),
    INDEX idx_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Restaurants table
CREATE TABLE restaurants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    working_hours VARCHAR(50) NOT NULL COMMENT 'Format: "10:00 - 22:00"',
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menu items table
CREATE TABLE menu (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(50) NOT NULL COMMENT 'Dish type: Rolls, Sushi, Hot Dishes, etc.',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menu tags table
CREATE TABLE menu_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    color VARCHAR(7) NOT NULL COMMENT 'HEX color in format #aaaaaa',
    name VARCHAR(100) NOT NULL,
    UNIQUE KEY unique_tag (color, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menu items to tags relationship (N:M)
CREATE TABLE menu_item_tags (
    menu_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (menu_id, tag_id),
    FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES menu_tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menu items available days (N:M)
CREATE TABLE menu_available_days (
    menu_id INT NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday',
    PRIMARY KEY (menu_id, day_of_week),
    FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Restaurants to menu relationship (N:M)
CREATE TABLE restaurant_menu (
    restaurant_id INT NOT NULL,
    menu_id INT NOT NULL,
    PRIMARY KEY (restaurant_id, menu_id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders table
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')
        DEFAULT 'pending' NOT NULL,
    delivery_date DATE NULL,
    delivery_time TIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE RESTRICT,
    INDEX idx_user (user_id),
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order items table
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    menu_id INT NOT NULL,
    quantity INT NOT NULL COMMENT 'Quantity (must be > 0)',
    price DECIMAL(10, 2) NOT NULL COMMENT 'Price at the time of order',
    subtotal DECIMAL(10, 2) NOT NULL COMMENT 'quantity * price',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE RESTRICT,
    INDEX idx_order (order_id),
    INDEX idx_menu (menu_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT TEST DATA
-- ============================================

-- Set maximum length for GROUP_CONCAT
SET SESSION group_concat_max_len = 10000;

-- Insert roles
INSERT INTO roles (name, description) VALUES
('admin', 'System administrator with full access'),
('user', 'Regular user');

-- Insert users
INSERT INTO users (email, password, role_id) VALUES
('admin@gmail.com', '$2b$10$PRfiQ/2nrg6kfw4M4RSSaeTOMhvySCxoVh6eO3Y1gkjtAM2q8IETG', 1),
('user1@example.com', '$2b$10$rOzJ8qKZqKZqKZqKZqKZqOqKZqKZqKZqKZqKZqKZqKZqKZqKZqK', 2),
('user2@example.com', '$2b$10$rOzJ8qKZqKZqKZqKZqKZqOqKZqKZqKZqKZqKZqKZqKZqKZqKZqK', 2);

-- Insert restaurants
INSERT INTO restaurants (name, address, working_hours, latitude, longitude) VALUES
('Sakura Sushi - Helsinki', 'Mannerheimintie 1, 00100 Helsinki', '10:00 - 22:00', 60.1699, 24.9384),
('Sakura Sushi - Espoo', 'Karaportti 2, 02610 Espoo', '10:00 - 22:00', 60.1841, 24.9288),
('Sakura Sushi - Vantaa', 'Tikkurilantie 1, 01300 Vantaa', '10:00 - 22:00', 60.1834, 24.9572);

-- Insert menu items
INSERT INTO menu (type, title, description, price) VALUES
('Rolls', 'Sakura Roll', 'Salmon, avocado, cucumber with pink tobiko caviar', 12.00),
('Sushi', 'Salmon Sushi', 'Fresh Norwegian salmon on rice', 13.00),
('Rolls', 'Tofu Roll', 'Teriyaki tofu, cucumber, iceberg lettuce', 14.00),
('Hot Dishes', 'Miso Soup', 'Traditional Japanese soup with tofu and seaweed', 15.00),
('Rolls', 'Dragon Roll', 'Eel, cucumber, avocado with eel sauce', 18.00),
('Sushi', 'Tuna Sashimi', 'Fresh bluefin tuna sashimi', 22.00),
('Hot Dishes', 'Chicken Teriyaki', 'Grilled chicken with teriyaki sauce and rice', 16.00),
('Rolls', 'Spicy Tuna Roll', 'Spicy tuna, cucumber, spicy mayo', 14.00),
('Sushi', 'Unagi Nigiri', 'Grilled eel on rice', 19.00),
('Hot Dishes', 'Beef Ramen', 'Rich beef broth with noodles and vegetables', 17.00);

-- Insert tags
INSERT INTO menu_tags (color, name) VALUES
('#4caf50', 'Vegan'),
('#2196f3', 'Gluten-free'),
('#f44336', 'Spicy');

-- Link menu items to tags
INSERT INTO menu_item_tags (menu_id, tag_id) VALUES
(3, 1),  -- Tofu Roll - Vegan
(4, 1),  -- Miso Soup - Vegan
(4, 2),  -- Miso Soup - Gluten-free
(8, 3);  -- Spicy Tuna Roll - Spicy

-- Menu items available days
INSERT INTO menu_available_days (menu_id, day_of_week) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7),
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7),
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (3, 7),
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6), (4, 7),
(5, 1), (5, 3), (5, 5), (5, 7),
(6, 2), (6, 4), (6, 6),
(7, 1), (7, 2), (7, 3), (7, 4), (7, 5),
(8, 6), (8, 7),
(9, 1), (9, 3), (9, 5),
(10, 2), (10, 4), (10, 6), (10, 7);

-- Link restaurants to menu (all restaurants have all dishes)
INSERT INTO restaurant_menu (restaurant_id, menu_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10),
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8), (2, 9), (2, 10),
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (3, 7), (3, 8), (3, 9), (3, 10);

-- Insert test orders
INSERT INTO orders (user_id, restaurant_id, total_price, status, delivery_date, delivery_time) VALUES
(2, 1, 25.00, 'confirmed', '2025-11-22', '12:00:00'),
(2, 1, 58.00, 'delivered', '2025-11-22', '12:00:00'),
(3, 2, 29.00, 'preparing', '2025-11-22', '12:00:00');

-- Insert order items
INSERT INTO order_items (order_id, menu_id, quantity, price, subtotal) VALUES
-- Order 1: Sakura Roll (1x12) + Salmon Sushi (1x13) = 25
(1, 1, 1, 12.00, 12.00),
(1, 2, 1, 13.00, 13.00),
-- Order 2: Dragon Roll (2x18) + Tuna Sashimi (1x22) = 58
(2, 5, 2, 18.00, 36.00),
(2, 6, 1, 12.00, 12.00),
-- Order 3: Tofu Roll (1x14) + Miso Soup (1x15) = 29
(3, 3, 1, 14.00, 14.00),
(3, 4, 1, 15.00, 15.00);

-- ============================================
-- QUERY EXAMPLES (USE CASES)
-- ============================================

-- ============================================
-- USE CASE 1: Get menu filtered by type
-- ============================================
SELECT
    m.id,
    m.type,
    m.title,
    m.description,
    m.price,
    GROUP_CONCAT(CONCAT(mt.color, ':', mt.name) SEPARATOR ', ') AS tags
FROM menu m
LEFT JOIN menu_item_tags mit ON m.id = mit.menu_id
LEFT JOIN menu_tags mt ON mit.tag_id = mt.id
WHERE m.type = 'Rolls'
GROUP BY m.id, m.type, m.title, m.description, m.price
ORDER BY m.price;

-- ============================================
-- USE CASE 2: Get menu available on specific days of the week
-- ============================================
SELECT DISTINCT
    m.id,
    m.type,
    m.title,
    m.description,
    m.price,
    GROUP_CONCAT(DISTINCT mad.day_of_week ORDER BY mad.day_of_week SEPARATOR ', ') AS available_days
FROM menu m
INNER JOIN menu_available_days mad ON m.id = mad.menu_id
WHERE mad.day_of_week IN (1, 3)
GROUP BY m.id, m.type, m.title, m.description, m.price
ORDER BY m.type, m.price;

-- ============================================
-- USE CASE 4: Get user order history
-- ============================================
SELECT
    o.id AS order_id,
    o.total_price,
    o.status,
    o.created_at,
    r.name AS restaurant_name,
    r.address AS restaurant_address,
    COUNT(oi.id) AS items_count
FROM orders o
INNER JOIN restaurants r ON o.restaurant_id = r.id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.user_id = 2
GROUP BY o.id, o.total_price, o.status, o.created_at, r.name, r.address
ORDER BY o.created_at DESC;

-- ============================================
-- USE CASE 9: Update order status
-- Description: Administrator updates order status to "ready"
-- ============================================
UPDATE orders
SET status = 'ready', updated_at = CURRENT_TIMESTAMP
WHERE id = 3;

-- ============================================
-- USE CASE 10: Add new menu item
-- Description: Administrator adds a new dish
-- ============================================
INSERT INTO menu (type, title, description, price) VALUES
('Sushi', 'Ebi Nigiri', 'Cooked shrimp on rice', 16.00);

-- ============================================
-- USE CASE 12: Create new order
-- Description: User creates an order from cart
-- ============================================
-- Create order
INSERT INTO orders (user_id, restaurant_id, total_price, status) VALUES
(2, 1, 45.00, 'pending');


-- ============================================
-- USE CASE 13: Delete menu item
-- Description: Administrator deletes a dish (cascade deletion of relationships)
-- ============================================
SELECT
    m.id,
    m.title,
    COUNT(DISTINCT oi.order_id) AS orders_count
FROM menu m
LEFT JOIN order_items oi ON m.id = oi.menu_id
WHERE m.id = 10
GROUP BY m.id, m.title;

-- ============================================
-- USE CASE 16: Cancel order
-- Description: User or administrator cancels an order
-- ============================================
UPDATE orders
SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
WHERE id = 1 AND status IN ('pending', 'confirmed');

-- ============================================
-- USE CASE 20: Get restaurants with count of available dishes
-- ============================================
SELECT
    r.id,
    r.name,
    r.address,
    r.working_hours,
    COUNT(DISTINCT rm.menu_id) AS menu_items_count,
    COUNT(DISTINCT o.id) AS total_orders
FROM restaurants r
LEFT JOIN restaurant_menu rm ON r.id = rm.restaurant_id
LEFT JOIN orders o ON r.id = o.restaurant_id
GROUP BY r.id, r.name, r.address, r.working_hours
ORDER BY r.name;

