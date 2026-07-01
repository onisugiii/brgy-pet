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

// ── Password reset requests (superadmin only) ──
router.get('/reset-requests', requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT pr.id, pr.user_id, pr.status, pr.requested_at, u.name, u.email
      FROM password_resets pr
      JOIN users u ON u.id = pr.user_id
      WHERE pr.status = 'pending'
      ORDER BY pr.requested_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/reset-requests/:id/approve', requireSuperAdmin, async (req, res) => {
  try {
    const reset = await query(`SELECT * FROM password_resets WHERE id = $1 AND status = 'pending'`, [req.params.id]);
    if (!reset.rows[0]) return res.status(404).json({ error: 'Reset request not found.' });
    await query(`UPDATE users SET password = $1 WHERE id = $2`, [reset.rows[0].new_password, reset.rows[0].user_id]);
    await query(`UPDATE password_resets SET status = 'approved' WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Password reset approved and applied.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/reset-requests/:id/reject', requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(`UPDATE password_resets SET status = 'rejected' WHERE id = $1 AND status = 'pending' RETURNING id`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Reset request not found.' });
    res.json({ message: 'Reset request rejected.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;