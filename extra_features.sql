-- ============================================================
--  Supply Sense – Extra Features (Notifications, City Filtering, Call)
-- ============================================================

USE supply_sense_db;

-- 1. Add city to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- 2. Add city and phone to ngo_profiles (if not exists)
ALTER TABLE ngo_profiles
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 3. Add city to donations
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS donorPhone VARCHAR(20);

-- 4. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    message TEXT NOT NULL,
    type ENUM('Info', 'Success', 'Warning') DEFAULT 'Info',
    isRead BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Add certificate related fields to donation_acceptances
ALTER TABLE donation_acceptances
  ADD COLUMN IF NOT EXISTS certificateId VARCHAR(100),
  ADD COLUMN IF NOT EXISTS certificateIssuedAt TIMESTAMP NULL;
