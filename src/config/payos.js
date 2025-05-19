const PayOS = require('@payos/node');
require('dotenv').config(); // Đảm bảo load biến môi trường trước khi sử dụng

const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID,   // clientId
  process.env.PAYOS_API_KEY,     // apiKey
  process.env.PAYOS_CHECKSUM_KEY // checksumKey
);

module.exports = payOS;