require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static Files (serve the frontend) ─────────────────────────────────────────
app.use(express.static(path.join(__dirname), {
    // Exclude the admin folder from open static serving
    index: 'index.html',
}));

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/contact', require('./routes/contact'));
app.use('/api/admin', require('./routes/admin'));

// ─── Admin UI ──────────────────────────────────────────────────────────────────
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Fallback ──────────────────────────────────────────────────────────────
app.use((req, res) => {
    // SPA-style fallback for the main site
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log('');
    console.log('  ⚡ PromptAds Server');
    console.log(`  🌐 Website:  http://localhost:${PORT}`);
    console.log(`  🔐 Admin:    http://localhost:${PORT}/admin`);
    console.log(`  📡 API:      http://localhost:${PORT}/api`);
    console.log('');
    console.log('  Admin secret: ' + (process.env.ADMIN_SECRET || '(not set)'));
    console.log('');
});
