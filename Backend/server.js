const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const apiRoutes = require('./src/routes');
const { initDb } = require('./src/config/db');
const { seedRootAdmin } = require('./src/services/admin.service');

const app = express();
const PORT = process.env.PORT || 5000;

// Manual CORS for local development
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && /^http:\/\/localhost:\d+$/.test(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type,Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', apiRoutes);

const startServer = async () => {
  try {
    await initDb();
    await seedRootAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();