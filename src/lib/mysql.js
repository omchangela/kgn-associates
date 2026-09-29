import mysql from 'mysql2/promise';

let pool = null;
let initialized = false;

export function getPool() {
  if (!pool) {
    const host = process.env.MYSQL_HOST || '127.0.0.1';
    const isCloud = host.includes('tidbcloud.com') || process.env.MYSQL_SSL === 'true';

    pool = mysql.createPool({
      host,
      port: parseInt(process.env.MYSQL_PORT || (isCloud ? '4000' : '3306'), 10),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '123456',
      database: process.env.MYSQL_DATABASE || (isCloud ? 'test' : 'kgn_associates'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
      ssl: isCloud ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
    });
  }
  return pool;
}

// Auto-create tables on first query so TiDB Cloud works out-of-the-box
async function ensureTables() {
  if (initialized) return;
  initialized = true;

  try {
    const p = getPool();
    await p.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) DEFAULT '',
        last_name VARCHAR(100) DEFAULT '',
        phone_number VARCHAR(50) DEFAULT '',
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS valuations (
        id VARCHAR(64) PRIMARY KEY,
        report_number VARCHAR(100) DEFAULT '',
        status VARCHAR(50) DEFAULT 'draft',
        applicant_name VARCHAR(255) DEFAULT '',
        bank_name VARCHAR(255) DEFAULT '',
        locality_name VARCHAR(255) DEFAULT '',
        final_market_value DECIMAL(15,2) DEFAULT 0,
        data LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed default admin if user table is empty
    const [existing] = await p.query('SELECT COUNT(*) as count FROM users');
    if (existing[0]?.count === 0) {
      await p.query(`
        INSERT INTO users (id, username, email, password, first_name, last_name, phone_number, role)
        VALUES (
          'user_admin_1',
          'admin',
          'admin@kgnassociates.com',
          '$2b$10$XLDQ/VqWTyFbz59OHSx/Ru2ZeNHrFyXW4g0qCDL98sjxwuhIPxtny',
          'KGN',
          'Admin',
          '+91 98765 43210',
          'admin'
        )
      `);
    }
  } catch (err) {
    console.warn('[MySQL Initialization Note]:', err.message);
  }
}

export async function query(sql, params = []) {
  try {
    await ensureTables();
    const p = getPool();
    const [results] = await p.execute(sql, params);
    return results;
  } catch (error) {
    console.error('[MySQL Error]:', error.message);
    throw error;
  }
}

// User repository methods
export async function findUser(identifier) {
  try {
    const sql = `
      SELECT * FROM users 
      WHERE LOWER(email) = LOWER(?) OR username = ? 
      LIMIT 1
    `;
    const rows = await query(sql, [identifier, identifier]);
    return rows[0] || null;
  } catch (err) {
    return null;
  }
}

export async function findUserById(id) {
  try {
    const sql = `SELECT * FROM users WHERE id = ? LIMIT 1`;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  } catch (err) {
    return null;
  }
}

export async function createUser({ id, username, email, password, first_name = '', last_name = '', phone_number = '', role = 'valuer' }) {
  const sql = `
    INSERT INTO users (id, username, email, password, first_name, last_name, phone_number, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await query(sql, [id, username, email, password, first_name, last_name, phone_number, role]);
  return { id, username, email, first_name, last_name, phone_number, role };
}

// Valuation repository methods
export async function getAllValuations({ search = '', limit = 50 } = {}) {
  try {
    let sql = `SELECT * FROM valuations WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ` AND (applicant_name LIKE ? OR bank_name LIKE ? OR report_number LIKE ? OR locality_name LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    sql += ` ORDER BY updated_at DESC LIMIT ?`;
    params.push(limit);

    const rows = await query(sql, params);
    return rows.map((r) => {
      let parsedData = {};
      try {
        parsedData = typeof r.data === 'string' ? JSON.parse(r.data) : r.data || {};
      } catch (e) {
        parsedData = {};
      }
      return {
        id: r.id,
        _id: r.id,
        report_number: r.report_number,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at,
        ...parsedData,
      };
    });
  } catch (err) {
    console.error('Failed to get valuations from MySQL:', err);
    return [];
  }
}

export async function getValuationById(id) {
  try {
    const sql = `SELECT * FROM valuations WHERE id = ? LIMIT 1`;
    const rows = await query(sql, [id]);
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    let parsedData = {};
    try {
      parsedData = typeof r.data === 'string' ? JSON.parse(r.data) : r.data || {};
    } catch (e) {
      parsedData = {};
    }
    return {
      id: r.id,
      _id: r.id,
      report_number: r.report_number,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      ...parsedData,
    };
  } catch (err) {
    return null;
  }
}

export async function upsertValuation(id, valuationData) {
  const inst = valuationData.institutionDetails || valuationData.institution_details || {};
  const prop = valuationData.propertyIdentification || valuationData.property_identification || {};
  const finalVal = valuationData.finalValuation || valuationData.final_valuation || {};

  const reportNumber = valuationData.report_number || `KGN-2026-${id.slice(-4)}`;
  const status = valuationData.status || 'completed';
  const applicantName = inst.applicant_name || '';
  const bankName = inst.bank_name || '';
  const localityName = prop.locality_name || '';
  const finalMarketValue = parseFloat(finalVal.final_market_value) || 0;
  const jsonPayload = JSON.stringify(valuationData);

  const sql = `
    INSERT INTO valuations (id, report_number, status, applicant_name, bank_name, locality_name, final_market_value, data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      report_number = VALUES(report_number),
      status = VALUES(status),
      applicant_name = VALUES(applicant_name),
      bank_name = VALUES(bank_name),
      locality_name = VALUES(locality_name),
      final_market_value = VALUES(final_market_value),
      data = VALUES(data),
      updated_at = CURRENT_TIMESTAMP
  `;

  await query(sql, [
    id,
    reportNumber,
    status,
    applicantName,
    bankName,
    localityName,
    finalMarketValue,
    jsonPayload,
  ]);

  return getValuationById(id);
}

export async function deleteValuation(id) {
  const sql = `DELETE FROM valuations WHERE id = ?`;
  await query(sql, [id]);
  return true;
}

const mysqlDb = {
  query,
  findUser,
  findUserById,
  createUser,
  getAllValuations,
  getValuationById,
  upsertValuation,
  deleteValuation,
};

export default mysqlDb;
