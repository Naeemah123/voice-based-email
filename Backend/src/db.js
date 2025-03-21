/*const {Pool} = require('pg')

//Configurations for the database connection
//There should be changed according the deployed platform
exports.pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mail_system',
    password: '58132134',
    port: 5432,
})*/
require('dotenv').config();
const { Pool } = require('pg');

exports.pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});
