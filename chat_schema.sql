-- ============================================================
--  Supply Sense – Real-time Chat Migration
-- ============================================================

USE supply_sense_db;

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donationId INT NOT NULL,
    senderName VARCHAR(255) NOT NULL,
    receiverName VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    isRead TINYINT(1) DEFAULT 0,
    FOREIGN KEY (donationId) REFERENCES donations(id) ON DELETE CASCADE
);
