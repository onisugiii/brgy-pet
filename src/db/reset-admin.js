// src/db/reset-admin.js
const bcrypt = require('bcryptjs');
const { connectDB, query } = require('./database');

async function resetAdmin() {
  await connectDB();

  await query(`DELETE FROM users`);
  console.log('✔  Cleared all users');

  const hash = bcrypt.hashSync('admin1234', 10);
  await query(
    `INSERT INTO users (name, email, password, barangay, role) VALUES ($1,$2,$3,$4,$5)`,
    ['Barangay Admin', 'admin@barangay.gov.ph', hash, 'Barangay Poblacion', 'superadmin']
  );

  const ok = bcrypt.compareSync('admin1234', hash);
  console.log('✔  Admin re-created!');
  console.log('   Email    → admin@barangay.gov.ph');
  console.log('   Password → admin1234');
  console.log('✔  Password verified:', ok ? 'PASS ✅' : 'FAIL ❌');
  process.exit(0);
}

resetAdmin().catch(err => { console.error(err); process.exit(1); });