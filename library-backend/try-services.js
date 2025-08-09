                                                                                                // try-services.js
require('dotenv').config();
const oracledb = require('oracledb');
const host = '10.102.107.24', port = 1521;
const { DB_USERNAME:user, DB_PASSWORD:password } = process.env;
const names = ['xepdb1','XE','ORCLPDB','ORCL',':ORCL',':XE']; // last two = SID

(async () => {
  for (const n of names) {
    
    const connectString = n.startsWith(':') ? `${host}:${port}${n}` : `${host}:${port}/${n}`;
    try {
      const c = await oracledb.getConnection({ user, password, connectString });
      console.log('✅ Works:', connectString);
      await c.close(); break;
    } catch(e){ console.log('❌', connectString, e.code || e.message); }
  }
})();