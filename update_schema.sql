-- ============================================================
--  Supply Sense – MERN Donation Processing Migration
-- ============================================================

USE supply_sense_db;

-- 1. Update donations table
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS totalQuantity INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS acceptedQuantity INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remainingQuantity INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS acceptedBy JSON DEFAULT NULL COMMENT 'Array of NGO names and quantities',
  ADD COLUMN IF NOT EXISTS estimatedDeliveryTime DATETIME DEFAULT NULL;

-- 2. Ensure status ENUM has all values
ALTER TABLE donations
  MODIFY COLUMN status ENUM('Pending', 'Accepted', 'Under Process', 'In Transit', 'Delivered', 'Cancelled') DEFAULT 'Pending';

-- 3. Create acceptances table for multi-NGO tracking
CREATE TABLE IF NOT EXISTS donation_acceptances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donationId INT NOT NULL,
    ngoName VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    status ENUM('Accepted', 'Under Process', 'In Transit', 'Delivered') DEFAULT 'Accepted',
    acceptedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donationId) REFERENCES donations(id) ON DELETE CASCADE
);
