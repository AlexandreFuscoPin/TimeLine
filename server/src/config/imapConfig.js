const dotenv = require('dotenv');

dotenv.config();

const imapConfig = {
    imap: {
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASSWORD,
        host: process.env.IMAP_HOST,
        port: parseInt(process.env.IMAP_PORT, 10) || 993,
        tls: process.env.IMAP_TLS === 'true',
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 15000,
        connTimeout: 20000
    }
};

module.exports = imapConfig;
