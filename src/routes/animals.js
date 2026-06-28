const express = require('express');
const { query } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { q, species, status } = req.query;
    let sql    = `SELECT * FROM animals WHERE 1=1`;
    const args = [];
    let i = 1;
    if (q) {
      sql += ` AND (name ILIKE $${i} OR owner_name ILIKE $${i+1} OR breed ILIKE $${i+2} OR species ILIKE $${i+3})`;
      args.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`); i += 4;
    }
    if (species) { sql += ` AND species = $${i}`; args.push(species); i++; }
    if (status)  { sql += ` AND vax_status = $${i}`; args.push(status); i++; }
    sql += ` ORDER BY registered_at DESC`;
    const result = await query(sql, args);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM animals WHERE id = $1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Animal not found.' });
    const vax = await query(`SELECT * FROM vaccinations WHERE animal_id = $1 ORDER BY given_at DESC`, [req.params.id]);
    res.json({ ...result.rows[0], vaccinations: vax.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, breed, species, color, sex, age, owner_id, owner_name, vax_status, image, notes } = req.body;
    if (!name || !species || !owner_name)
      return res.status(400).json({ error: 'name, species, and owner_name are required.' });

    const result = await query(
      `INSERT INTO animals (name, breed, species, color, sex, age, owner_id, owner_name, vax_status, image, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, breed||null, species, color||null, sex||null, age||null, owner_id||null, owner_name, vax_status||'Unvaccinated', image||null, notes||null]
    );
    await query(`INSERT INTO activity_log (color, text, actor) VALUES ($1,$2,$3)`,
      ['blue', `<strong>${name}</strong> registered in Animal Registry`, req.user.name]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const fields = ['name','breed','species','color','sex','age','owner_id','owner_name','vax_status','image','notes'];
    const updates = []; const values = []; let i = 1;
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = $${i}`); values.push(req.body[f]); i++; } });
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });
    values.push(req.params.id);
    const result = await query(`UPDATE animals SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, values);
    if (!result.rows[0]) return res.status(404).json({ error: 'Animal not found.' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query(`DELETE FROM animals WHERE id = $1 RETURNING name`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Animal not found.' });
    await query(`INSERT INTO activity_log (color, text, actor) VALUES ($1,$2,$3)`,
      ['red', `<strong>${result.rows[0].name}</strong> removed from Animal Registry`, req.user.name]);
    res.json({ message: `${result.rows[0].name} deleted.` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;