-- ============================================================
--  Supply Sense – NGO Management Migration
-- ============================================================

USE supply_sense_db;

-- 1. Create NGO Profiles table
CREATE TABLE IF NOT EXISTS ngo_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ngoId INT UNIQUE NOT NULL COMMENT 'Maps to user id or auth id',
    ngoName VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    peoplePresent INT DEFAULT 0,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Ensure donation_acceptances has enough fields
ALTER TABLE donation_acceptances
  ADD COLUMN IF NOT EXISTS peopleBenefited INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT;
