-- ============================================================
--  SUPPLY SENSE - MASTER DATABASE SETUP
-- ============================================================



-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Donor', 'NGO') NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Donations Table
CREATE TABLE IF NOT EXISTS donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    foodName VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    availableServings INT,
    totalQuantity INT,
    remainingQuantity INT,
    acceptedQuantity INT DEFAULT 0,
    quantityUnit VARCHAR(50),
    quantity VARCHAR(100),
    expiryDate VARCHAR(100),
    imageUrl TEXT,
    proofPhotoUrl TEXT,
    pickupLocation TEXT,
    donorName VARCHAR(255),
    isAnonymous TINYINT(1) DEFAULT 0,
    status ENUM('Pending', 'Accepted', 'Under Process', 'In Transit', 'Delivered') DEFAULT 'Pending',
    acceptedBy JSON,
    userId INT,
    estimatedDeliveryTime VARCHAR(100),
    currentLat DECIMAL(10, 8),
    currentLng DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. NGO Profiles
CREATE TABLE IF NOT EXISTS ngo_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ngoId VARCHAR(255) UNIQUE,
    ngoName VARCHAR(255),
    location TEXT,
    peoplePresent INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Donation Acceptances (Individual Tracking)
CREATE TABLE IF NOT EXISTS donation_acceptances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donationId INT NOT NULL,
    ngoId INT,
    ngoName VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    status ENUM('Accepted', 'Under Process', 'In Transit', 'Delivered') DEFAULT 'Under Process',
    acceptedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donationId) REFERENCES donations(id) ON DELETE CASCADE,
    FOREIGN KEY (ngoId) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Donation Rejections (Hiding for specific NGOs)
CREATE TABLE IF NOT EXISTS donation_rejections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donationId INT NOT NULL,
    ngoName VARCHAR(255) NOT NULL,
    rejectedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donationId) REFERENCES donations(id) ON DELETE CASCADE
);

-- 6. Chat Messages
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
