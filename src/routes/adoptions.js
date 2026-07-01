const express = require('express');
const { query } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT a.id, a.animal_id, a.animal_name, a.species, a.description, a.listed_by, a.status, a.listed_at FROM adoptions a WHERE 1=1`;
    const args = [];
    if (status) { sql += ` AND a.status = $1`; args.push(status); }
    sql += ` ORDER BY a.listed_at DESC`;
    res.json((await query(sql, args)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, animal_id, animal_name, species, description, listed_by, status, listed_at FROM adoptions WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Listing not found.' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { animal_id, animal_name, species, description, listed_by } = req.body;
    if (!animal_id || !animal_name) return res.status(400).json({ error: 'animal_id and animal_name are required.' });
    const animal = await query(`SELECT id FROM animals WHERE id = $1`, [animal_id]);
    if (!animal.rows[0]) return res.status(404).json({ error: 'Animal not found.' });
    const result = await query(
      `INSERT INTO adoptions (animal_id, animal_name, species, description, listed_by) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [animal_id, animal_name, species||null, description||null, listed_by||null]
    );
    await query(`INSERT INTO activity_log (color, text, actor) VALUES ($1,$2,$3)`,
      ['blue', `<strong>${animal_name}</strong> listed for adoption`, req.user.name]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { description, listed_by } = req.body;
    const result = await query(
      `UPDATE adoptions SET description = $1, listed_by = $2 WHERE id = $3 RETURNING *`,
      [description||null, listed_by||null, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Listing not found.' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/adopt', async (req, res) => {
  try {
    const result = await query(`UPDATE adoptions SET status = 'adopted' WHERE id = $1 RETURNING *`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Listing not found.' });
    if (result.rows[0].animal_id) {
      await query(`UPDATE animals SET vax_status = 'Adopted', notes = COALESCE(notes || ' | ', '') || 'Adopted via adoption listing.' WHERE id = $1`, [result.rows[0].animal_id]);
    }
    await query(`INSERT INTO activity_log (color, text, actor) VALUES ($1,$2,$3)`,
      ['green', `<strong>${result.rows[0].animal_name}</strong> has been adopted`, req.user.name]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query(`DELETE FROM adoptions WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Listing not found.' });
    res.json({ message: 'Deleted.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;