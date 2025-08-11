// routes/login.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // easier on Windows; works fine
const { getConnection } = require("../db/oracle");
const oracledb = require("oracledb");
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const router = express.Router();

// Toggle hashing via env (PLAIN means compare plaintext; any other value = bcrypt)
const PLAIN_PASSWORDS =
  String(process.env.PLAIN_PASSWORDS || "").toLowerCase() === "true";
const TABLE = "users";

// --- Helpers ---
function requireJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set in environment variables");
  }
}
function normalizeUsername(u) {
  return (u ?? "").trim();
}

// --- Sanity ping ---
router.get("/ping", (_req, res) => res.json({ ok: true }));

// --- Register (creates a user) ---
router.post("/register", async (req, res) => {
  console.log(req.body);
  const { username, password, name, email, member_type, role } = req.body || {};
  if (!username || !password || !name || !member_type) {
    return res
      .status(400)
      .json({
        success: false,
        message: "username, password, name, member_type are required",
      });
  }

  let conn;
  try {
    // hash or keep plain depending on your env flag (reuse your PLAIN_PASSWORDS if you like)
    const hashed = await bcrypt.hash(password, 10);

    const sql = `
      BEGIN
        register_member_user_sp(
          :p_username, :p_password, :p_full_name, :p_email, :p_member_type, :p_role,
          :o_member_id, :o_user_id
        );
      END;`;

    const binds = {
      p_username: username.trim(),
      p_password: hashed, // send hashed; change if you’re intentionally using plain
      p_full_name: name.trim(),
      p_email: email || null,
      p_member_type: member_type, // 'Student' | 'Faculty' | 'Guest'
      p_role: role || null, // optional override ('admin'|'staff'|'patron'|'guest')
      o_member_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      o_user_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    };

    conn = await getConnection();
    const r = await conn.execute(sql, binds, { autoCommit: true });

    return res.status(201).json({
      success: true,
      member_id: r.outBinds.o_member_id,
      user_id: r.outBinds.o_user_id,
    });
  } catch (e) {
    // bubble up “Username already exists” from the proc (-20001) nicely
    if (String(e.message || e).includes("-20001")) {
      return res
        .status(409)
        .json({ success: false, message: "Username already exists" });
    }
    console.error("REGISTER ERROR:", e);
    return res.status(500).json({ success: false, message: "Register failed" });
  } finally {
    try {
      await conn?.close();
    } catch {}
  }
});
// --- Login (verifies credentials, returns JWT + role) ---
router.post("/login", async (req, res) => {
  debugger;
  const username = normalizeUsername(req.body?.username);
  const password = req.body.password;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "username and password are required" });
  }

  let conn;
  try {
    requireJwtSecret();
    conn = await getConnection();

    // Case-insensitive match on username
    const who = await conn.execute(
      `select user as ME, sys_context('userenv','service_name') as SVC from dual`
    );
    const r = await conn.execute(
      `SELECT username, password, role
     FROM lms_users
    WHERE LOWER(username) = LOWER(:u)`,
      { u: (username ?? "").trim() }
    );
    console.log(r);
    console.log("DB rows ->", r.rows);
    if (!r.rows || r.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }
    console.log("DB rows ->", r.rows);
    const user = r.rows[0]; // { ID, USERNAME, PASSWORD, ROLE }

    console.log(
      "DB password prefix/len ->",
      String(user.PASSWORD).slice(0, 7),
      String(user.PASSWORD).length
    );
    // If hashed, it should look like: "$2b$10" and be ~60 chars
    let valid;
    if (PLAIN_PASSWORDS) {
      valid = password === user.PASSWORD;
    } else {
      valid = await bcrypt.compare(password, user.PASSWORD);
    }
    if (!valid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { sub: user.ID, username: user.USERNAME, role: user.ROLE },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({
      success: true,
      token,
      user: { id: user.ID, username: user.USERNAME, role: user.ROLE },
    });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    if (conn) await conn.close().catch(() => {});
  }
});

module.exports = router;
