const express = require('express');
const { query } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let sql = `SELECT * FROM owners WHERE 1=1`;
    const args = [];
    if (q) { sql += ` AND (name ILIKE $1 OR contact ILIKE $2 OR address ILIKE $3)`; args.push(`%${q}%`,`%${q}%`,`%${q}%`); }
    sql += ` ORDER BY name ASC`;
    res.json((await query(sql, args)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const owner = await query(`SELECT * FROM owners WHERE id = $1`, [req.params.id]);
    if (!owner.rows[0]) return res.status(404).json({ error: 'Owner not found.' });
    const animals = await query(`SELECT * FROM animals WHERE owner_id = $1`, [req.params.id]);
    res.json({ ...owner.rows[0], animals: animals.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, address, contact, barangay } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required.' });
    const result = await query(
      `INSERT INTO owners (name, address, contact, barangay) VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, address||null, contact||null, barangay||null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const fields = ['name','address','contact','barangay'];
    const updates = []; const values = []; let i = 1;
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = $${i}`); values.push(req.body[f]); i++; } });
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });
    values.push(req.params.id);
    const result = await query(`UPDATE owners SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, values);
    if (!result.rows[0]) return res.status(404).json({ error: 'Owner not found.' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query(`DELETE FROM owners WHERE id = $1 RETURNING name`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Owner not found.' });
    res.json({ message: `${result.rows[0].name} deleted.` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;