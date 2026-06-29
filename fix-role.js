require('dotenv').config();
const { query, connectDB } = require('./src/db/database');
connectDB().then(async () => {
  await query("UPDATE users SET role='superadmin' WHERE email='admin@barangay.gov.ph'");
  console.log('Done!');
  process.exit();
});