// routes/login.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // easier on Windows; works fine
const { getConnection } = require('../db/oracle');
const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const router = express.Router();

// Toggle hashing via env (PLAIN means compare plaintext; any other value = bcrypt)
const PLAIN_PASSWORDS = String(process.env.PLAIN_PASSWORDS || '').toLowerCase() === 'true';
const TABLE = 'users';

// --- Helpers ---
function requireJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in environment variables');
  }
}
function normalizeUsername(u) {
  return (u ?? '').trim();
}

// --- Sanity ping ---
router.get('/ping', (_req, res) => res.json({ ok: true }));

// --- Register (creates a user) ---
// NOTE: In production, keep hashing ON. For class testing, set PLAIN_PASSWORDS=true in .env
router.post('/register', async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = req.body?.password ?? '';
  const role = (req.body?.role ?? 'patron').trim();

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'username and password are required' });
  }

  let conn;
  try {
    conn = await getConnection();
    const toStore = PLAIN_PASSWORDS ? password : await bcrypt.hash(password, 10);

    await conn.execute(
      `INSERT INTO ${TABLE} (username, password, role)
       VALUES (:u, :p, :r)`,
      { u: username, p: toStore, r: role },
      { autoCommit: true }
    );

    return res.status(201).json({ success: true, message: 'User registered' });
  } catch (e) {
    // Unique username violation: ORA-00001
    const msg = e && e.errorNum === 1 ? 'Username already exists' : e.message || 'Register failed';
    return res.status(500).json({ success: false, message: msg });
  } finally {
    if (conn) await conn.close().catch(() => {});
  }
});

// --- Login (verifies credentials, returns JWT + role) ---
router.post('/login', async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = req.body.password

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'username and password are required' });
  }

  let conn;
  try {
    requireJwtSecret();
    conn = await getConnection();

    // Case-insensitive match on username
          const who = await conn.execute(
  `select user as ME, sys_context('userenv','service_name') as SVC from dual`
);
console.log('login body ->', req.body);

const r = await conn.execute(
  `SELECT id, username, password, role
     FROM users
    WHERE LOWER(username) = LOWER(:u)`,
  { u: (username ?? '').trim() }
);
console.log('DB rows ->', r.rows);
    if (!r.rows || r.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const user = r.rows[0]; // { ID, USERNAME, PASSWORD, ROLE }

    let valid;
    if (PLAIN_PASSWORDS) {
      valid = password === user.PASSWORD;
    } else {
      valid = await bcrypt.compare(password, user.PASSWORD);
    }
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { sub: user.ID, username: user.USERNAME, role: user.ROLE },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({
      success: true,
      token,
      user: { id: user.ID, username: user.USERNAME, role: user.ROLE }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (conn) await conn.close().catch(() => {});
  }
});

module.exports = router;