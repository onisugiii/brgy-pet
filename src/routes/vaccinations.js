const express = require('express');
const { query } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { animal_id } = req.query;
    let sql = `SELECT v.id, v.animal_id, v.vaccine, v.given_by, v.given_at, v.next_due, v.notes, a.name AS animal_name, a.species FROM vaccinations v LEFT JOIN animals a ON a.id = v.animal_id WHERE 1=1`;
    const args = [];
    if (animal_id) { sql += ` AND v.animal_id = $1`; args.push(animal_id); }
    sql += ` ORDER BY v.given_at DESC`;
    res.json((await query(sql, args)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT v.id, v.animal_id, v.vaccine, v.given_by, v.given_at, v.next_due, v.notes, a.name AS animal_name, a.species FROM vaccinations v LEFT JOIN animals a ON a.id = v.animal_id WHERE v.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Record not found.' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { animal_id, vaccine, given_by, given_at, next_due, notes } = req.body;
    if (!animal_id || !vaccine) return res.status(400).json({ error: 'animal_id and vaccine are required.' });

    const animal = await query(`SELECT id, name, vax_status FROM animals WHERE id = $1`, [animal_id]);
    if (!animal.rows[0]) return res.status(404).json({ error: 'Animal not found.' });

    const result = await query(
      `INSERT INTO vaccinations (animal_id, vaccine, given_by, given_at, next_due, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [animal_id, vaccine, given_by||null, given_at||new Date(), next_due||null, notes||null]
    );

    if (animal.rows[0].vax_status === 'Unvaccinated') {
      await query(`UPDATE animals SET vax_status = 'Partial' WHERE id = $1`, [animal_id]);
    }

    await query(`INSERT INTO activity_log (color, text, actor) VALUES ($1,$2,$3)`,
      ['green', `<strong>${animal.rows[0].name}</strong> received ${vaccine}`, req.user.name]);

    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const fields = ['vaccine','given_by','given_at','next_due','notes'];
    const updates = []; const values = []; let i = 1;
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = $${i}`); values.push(req.body[f]); i++; } });
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });
    values.push(req.params.id);
    const result = await query(`UPDATE vaccinations SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, values);
    if (!result.rows[0]) return res.status(404).json({ error: 'Record not found.' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query(`DELETE FROM vaccinations WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Record not found.' });
    res.json({ message: 'Deleted.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;