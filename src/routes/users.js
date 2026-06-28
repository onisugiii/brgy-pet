const express = require('express');
const bcrypt  = require('bcryptjs');
const { query } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

function requireSuperAdmin(req, res, next) {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only superadmins can perform this action.' });
  }
  next();
}

router.get('/', async (req, res) => {
  try {
    res.json((await query(`SELECT id, name, email, barangay, role, created_at FROM users ORDER BY created_at DESC`)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, barangay, role } = req.body;
    if (!name || !email || !password || !barangay) return res.status(400).json({ error: 'All fields are required.' });
    const existing = await query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already exists.' });
    const hash   = bcrypt.hashSync(password, 10);
    const result = await query(
      `INSERT INTO users (name, email, password, barangay, role) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, barangay, role`,
      [name, email, hash, barangay, role||'admin']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const fields = ['name','email','barangay','role'];
    const updates = []; const values = []; let i = 1;
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = $${i}`); values.push(req.body[f]); i++; } });
    if (req.body.password) { updates.push(`password = $${i}`); values.push(bcrypt.hashSync(req.body.password, 10)); i++; }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });
    values.push(req.params.id);
    const result = await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, name, email, barangay, role`, values);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found.' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireSuperAdmin, async (req, res) => {
  try {
    if (String(req.user.id) === String(req.params.id)) return res.status(400).json({ error: 'Cannot delete your own account.' });
    const result = await query(`DELETE FROM users WHERE id = $1 RETURNING name`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: `${result.rows[0].name} deleted.` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;