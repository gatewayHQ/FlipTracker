import 'dotenv/config';
import path from 'path';
import express from 'express';
import app from './app';

const PORT = process.env.PORT || 3001;

const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Flip Folio server running on http://localhost:${PORT}`);
});
