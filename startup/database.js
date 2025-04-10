const mysql = require('mysql2');
require('dotenv').config();

// Create a MySQL connection pool
const createPool = (database) => {
  return mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: database,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 6,
    queueLimit: 0,
    connectionTimeout: 60000, // Set the connection timeout (in milliseconds)

    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
};


const plantcare = createPool(process.env.DB_NAME_PC);
const collectionofficer = createPool(process.env.DB_NAME_CO);
const marketPlace = createPool(process.env.DB_NAME_MP);
const dash = createPool(process.env.DB_NAME_DS);
const admin = createPool(process.env.DB_NAME_AD);

module.exports = { plantcare, collectionofficer, marketPlace, dash, admin };