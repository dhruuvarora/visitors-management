const { Kysely, MysqlDialect } = require('kysely');
const { createPool } = require('mysql2');
require('dotenv').config();

const dialect = new MysqlDialect({
  pool: createPool({
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '3306'),
    connectionLimit: 10,
  })
});

const db = new Kysely({
  dialect,
});

module.exports = db;