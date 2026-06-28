const express = require('express');
const { query } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    let sql = `SELECT lf.*, a.name AS animal_name, a.species FROM lost_found lf LEFT JOIN animals a ON a.id = lf.animal_id WHERE 1=1`;
    const args = []; let i = 1;
    if (type)   { sql += ` AND lf.type = $${i}`;   args.push(type);   i++; }
    if (status) { sql += ` AND lf.status = $${i}`; args.push(status); i++; }
    sql += ` ORDER BY lf.reported_at DESC`;
    res.json((await query(sql, args)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT lf.*, a.name AS animal_name FROM lost_found lf LEFT JOIN animals a ON a.id = lf.animal_id WHERE lf.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Report not found.' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { animal_id, type, description, last_seen, reporter, contact } = req.body;
    if (!type || !['lost','found'].includes(type))
      return res.status(400).json({ error: "type must be 'lost' or 'found'." });
    const result = await query(
      `INSERT INTO lost_found (animal_id, type, description, last_seen, reporter, contact) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [animal_id||null, type, description||null, last_seen||null, reporter||null, contact||null]
    );
    await query(`INSERT INTO activity_log (color, text, actor) VALUES ($1,$2,$3)`,
      ['yellow', `A pet was reported <strong>${type}</strong>`, req.user.name]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const fields = ['type','description','last_seen','reporter','contact'];
    const updates = []; const values = []; let i = 1;
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = $${i}`); values.push(req.body[f]); i++; } });
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });
    values.push(req.params.id);
    const result = await query(`UPDATE lost_found SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, values);
    if (!result.rows[0]) return res.status(404).json({ error: 'Report not found.' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/resolve', async (req, res) => {
  try {
    const result = await query(`UPDATE lost_found SET status = 'resolved' WHERE id = $1 RETURNING *`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Report not found.' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query(`DELETE FROM lost_found WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Report not found.' });
    res.json({ message: 'Deleted.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;