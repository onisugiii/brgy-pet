const express  = require('express');
const bcrypt   = require('bcryptjs');
const { query } = require('../db/database');
const { signToken, requireAuth } = require('../middleware/auth');
const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, barangay } = req.body;
    if (!name || !email || !password || !barangay)
      return res.status(400).json({ error: 'All fields are required.' });

    const existing = await query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'Email already registered.' });

    const hash = bcrypt.hashSync(password, 10);
    const result = await query(
      `INSERT INTO users (name, email, password, barangay) VALUES ($1,$2,$3,$4) RETURNING id, name, email, barangay, role`,
      [name, email, hash, barangay]
    );
    const user  = result.rows[0];
    const token = signToken({ id: user.id, email: user.email, name: user.name, barangay: user.barangay, role: user.role });
    res.status(201).json({ token, user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const result = await query(`SELECT * FROM users WHERE email = $1`, [email]);
    const user   = result.rows[0];

    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'Invalid email or password.' });

    const token = signToken({ id: user.id, email: user.email, name: user.name, barangay: user.barangay, role: user.role });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, barangay: user.barangay, role: user.role } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await query(`SELECT id, name, email, barangay, role, created_at FROM users WHERE id = $1`, [req.user.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found.' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;