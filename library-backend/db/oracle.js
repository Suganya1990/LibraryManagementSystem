const oracledb = require('oracledb');

oracledb.autoCommit = true; //auto commits every insert/update

async function getConnection() {
    
    return await oracledb.getConnection({
        user: 'dbs311_252v1a16',
        password: '44802757',
        connectString: 'myoracle12c.senecacollege.ca:1521/oracle12c',
        JWT_SECRET: 'RANDOMlONGsTRING',
            poolMin: 1, poolMax: 5, poolIncrement: 1
    });
}

module.exports = { getConnection };
