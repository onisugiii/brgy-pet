// src/db/seed.js
const bcrypt = require('bcryptjs');
const { connectDB, query } = require('./database');

async function seed() {
  try {
    await connectDB();
    console.log("Connected to database...");

    // Check if admin user already exists
    const existing = await query(
      `SELECT id FROM users WHERE email = $1`,
      ['admin@barangay.gov.ph']
    );

    if (existing.rows.length === 0) {
      const hash = bcrypt.hashSync('admin1234', 10);

      await query(
        `INSERT INTO users (name, email, password, barangay, role) 
         VALUES ($1, $2, $3, $4, $5)`,
        ['Barangay Admin', 'admin@barangay.gov.ph', hash, 'Barangay Name', 'admin']
      );

      console.log("Admin user created successfully!");
    } else {
      console.log("Admin user already exists, skipping insert.");
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Error during seeding:", err);
    process.exit(1);
  }
}

seed();
