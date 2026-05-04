-- ============================================================
--  Supply Sense – Authentication & Security Migration
-- ============================================================

USE supply_sense_db;

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Donor', 'NGO') NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add userId to donations for ownership tracking
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS userId INT,
  ADD FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL;

-- 3. Add ngoId to donation_acceptances
ALTER TABLE donation_acceptances
  ADD COLUMN IF NOT EXISTS ngoId INT,
  ADD FOREIGN KEY (ngoId) REFERENCES users(id) ON DELETE SET NULL;
