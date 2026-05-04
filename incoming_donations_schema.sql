-- ============================================================
--  Supply Sense – Incoming Donations Enhancements
-- ============================================================

USE supply_sense_db;

-- 1. Create rejections table to hide rejected donations from specific NGOs
CREATE TABLE IF NOT EXISTS donation_rejections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donationId INT NOT NULL,
    ngoName VARCHAR(255) NOT NULL,
    rejectedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donationId) REFERENCES donations(id) ON DELETE CASCADE
);

-- 2. Add individual status tracking for NGOs in donation_acceptances
-- (Ensures each NGO has their own workflow status)
ALTER TABLE donation_acceptances
  MODIFY COLUMN status ENUM('Accepted', 'Under Process', 'In Transit', 'Delivered') DEFAULT 'Under Process';
