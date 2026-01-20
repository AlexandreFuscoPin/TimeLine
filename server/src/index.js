const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const authRoutes = require('./routes/authRoutes');
const verifyToken = require('./middleware/authMiddleware');
const emailService = require('./services/emailService');
const accountRoutes = require('./routes/accountRoutes');
const userRoutes = require('./routes/userRoutes');

app.use(cors());
app.use(express.json());
// Serve static files from the public directory (which will contain the client build)
app.use(express.static(path.join(__dirname, '../public')));

// Public Routes
app.use('/api/auth', authRoutes);

// Protected Routes
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/accounts', verifyToken, accountRoutes);

app.get('/api/emails', verifyToken, async (req, res) => {
    try {
        const groups = await emailService.fetchEmails();
        res.json(groups);
    } catch (err) {
        console.error('Error fetching emails:', err);
        res.status(500).json({ error: 'Failed to fetch emails' });
    }
});

app.post('/api/groups/:tag/unfollow', verifyToken, async (req, res) => {
    try {
        const { tag } = req.params;
        const { deleteData } = req.body;

        await emailService.unfollowGroup(tag, deleteData);
        res.json({ success: true, message: `Unfollowed ${tag}` });
    } catch (error) {
        console.error('Error unfollowing group:', error);
        res.status(500).json({ error: 'Failed to unfollow group' });
    }
});

// Get company map
app.get('/api/companies', verifyToken, async (req, res) => {
    try {
        const map = await emailService.getCompanyMap();
        res.json(map);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update company domain
app.post('/api/companies', verifyToken, async (req, res) => {
    const { domain, name, ignored, responsible } = req.body;
    try {
        const map = await emailService.updateCompanyDomain(domain, name, ignored, responsible);
        res.json(map);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Group Configs
app.get('/api/group-configs', verifyToken, async (req, res) => {
    try {
        const configs = await emailService.getGroupConfig();
        res.json(configs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch group configs' });
    }
});

// Update Group Config
app.post('/api/groups/:tag/config', verifyToken, async (req, res) => {
    const { tag } = req.params;
    const config = req.body;
    try {
        const updated = await emailService.updateGroupConfig(tag, config);
        res.json(updated);
    } catch (err) {
        console.error("Failed to update group config", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Generate Group Summary (AI)
app.post('/api/groups/:tag/summary', verifyToken, async (req, res) => {
    const { tag } = req.params;
    try {
        const summary = await emailService.generateGroupSummary(tag);
        res.json({ summary });
    } catch (err) {
        console.error("Summary generation error:", err);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
});

// All other GET requests not handled before will return the React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
