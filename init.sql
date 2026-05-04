CREATE DATABASE IF NOT EXISTS lumina_db;
USE lumina_db;

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity INT DEFAULT 0,
    price DECIMAL(10, 2) DEFAULT 0.00,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (name, category, quantity, price, image_url) VALUES
('Quantum Lens', 'Optics', 15, 299.99, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400'),
('Nebula Controller', 'Electronics', 8, 149.50, 'https://images.unsplash.com/photo-1600003014755-931ff9f063cd?auto=format&fit=crop&q=80&w=400'),
('Aether SSD', 'Storage', 24, 89.99, 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&q=80&w=400');
