require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { connectDB } = require('./db/database');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/animals',      require('./routes/animals'));
app.use('/api/owners',       require('./routes/owners'));
app.use('/api/vaccinations', require('./routes/vaccinations'));
app.use('/api/lost-found',   require('./routes/lostFound'));
app.use('/api/adoptions',    require('./routes/adoptions'));
app.use('/api/scan-reports', require('./routes/scanReports'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/dashboard',    require('./routes/dashboard'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', db: 'PostgreSQL' }));
app.use('/api/*', (_, res) => res.status(404).json({ error: 'Not found.' }));

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🐾  BRGY-PET API  →  http://localhost:${PORT}\n`);
  });
});