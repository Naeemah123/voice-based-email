require('dotenv').config();
const express = require('express')
var session = require('express-session');
const pgSession = require("connect-pg-simple")(session);
const cors = require('cors');
var bodyParser = require('body-parser');
const {sign_in, login, logout, fetch_user, delete_user} = require("./src/auth.js")
const {fetch_emails, send_email} = require("./src/email.js")
const { pool } = require("./src/db");

const app = express()

app.use(cors({
    origin: "http://localhost:3000",  // ✅ Allow frontend requests
    credentials: true  // ✅ Allow cookies & session sharing
}));
//Middleware for parsing incoming requests
app.use(bodyParser.json()); 
//Middleware for inserting session to incoming  requests
app.use(session({
    store: new pgSession({ pool:pool }),  // ✅ Store sessions in database
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // ✅ 1 day session lifespan
    }
}));

app.post('/api/auth/sign_in', sign_in);             //accepts(JSON)  username, password, address 
app.post('/api/auth/login', login);                 //accepts(JSON)  password, address 
app.get('/api/auth/logout', logout);                // null get request
app.get('/api/auth/fetch_user', fetch_user);        //null
app.get('/api/auth/delete_user', delete_user);      //null
app.post('/api/email/send_email', send_email);      //accepts(JSON) subject, to, content
app.post('/api/email/fetch_emails', fetch_emails);  //null
//port number is to be changed according to deployed platform
app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ success: true, time: result.rows[0] });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ success: false, error: 'Database connection failed' });
    }
});
const port = 8080
//Start listening requests
app.listen(port, () => console.log(`A listening on port ${port}!`))