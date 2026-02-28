const express = require('express');
const router = express.Router();
const db = require('../database');

/**
 * POST /api/contact
 * Saves a contact form submission to the database.
 */
router.post('/', (req, res) => {
    const { name, email, company, budget, goal } = req.body;

    // Basic validation
    if (!name || !email || !company) {
        return res.status(400).json({
            success: false,
            message: 'Name, email, and company are required.',
        });
    }

    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address.',
        });
    }

    try {
        const ip =
            req.headers['x-forwarded-for']?.split(',')[0].trim() ||
            req.socket?.remoteAddress ||
            'unknown';

        const stmt = db.prepare(`
      INSERT INTO submissions (name, email, company, budget, goal, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

        const result = stmt.run(
            name.trim(),
            email.trim().toLowerCase(),
            company.trim(),
            budget || null,
            goal?.trim() || null,
            ip
        );

        console.log(`📩 New submission #${result.lastInsertRowid} from ${email}`);

        return res.status(201).json({
            success: true,
            message: "You're on the calendar! We'll be in touch within 24 hours.",
            id: result.lastInsertRowid,
        });
    } catch (err) {
        console.error('❌ DB insert error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.',
        });
    }
});

module.exports = router;
