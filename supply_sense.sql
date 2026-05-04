CREATE DATABASE IF NOT EXISTS supply_sense_db;
USE supply_sense_db;

CREATE TABLE IF NOT EXISTS donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    foodName VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity VARCHAR(255),
    expiryDate VARCHAR(100),
    imageUrl TEXT,
    proofPhotoUrl TEXT,
    pickupLocation VARCHAR(255),
    donorName VARCHAR(255),
    isAnonymous BOOLEAN DEFAULT FALSE,
    status ENUM('Pending', 'Accepted', 'Under Process', 'Delivered') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO donations (foodName, category, quantity, expiryDate, imageUrl, pickupLocation, donorName, isAnonymous, status) VALUES
('Fresh Organic Vegetables', 'Veg', '15 lbs (approx. 10 meals)', 'Today, 8:00 PM', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600', 'Downtown Farmer''s Market, 120 Main St', 'Green Acres Farm', FALSE, 'Pending'),
('Assorted Bakery Bread & Pastries', 'Packaged', '2 Large Boxes', 'Tomorrow, 10:00 AM', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600', 'Sunny Side Bakery, 45 West Ave', 'Sunny Side Bakery', FALSE, 'Pending'),
('Grilled Chicken & Rice Bowls', 'Non-Veg', '25 Servings', 'Today, 11:30 PM', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=600', 'Corporate Event Center, Block C', '', TRUE, 'Pending'),
('Fresh Pressed Orange & Apple Juice', 'Juice', '10 Liters', 'In 2 Days', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=600', 'Juice Bar, Central Mall Level 1', 'Citrus Fresh', FALSE, 'Pending'),
('Wedding Event Leftovers (Mixed Buffet)', 'Non-Veg', 'Approx. 50 Meals', 'Tomorrow, 2:00 AM', 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=600', 'Grand Palace Hotel, North Gate', '', TRUE, 'Pending'),
('Gourmet Chocolate Cakes & Tarts', 'Dessert', '12 Whole Cakes', 'In 3 Days', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=600', 'Sweet Tooth Cafe, 88 Pearl St', 'Sweet Tooth Cafe', FALSE, 'Pending');
