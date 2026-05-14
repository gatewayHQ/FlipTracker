import 'dotenv/config';
import path from 'path';
import express from 'express';
import { initializeSchema } from './db/schema';
import app from './app';

const PORT = process.env.PORT || 3001;

// Serve compiled client for local production preview
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

async function start() {
  await initializeSchema();
  app.listen(PORT, () => {
    console.log(`Flip Folio server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
