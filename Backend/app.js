require('dotenv').config();

const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const cors = require('cors');
const bodyParser = require('body-parser');

const { sign_in, login, logout, fetch_user, delete_user } = require('./src/auth.js');
const { fetch_emails, send_email } = require('./src/email.js');
const { pool } = require('./src/db');

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(bodyParser.json());

app.use(session({
    store: new pgSession({ pool: pool }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.post('/api/auth/sign_in', sign_in);
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);
app.get('/api/auth/fetch_user', fetch_user);
app.delete('/api/auth/delete_user', delete_user);
app.post('/api/email/send_email', send_email);
app.post('/api/email/fetch_emails', fetch_emails);

app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ success: true, time: result.rows[0] });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({
            success: false,
            error: 'Database connection failed'
        });
    }
});

const port = 8080;

app.listen(port, () => console.log(`A listening on port ${port}!`));