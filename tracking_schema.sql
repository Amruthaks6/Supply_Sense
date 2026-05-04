-- ============================================================
--  Supply Sense – Live Tracking Migration
-- ============================================================

USE supply_sense_db;

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS currentLat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS currentLng DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS destinationLat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS destinationLng DECIMAL(11, 8);
