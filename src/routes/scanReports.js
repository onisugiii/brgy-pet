const express = require('express');
const { query } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT sr.*, a.name AS animal_name, a.species, a.owner_name FROM scan_reports sr LEFT JOIN animals a ON a.id = sr.animal_id ORDER BY sr.scanned_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { animal_id, location, notes, scanned_by } = req.body;
    if (!animal_id) return res.status(400).json({ error: 'animal_id is required.' });
    const animal = await query(`SELECT id, name FROM animals WHERE id = $1`, [animal_id]);
    if (!animal.rows[0]) return res.status(404).json({ error: 'Animal not found.' });
    const result = await query(
      `INSERT INTO scan_reports (animal_id, scanned_by, location, notes) VALUES ($1,$2,$3,$4) RETURNING *`,
      [animal_id, scanned_by||'Public Scan', location||'QR Scan', notes||null]
    );
    await query(`INSERT INTO activity_log (color, text, actor) VALUES ($1,$2,$3)`,
      ['blue', `<strong>${animal.rows[0].name}</strong> QR scanned`, scanned_by||'Public']);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;