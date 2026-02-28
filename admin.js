const express = require('express');
const router = express.Router();
const db = require('../database');

// Middleware: check admin secret
const checkAuth = (req, res, next) => {
    const secret = req.headers['authorization'] || req.query.secret;
    if (!secret || secret !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    next();
};

/**
 * GET /api/admin/submissions
 * Returns all contact form submissions.
 */
router.get('/submissions', checkAuth, (req, res) => {
    try {
        const { budget, search, limit = 100, offset = 0 } = req.query;

        let query = 'SELECT * FROM submissions';
        const params = [];
        const conditions = [];

        if (budget) {
            conditions.push('budget = ?');
            params.push(budget);
        }

        if (search) {
            conditions.push('(name LIKE ? OR email LIKE ? OR company LIKE ?)');
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        if (conditions.length) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), Number(offset));

        const rows = db.prepare(query).all(...params);
        const total = db.prepare('SELECT COUNT(*) as count FROM submissions').get().count;

        return res.json({ success: true, total, data: rows });
    } catch (err) {
        console.error('❌ Admin query error:', err.message);
        return res.status(500).json({ success: false, message: 'Database error' });
    }
});

/**
 * DELETE /api/admin/submissions/:id
 * Deletes a single submission by ID.
 */
router.delete('/submissions/:id', checkAuth, (req, res) => {
    try {
        const { id } = req.params;
        const result = db.prepare('DELETE FROM submissions WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        return res.json({ success: true, message: `Submission #${id} deleted.` });
    } catch (err) {
        console.error('❌ Delete error:', err.message);
        return res.status(500).json({ success: false, message: 'Database error' });
    }
});

/**
 * GET /api/admin/stats
 * Returns summary statistics.
 */
router.get('/stats', checkAuth, (req, res) => {
    try {
        const total = db.prepare('SELECT COUNT(*) as count FROM submissions').get().count;
        const today = db.prepare(
            "SELECT COUNT(*) as count FROM submissions WHERE date(created_at) = date('now')"
        ).get().count;
        const thisWeek = db.prepare(
            "SELECT COUNT(*) as count FROM submissions WHERE created_at >= datetime('now', '-7 days')"
        ).get().count;
        const byBudget = db.prepare(
            "SELECT budget, COUNT(*) as count FROM submissions GROUP BY budget ORDER BY count DESC"
        ).all();

        return res.json({ success: true, stats: { total, today, thisWeek, byBudget } });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
    }
});

module.exports = router;
