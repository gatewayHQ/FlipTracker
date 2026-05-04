import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection';

const router = Router();

router.get('/', (_req, res) => {
  const db = getDb();
  const vendors = db.prepare('SELECT * FROM vendors ORDER BY name').all();
  res.json(vendors);
});

router.post('/', (req, res) => {
  const db = getDb();
  const id = uuid();
  const { name, company = '', phone = '', email = '', specialty = '', rating = 0, hourly_rate = 0, notes = '' } = req.body;

  db.prepare(`
    INSERT INTO vendors VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(id, name, company, phone, email, specialty, rating, hourly_rate, notes);

  res.status(201).json(db.prepare('SELECT * FROM vendors WHERE id = ?').get(id));
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  const projects = db.prepare(`
    SELECT pv.*, p.name as project_name, p.address, p.status as project_status
    FROM project_vendors pv
    JOIN projects p ON pv.project_id = p.id
    WHERE pv.vendor_id = ?
  `).all(req.params.id);

  res.json({ ...vendor as object, projects });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Vendor not found' });

  const fields = ['name', 'company', 'phone', 'email', 'specialty', 'rating', 'hourly_rate', 'notes'];
  const updates = fields.filter(f => req.body[f] !== undefined).map(f => `${f} = ?`).join(', ');
  const values = fields.filter(f => req.body[f] !== undefined).map(f => req.body[f]);

  if (updates) {
    db.prepare(`UPDATE vendors SET ${updates} WHERE id = ?`).run(...values, req.params.id);
  }

  res.json(db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM vendors WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:vendorId/projects/:projectId', (req, res) => {
  const db = getDb();
  const id = uuid();
  const { phase_name = '', contracted_amount = 0, paid_amount = 0, notes = '' } = req.body;

  const existing = db.prepare(
    'SELECT * FROM project_vendors WHERE vendor_id = ? AND project_id = ?'
  ).get(req.params.vendorId, req.params.projectId);

  if (existing) return res.status(400).json({ error: 'Vendor already attached to this project' });

  db.prepare(`
    INSERT INTO project_vendors VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(id, req.params.projectId, req.params.vendorId, phase_name, contracted_amount, paid_amount, notes);

  res.status(201).json(db.prepare('SELECT * FROM project_vendors WHERE id = ?').get(id));
});

router.delete('/:vendorId/projects/:projectId', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM project_vendors WHERE vendor_id = ? AND project_id = ?').run(
    req.params.vendorId, req.params.projectId
  );
  res.json({ success: true });
});

export default router;
