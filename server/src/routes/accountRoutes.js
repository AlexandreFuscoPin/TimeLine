const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const imapSimple = require('imap-simple');

const prisma = new PrismaClient();

// Get all accounts
router.get('/', async (req, res) => {
    try {
        const accounts = await prisma.emailAccount.findMany({
            orderBy: { createdAt: 'desc' }
        });
        // Mask passwords for security
        const safeAccounts = accounts.map(acc => ({
            ...acc,
            password: '***'
        }));
        res.json(safeAccounts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

// Add new account
router.post('/', async (req, res) => {
    const { user, password, host, port, tls } = req.body;

    // 1. Test Connection
    try {
        console.log(`Testing connection for ${user}...`);
        const config = {
            imap: {
                user,
                password,
                host,
                port: parseInt(port),
                tls: tls !== undefined ? tls : true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 10000,
                connTimeout: 15000
            }
        };
        const connection = await imapSimple.connect(config);
        await connection.end();
        console.log(`Connection test effective for ${user}`);
    } catch (connError) {
        console.error(`Connection failed for ${user}:`, connError);
        return res.status(400).json({
            error: `Connection Failed: ${connError.message || 'Unknown Error'}. Check credentials and host.`
        });
    }

    // 2. Save to DB
    try {
        const newAccount = await prisma.emailAccount.create({
            data: {
                user,
                password,
                host,
                port: parseInt(port),
                tls: tls !== undefined ? tls : true
            }
        });
        res.status(201).json(newAccount);
    } catch (error) {
        console.error(error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Account with this user already exists' });
        }
        res.status(500).json({ error: 'Failed to create account' });
    }
});

// Update account
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { user, password, host, port, tls } = req.body;

    // 1. Test Connection
    try {
        console.log(`Testing connection update for ${user}...`);
        const config = {
            imap: {
                user,
                password,
                host,
                port: parseInt(port),
                tls: tls !== undefined ? tls : true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 10000,
                connTimeout: 15000
            }
        };
        const connection = await imapSimple.connect(config);
        await connection.end();
    } catch (connError) {
        console.error(`Connection failed for ${user}:`, connError);
        return res.status(400).json({
            error: `Connection Failed: ${connError.message || 'Unknown Error'}. Check credentials and host.`
        });
    }

    // 2. Update DB
    try {
        const updatedAccount = await prisma.emailAccount.update({
            where: { id: parseInt(id) },
            data: {
                user,
                password,
                host,
                port: parseInt(port),
                tls: tls !== undefined ? tls : true
            }
        });
        res.json(updatedAccount);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update account' });
    }
});

// Delete account
router.delete('/:id', async (req, res) => {
    try {
        await prisma.emailAccount.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

module.exports = router;
