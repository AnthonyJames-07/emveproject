const sql = require('mssql');

const dbConfig = {
  user: 'mss',
  password: 'Mss@Sa',
  server: '103.38.50.73',
  database: 'COSEC',
  port: 3141,
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
    useUTC: true,
    enableArithAbort: true,
    encrypt: false,
    driver: 'msnodesqlv8'
  },
};

let poolPromise;

const getPool = async () => {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig);
  }
  return poolPromise;
};

module.exports = {
  sql,
  getPool
};
