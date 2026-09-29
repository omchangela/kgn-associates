import mysql from 'mysql2/promise';

let pool = null;
let initialized = false;

export function getPool() {
  if (!pool) {
    if (process.env.DATABASE_URL) {
      pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 35000,
      });
      return pool;
    }

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
        city VARCHAR(100) DEFAULT '',
        role VARCHAR(50) DEFAULT 'admin',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure status and city columns exist if table was created previously
    try {
      await p.query(`ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'`);
    } catch (e) {
      // Column already exists
    }
    try {
      await p.query(`ALTER TABLE users ADD COLUMN city VARCHAR(100) DEFAULT ''`);
    } catch (e) {
      // Column already exists
    }

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
        INSERT INTO users (id, username, email, password, first_name, last_name, phone_number, role, status)
        VALUES (
          'user_admin_1',
          'admin',
          'admin@kgnassociates.com',
          '$2b$10$XLDQ/VqWTyFbz59OHSx/Ru2ZeNHrFyXW4g0qCDL98sjxwuhIPxtny',
          'KGN',
          'Admin',
          '+91 98765 43210',
          'admin',
          'active'
        )
      `);
    }

    // Seed admin@admin.com / 12345678 if not present
    const [adminExists] = await p.query('SELECT id FROM users WHERE email = ?', ['admin@admin.com']);
    if (!adminExists || adminExists.length === 0) {
      await p.query(`
        INSERT INTO users (id, username, email, password, first_name, last_name, phone_number, role, status)
        VALUES (
          'user_admin_root',
          'admin_admin',
          'admin@admin.com',
          '$2b$10$uRO6yzoFa7Wx2/l4L6XgMeb2U0CeQ5/2zIqh5LcdflFZGCPw3eteS',
          'Executive',
          'Admin',
          '+91 98765 43210',
          'admin',
          'active'
        )
      `);
    }

    // Seed sample reports if table has <= 1 report
    const [valCount] = await p.query('SELECT COUNT(*) as count FROM valuations');
    if (valCount[0]?.count <= 1) {
      const sampleVal2 = {
        id: 'val_hdfc_002',
        report_number: 'KGN-2026-002',
        status: 'pending',
        applicant_name: 'Dr. Anand Verma',
        bank_name: 'HDFC Bank Ltd',
        locality_name: 'Gachibowli, Financial District',
        final_market_value: 18500000,
        createdBy: 'emp_1790673965630',
        institution_details: {
          applicant_name: 'Dr. Anand Verma',
          bank_name: 'HDFC Bank Ltd',
          branch_name: 'Banjara Hills, Hyderabad',
          loan_application_id: 'HDFC-MORT-8812',
          product_loan_type: 'Mortgage Loan',
          date_of_report: '2026-03-24'
        },
        property_identification: {
          locality_name: 'Gachibowli, Financial District',
          plot_no_flat_no: 'Unit 301, Cyber Heights'
        },
        final_valuation: {
          final_market_value: 18500000,
          distress_value: 15000000,
          forced_sale_value: 14000000,
          valuer_name: 'Er. Arjun Reddy'
        }
      };

      const sampleVal3 = {
        id: 'val_icici_003',
        report_number: 'KGN-2026-003',
        status: 'rejected',
        applicant_name: 'Pooja Enterprises',
        bank_name: 'ICICI Bank Ltd',
        locality_name: 'GIDC Pandesara, Surat',
        final_market_value: 29000000,
        createdBy: 'emp_1790673965630',
        institution_details: {
          applicant_name: 'Pooja Enterprises',
          bank_name: 'ICICI Bank Ltd',
          branch_name: 'Ring Road, Surat',
          loan_application_id: 'ICICI-LAP-4412',
          product_loan_type: 'Loan Against Property',
          date_of_report: '2026-03-25'
        },
        property_identification: {
          locality_name: 'GIDC Pandesara, Surat',
          plot_no_flat_no: 'Shed No. 12'
        },
        final_valuation: {
          final_market_value: 29000000,
          distress_value: 23000000,
          forced_sale_value: 21500000,
          valuer_name: 'Er. Arjun Reddy'
        }
      };

      await p.query(`
        INSERT IGNORE INTO valuations (id, report_number, status, applicant_name, bank_name, locality_name, final_market_value, data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        sampleVal2.id, sampleVal2.report_number, sampleVal2.status, sampleVal2.applicant_name, sampleVal2.bank_name, sampleVal2.locality_name, sampleVal2.final_market_value, JSON.stringify(sampleVal2),
        sampleVal3.id, sampleVal3.report_number, sampleVal3.status, sampleVal3.applicant_name, sampleVal3.bank_name, sampleVal3.locality_name, sampleVal3.final_market_value, JSON.stringify(sampleVal3)
      ]);
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

export async function createUser({ id, username, email, password, first_name = '', last_name = '', phone_number = '', city = '', role = 'valuer', status = 'active' }) {
  const sql = `
    INSERT INTO users (id, username, email, password, first_name, last_name, phone_number, city, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await query(sql, [id, username, email, password, first_name, last_name, phone_number, city, role, status]);
  return { id, username, email, first_name, last_name, phone_number, city, role, status };
}

export async function getAllUsers() {
  try {
    const sql = `SELECT id, username, email, first_name, last_name, phone_number, COALESCE(city, '') as city, role, COALESCE(status, 'active') as status, created_at FROM users ORDER BY created_at DESC`;
    const rows = await query(sql);
    return rows || [];
  } catch (err) {
    console.error('Failed to get users from MySQL:', err);
    return [];
  }
}

export async function updateUserStatus(id, status) {
  try {
    const sql = `UPDATE users SET status = ? WHERE id = ?`;
    await query(sql, [status, id]);
    return true;
  } catch (err) {
    console.error('Failed to update user status in MySQL:', err);
    return false;
  }
}

export async function updateUser(id, { first_name = '', last_name = '', email = '', phone_number = '', city = '', role = 'valuer', status = 'active', password = '' }) {
  try {
    let sql = `UPDATE users SET first_name = ?, last_name = ?, email = ?, phone_number = ?, city = ?, role = ?, status = ?`;
    const params = [first_name, last_name, email, phone_number, city, role, status];
    if (password) {
      sql += `, password = ?`;
      params.push(password);
    }
    sql += ` WHERE id = ?`;
    params.push(id);
    await query(sql, params);
    return true;
  } catch (err) {
    console.error('Failed to update user in MySQL:', err);
    return false;
  }
}

export async function deleteUser(id) {
  try {
    const sql = `DELETE FROM users WHERE id = ?`;
    await query(sql, [id]);
    return true;
  } catch (err) {
    console.error('Failed to delete user from MySQL:', err);
    return false;
  }
}

export async function getAdminStats() {
  try {
    const userRows = await query(`
      SELECT 
        COUNT(*) as total_employees,
        SUM(CASE WHEN status = 'active' OR status IS NULL OR status = '' THEN 1 ELSE 0 END) as active_employees,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_employees
      FROM users
    `);
    const userStats = userRows[0] || {};

    const reportRows = await query(`
      SELECT 
        COUNT(*) as total_reports,
        SUM(CASE WHEN status = 'approved' OR status = 'completed' THEN 1 ELSE 0 END) as approved_reports,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_reports,
        SUM(CASE WHEN status = 'draft' OR status = 'in_progress' OR status IS NULL THEN 1 ELSE 0 END) as draft_reports
      FROM valuations
    `);
    const reportStats = reportRows[0] || {};

    const recentReports = await query(`
      SELECT id, report_number, status, applicant_name, bank_name, locality_name, final_market_value, updated_at
      FROM valuations
      ORDER BY updated_at DESC
      LIMIT 8
    `);

    const recentEmployees = await query(`
      SELECT id, username, email, first_name, last_name, phone_number, COALESCE(city, '') as city, role, COALESCE(status, 'active') as status, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 8
    `);

    return {
      totalEmployees: Number(userStats.total_employees || 0),
      activeEmployees: Number(userStats.active_employees || 0),
      inactiveEmployees: Number(userStats.inactive_employees || 0),
      totalReports: Number(reportStats.total_reports || 0),
      approvedReports: Number(reportStats.approved_reports || 0),
      rejectedReports: Number(reportStats.rejected_reports || 0),
      draftReports: Number(reportStats.draft_reports || 0),
      recentReports: (recentReports || []).map(r => ({
        id: r.id,
        report_number: r.report_number,
        status: r.status,
        applicant_name: r.applicant_name,
        bank_name: r.bank_name,
        locality_name: r.locality_name,
        final_market_value: r.final_market_value,
        updated_at: r.updated_at,
      })),
      recentEmployees: (recentEmployees || []).map(e => ({
        id: e.id,
        username: e.username,
        email: e.email,
        first_name: e.first_name,
        last_name: e.last_name,
        phone_number: e.phone_number,
        city: e.city || '',
        role: e.role,
        status: e.status || 'active',
        created_at: e.created_at,
      })),
    };
  } catch (err) {
    console.error('Failed to get admin stats from MySQL:', err);
    return null;
  }
}

export async function updateValuationStatus(id, status) {
  try {
    const sql = `UPDATE valuations SET status = ? WHERE id = ?`;
    await query(sql, [status, id]);
    return true;
  } catch (err) {
    console.error('Failed to update valuation status in MySQL:', err);
    return false;
  }
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
        created_at: r.created_at,
        updated_at: r.updated_at,
        ...parsedData,
        report_number: r.report_number || parsedData.report_number,
        status: r.status || parsedData.status || 'completed',
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
      created_at: r.created_at,
      updated_at: r.updated_at,
      ...parsedData,
      report_number: r.report_number || parsedData.report_number,
      status: r.status || parsedData.status || 'completed',
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
  getAllUsers,
  deleteUser,
  getAllValuations,
  getValuationById,
  upsertValuation,
  deleteValuation,
};

export default mysqlDb;
