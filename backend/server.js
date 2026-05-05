const express = require('express');
const cors = require('cors');
const pool = require('./db');
const multer = require('multer');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supply_sense_super_secret_key_123';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── EMAIL CONFIG ──────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'supplysense.alerts@gmail.com',
        pass: process.env.EMAIL_PASS || 'your_app_password'
    }
});

const sendNotification = async (userId, message, type = 'Info', email = null) => {
    try {
        await pool.query("INSERT INTO notifications (userId, message, type) VALUES (?, ?, ?)", [userId, message, type]);
        
        if (email) {
            const mailOptions = {
                from: process.env.EMAIL_USER || 'supplysense.alerts@gmail.com',
                to: email,
                subject: `Supply Sense: ${type} Notification`,
                text: message
            };
            transporter.sendMail(mailOptions).catch(err => console.error('Email failed:', err));
        }
        
        io.to(`user_${userId}`).emit('notification', { message, type });
    } catch (err) {
        console.error('Notification error:', err);
    }
};

// ── MIDDLEWARE ────────────────────────────────────────────────────────

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

const authorizeRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ error: `Requires ${role} role.` });
        }
        next();
    };
};

// ── AUTH ENDPOINTS ────────────────────────────────────────────────────

// Register
app.post('/api/auth/register', async (req, res) => {
    console.log('Register request body:', req.body);
    const { name, email, password, role, phone, city, location, peoplePresent } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            "INSERT INTO users (name, email, password, role, phone, city) VALUES (?, ?, ?, ?, ?, ?)",
            [name, email, hashedPassword, role, phone, city]
        );
        const userId = result.insertId;

        if (role === 'NGO') {
            await pool.query(
                "INSERT INTO ngo_profiles (ngoId, ngoName, location, peoplePresent, city) VALUES (?, ?, ?, ?, ?)",
                [userId, name, location || city, peoplePresent || 0, city]
            );
        }

        res.json({ message: 'User registered successfully', userId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        if (rows.length === 0) return res.status(400).json({ error: 'Invalid email or password' });

        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid email or password' });

        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.role, phone: user.phone, isAnonymous: false },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, name: user.name, role: user.role, phone: user.phone, city: user.city } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Anonymous Login
app.post('/api/auth/anonymous', async (req, res) => {
    const anonId = 'anon_' + Math.random().toString(36).substr(2, 9);
    const token = jwt.sign(
        { id: null, name: 'Anonymous Donor', role: 'Donor', isAnonymous: true, anonId },
        JWT_SECRET,
        { expiresIn: '2h' }
    );
    res.json({ token, user: { name: 'Anonymous Donor', role: 'Donor', isAnonymous: true } });
});

// Google Auth
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        let [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        let user;

        if (rows.length === 0) {
            // Auto-register as Donor for now
            const [result] = await pool.query(
                "INSERT INTO users (name, email, password, role) VALUES (?, ?, 'GOOGLE_AUTH', 'Donor')",
                [name, email]
            );
            const [newUser] = await pool.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
            user = newUser[0];
        } else {
            user = rows[0];
        }

        const jwtToken = jwt.sign(
            { id: user.id, name: user.name, role: user.role, phone: user.phone, isAnonymous: false },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token: jwtToken, user: { id: user.id, name: user.name, role: user.role, phone: user.phone, city: user.city } });
    } catch (err) {
        console.error("Google verify error:", err);
        res.status(401).json({ error: 'Google authentication failed' });
    }
});

// ── USER PROFILE ENDPOINTS ────────────────────────────────────────────

app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, name, email, role, phone, city FROM users WHERE id = ?", [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/user/profile', authenticateToken, async (req, res) => {
    const { name, phone, city } = req.body;
    try {
        await pool.query("UPDATE users SET name = ?, phone = ?, city = ? WHERE id = ?", [name, phone, city, req.user.id]);
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PROTECTED DONATION ENDPOINTS ──────────────────────────────────────

app.get('/api/donations', authenticateToken, async (req, res) => {
    try {
        // Only show non-expired donations
        const [rows] = await pool.query("SELECT * FROM donations WHERE status IN ('Pending', 'Accepted') AND remainingQuantity > 0 AND (expiryDate > NOW() OR expiryDate IS NULL OR expiryDate = '') ORDER BY created_at DESC");
        res.json(rows.map(r => ({ ...r, isAnonymous: Boolean(r.isAnonymous) })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/ngo/donations', authenticateToken, async (req, res) => {
    const { ngoName, city, sameCity } = req.query;
    try {
        let query = `
            SELECT d.* FROM donations d 
            WHERE d.status IN ('Pending', 'Accepted') 
            AND d.remainingQuantity > 0 
            AND (d.status != 'Cancelled')
            AND d.id NOT IN (SELECT donationId FROM donation_rejections WHERE ngoName = ?)`;
        let params = [ngoName];

        if (sameCity && city) {
            query += " AND d.city = ?";
            params.push(city);
        }

        query += " ORDER BY d.created_at DESC";
        
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/donations/:id', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM donations WHERE id = ?", [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Donation not found' });
        await pool.query("DELETE FROM donations WHERE id = ?", [req.params.id]);
        res.json({ message: 'Donation deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/ngo-donations/:ngoName', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT da.*, d.foodName, d.donorName, d.quantityUnit 
            FROM donation_acceptances da
            JOIN donations d ON da.donationId = d.id
            WHERE da.ngoName = ? ORDER BY da.acceptedAt DESC`, [req.params.ngoName]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/donations/:id/reject', authenticateToken, async (req, res) => {
    const { ngoName } = req.body;
    try {
        await pool.query("INSERT INTO donation_rejections (donationId, ngoName) VALUES (?, ?)", [req.params.id, ngoName]);
        res.json({ message: 'Rejected' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/donation-acceptances/:id', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM donation_acceptances WHERE id = ?", [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
        
        const da = rows[0];
        await pool.query("UPDATE donations SET remainingQuantity = remainingQuantity + ? WHERE id = ?", [da.quantity, da.donationId]);
        await pool.query("DELETE FROM donation_acceptances WHERE id = ?", [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/ngo-profile/:ngoId', authenticateToken, async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM ngo_profiles WHERE ngoId = ?", [req.params.ngoId]);
    res.json(rows[0] || {});
});

app.post('/api/ngo-profile', authenticateToken, async (req, res) => {
    const { ngoId, ngoName, location, peoplePresent, city } = req.body;
    await pool.query("INSERT INTO ngo_profiles (ngoId, ngoName, location, peoplePresent, city) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE ngoName=?, location=?, peoplePresent=?, city=?",
        [ngoId, ngoName, location, peoplePresent, city, ngoName, location, peoplePresent, city]);
    res.json({ message: 'Updated' });
});

app.get('/api/my-donations', authenticateToken, async (req, res) => {
    try {
        let query = "SELECT * FROM donations WHERE userId = ?";
        let params = [req.user.id];

        if (req.user.isAnonymous) {
            query = "SELECT * FROM donations WHERE isAnonymous = 1 ORDER BY created_at DESC";
            params = [];
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/donations', authenticateToken, authorizeRole('Donor'), multer({ storage: multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
})}).fields([{ name: 'image' }, { name: 'proofPhoto' }]), async (req, res) => {
    const { foodName, category, availableServings, quantityUnit, expiryDate, pickupLocation, isAnonymous, lat, lng, city, phone } = req.body;
    const donorName = req.user.isAnonymous ? 'Anonymous Donor' : req.user.name;
    const donorPhone = phone || (req.user.isAnonymous ? null : req.user.phone);
    const userId = req.user.id;

    const BASE_URL = process.env.BASE_URL || 'https://supply-sense-backend.onrender.com';
    let imageUrl = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=600';
    let proofPhotoUrl = null;
    if (req.files?.image) imageUrl = `${BASE_URL}/uploads/${req.files.image[0].filename}`;
    if (req.files?.proofPhoto) proofPhotoUrl = `${BASE_URL}/uploads/${req.files.proofPhoto[0].filename}`;

    try {
        const [result] = await pool.query(`INSERT INTO donations (foodName, category, availableServings, totalQuantity, remainingQuantity, quantityUnit, expiryDate, imageUrl, proofPhotoUrl, pickupLocation, currentLat, currentLng, donorName, donorPhone, isAnonymous, status, acceptedBy, userId, city) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', '[]', ?, ?)`,
            [foodName, category, availableServings, availableServings, availableServings, quantityUnit, expiryDate, imageUrl, proofPhotoUrl, pickupLocation, lat || null, lng || null, donorName, donorPhone, (isAnonymous === 'true' || req.user.isAnonymous) ? 1 : 0, userId, city]);
        
        const newDonation = { id: result.insertId, foodName, category, remainingQuantity: availableServings, donorName, status: 'Pending', city };
        io.emit('new-donation', newDonation);
        
        res.json({ message: 'Created' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/donations/:id/accept', authenticateToken, authorizeRole('NGO'), async (req, res) => {
    const { requestedServings } = req.body;
    const ngoName = req.user.name;
    const ngoPhone = req.user.phone;
    const ngoId = req.user.id;
    const donationId = req.params.id;

    try {
        const [rows] = await pool.query("SELECT * FROM donations WHERE id = ?", [donationId]);
        const donation = rows[0];
        const currentRemaining = (donation.remainingQuantity !== undefined && donation.remainingQuantity !== null) 
            ? donation.remainingQuantity 
            : donation.availableServings;
        
        if (requestedServings > currentRemaining) return res.status(400).json({ error: 'Insufficient quantity available' });

        const newRemaining = currentRemaining - requestedServings;
        const newAccepted  = (donation.acceptedQuantity || 0) + requestedServings;
        const newGlobalStatus = newRemaining === 0 ? 'Under Process' : 'Accepted';

        let acceptedBy = donation.acceptedBy;
        if (typeof acceptedBy === 'string') {
            try {
                acceptedBy = JSON.parse(acceptedBy);
            } catch (e) {
                acceptedBy = [];
            }
        } else if (!acceptedBy) {
            acceptedBy = [];
        }
        acceptedBy.push({ ngoName, ngoPhone, quantity: requestedServings, acceptedAt: new Date().toISOString(), status: 'Under Process' });

        await pool.query("UPDATE donations SET remainingQuantity=?, availableServings=?, acceptedQuantity=?, status=?, acceptedBy=? WHERE id=?",
            [newRemaining, newRemaining, newAccepted, newGlobalStatus, JSON.stringify(acceptedBy), donationId]);
        await pool.query("INSERT INTO donation_acceptances (donationId, ngoName, ngoPhone, quantity, status, ngoId) VALUES (?, ?, ?, ?, 'Under Process', ?)",
            [donationId, ngoName, ngoPhone, requestedServings, ngoId]);

        // Broadcast the update to all clients
        io.emit('donation-updated', { 
            id: donationId, 
            remainingQuantity: newRemaining, 
            status: newGlobalStatus,
            acceptedBy 
        });

        // Notify Donor
        if (donation.userId) {
            const [donorRows] = await pool.query("SELECT email FROM users WHERE id = ?", [donation.userId]);
            const donorEmail = donorRows[0]?.email;
            await sendNotification(donation.userId, `Your donation "${donation.foodName}" has been accepted by ${ngoName}.`, 'Success', donorEmail);
        }

        // Notify the NGO themselves (Confirmation)
        const [ngoRows] = await pool.query("SELECT email FROM users WHERE id = ?", [ngoId]);
        if (ngoRows.length > 0) {
            await sendNotification(ngoId, `You have successfully accepted ${requestedServings} ${donation.quantityUnit} of "${donation.foodName}".`, 'Success', ngoRows[0].email);
        }

        res.json({ 
            message: 'Accepted',
            remainingQuantity: newRemaining,
            acceptedQuantity: newAccepted,
            status: newGlobalStatus,
            acceptedBy: acceptedBy
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// (Remaining endpoints updated to use authenticateToken similarly...)
app.get('/api/donations/:id', authenticateToken, async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM donations WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
});

app.post('/api/donations/:id/confirm', authenticateToken, async (req, res) => {
    const { status, estimatedDeliveryTime } = req.body;
    await pool.query("UPDATE donations SET status = ?, estimatedDeliveryTime = ? WHERE id = ?", [status, estimatedDeliveryTime, req.params.id]);
    await pool.query("UPDATE donation_acceptances SET status = ? WHERE donationId = ?", [status, req.params.id]);
    
    // Notify involved parties
    try {
        const [dRows] = await pool.query("SELECT d.*, u.email as donorEmail FROM donations d JOIN users u ON d.userId = u.id WHERE d.id = ?", [req.params.id]);
        const donation = dRows[0];
        const foodName = donation?.foodName || "donation";
        
        // System message
        await pool.query("INSERT INTO messages (donationId, senderName, receiverName, message) VALUES (?, 'System', 'All', ?)", 
            [req.params.id, `Donation "${foodName}" status updated to: ${status}${estimatedDeliveryTime ? ' (ETA: ' + estimatedDeliveryTime + ')' : ''}`]);

        // Dashboard Notification & Email
        if (donation.userId) {
            await sendNotification(donation.userId, `Your donation "${foodName}" is now ${status}.`, 'Info', donation.donorEmail);
        }

        // Also notify NGOs who accepted it
        const [daRows] = await pool.query(`
            SELECT da.ngoId, u.email 
            FROM donation_acceptances da 
            JOIN users u ON da.ngoId = u.id 
            WHERE da.donationId = ?`, [req.params.id]);
        
        for (const da of daRows) {
            if (da.ngoId) {
                await sendNotification(da.ngoId, `Donation "${foodName}" status updated to ${status}.`, 'Info', da.email);
            }
        }
    } catch (e) { console.error("Notification trigger error:", e); }

    io.emit('donation-updated', { id: req.params.id, status, estimatedDeliveryTime });
    
    res.json({ message: 'Updated' });
});

// Forgot Password Mock
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(404).json({ error: 'User with this email not found' });
    res.json({ message: 'Password reset instructions sent to your email (simulated)' });
});

// Notifications Endpoint
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 20", [req.user.id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/notifications/mark-read', authenticateToken, async (req, res) => {
    try {
        await pool.query("UPDATE notifications SET isRead = 1 WHERE userId = ?", [req.user.id]);
        res.json({ message: 'Marked as read' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// NGOs Search (Nearby)
app.get('/api/ngos/nearby', authenticateToken, async (req, res) => {
    const { city } = req.query;
    try {
        let query = "SELECT n.*, u.phone FROM ngo_profiles n JOIN users u ON n.ngoId = u.id";
        let params = [];
        if (city) {
            query += " WHERE n.city = ?";
            params.push(city);
        }
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── CHAT & TRACKING ──────────────────────────────────────────────────

app.get('/api/messages/:donationId', authenticateToken, async (req, res) => {
    const { receiver } = req.query;
    const sender = req.user.name;
    const donationId = req.params.donationId === 'null' ? null : req.params.donationId;
    
    try {
        const query = donationId 
            ? "SELECT * FROM messages WHERE donationId = ? AND ((senderName = ? AND receiverName = ?) OR (senderName = ? AND receiverName = ?) OR (senderName = 'System' AND receiverName = 'All')) ORDER BY createdAt ASC"
            : "SELECT * FROM messages WHERE donationId IS NULL AND ((senderName = ? AND receiverName = ?) OR (senderName = ? AND receiverName = ?) OR (senderName = 'System' AND receiverName = 'All')) ORDER BY createdAt ASC";
        
        const params = donationId ? [donationId, sender, receiver, receiver, sender] : [sender, receiver, receiver, sender];
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/chats', authenticateToken, async (req, res) => {
    const userName = req.user.name;
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT 
                m.donationId, 
                m.senderName, 
                m.receiverName, 
                IFNULL(d.foodName, 'General Inquiry') as foodName, 
                IFNULL(d.donorName, m.senderName) as donorName, 
                IFNULL(d.isAnonymous, 0) as isAnonymous
            FROM messages m
            LEFT JOIN donations d ON m.donationId = d.id
            WHERE m.senderName = ? OR m.receiverName = ?
            ORDER BY m.createdAt DESC
        `, [userName, userName]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

io.on('connection', (socket) => {
    socket.on('join-chat', (room) => socket.join(room));
    socket.on('join-user-room', (room) => socket.join(room));
    socket.on('send-message', async (data) => {
        let { donationId, senderName, receiverName, message } = data;
        if (!message) return;
        
        // Handle "null" string from frontend
        if (donationId === 'null' || donationId === '') donationId = null;

        try {
            const cleanS = senderName?.trim().toLowerCase() || 'user';
            const cleanR = receiverName?.trim().toLowerCase() || 'user';
            
            // Save message
            await pool.query("INSERT INTO messages (donationId, senderName, receiverName, message) VALUES (?, ?, ?, ?)", [donationId, senderName, receiverName, message]);
            
            // Broadcast to the specific chat room for the open modal
            io.to(`chat_${donationId}_${[cleanS, cleanR].sort().join('_')}`).emit('new-message', data);
            
            // Broadcast a global update so dashboards can refresh their chat lists
            io.emit('chat-update', { donationId, senderName, receiverName });

            // SEND NOTIFICATION to the receiver (Non-blocking)
            try {
                const [userRows] = await pool.query("SELECT id, email FROM users WHERE name = ?", [receiverName]);
                if (userRows.length > 0) {
                    const receiverId = userRows[0].id;
                    const receiverEmail = userRows[0].email;
                    await sendNotification(receiverId, `New message from ${senderName}: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`, 'Message', receiverEmail);
                }
            } catch (notifErr) {
                console.error('Notification failed:', notifErr);
            }
        } catch (err) { 
            console.error('Chat error:', err); 
        }
    });

    socket.on('update-location', async (data) => {
        const { donationId, lat, lng } = data;
        await pool.query("UPDATE donations SET currentLat = ?, currentLng = ? WHERE id = ?", [lat, lng, donationId]);
        io.emit('location-updated', data);
    });
});

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
