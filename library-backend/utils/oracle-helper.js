// utils/oracle-helpers.js
const oracledb = require('oracledb');

async function fetchAllFromCursor(resultSet) {
  const rows = await resultSet.getRows(0); // already [{COL1: val, COL2: val}, ...]
  await resultSet.close();
  return rows;
}

module.exports = { fetchAllFromCursor };
