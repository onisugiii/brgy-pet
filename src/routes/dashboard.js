const express = require('express');
const { query } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const [total, vaccinated, lostFound, adoption, recentAnimals, activityFeed] = await Promise.all([
      query(`SELECT COUNT(*) FROM animals`),
      query(`SELECT COUNT(*) FROM animals WHERE vax_status = 'Vaccinated'`),
      query(`SELECT COUNT(*) FROM lost_found WHERE status = 'active'`),
      query(`SELECT COUNT(*) FROM adoptions WHERE status = 'available'`),
      query(`SELECT * FROM animals ORDER BY registered_at DESC LIMIT 5`),
      query(`SELECT * FROM activity_log ORDER BY logged_at DESC LIMIT 10`),
    ]);

    const t = parseInt(total.rows[0].count);
    const v = parseInt(vaccinated.rows[0].count);

    res.json({
      stats: {
        total:      t,
        vaccinated: v,
        lostFound:  parseInt(lostFound.rows[0].count),
        adoption:   parseInt(adoption.rows[0].count),
        coverage:   t > 0 ? Math.round((v / t) * 100) : 0,
      },
      recentAnimals: recentAnimals.rows,
      activityFeed:  activityFeed.rows.map(a => ({
        ...a,
        time: new Date(a.logged_at).toLocaleString('en-PH', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
        }) + (a.actor ? ` · ${a.actor}` : ''),
      })),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;