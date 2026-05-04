import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection';

const router = Router();

router.get('/:projectId/phases', (req, res) => {
  const db = getDb();
  const phases = db.prepare(
    'SELECT * FROM renovation_phases WHERE project_id = ? ORDER BY created_at'
  ).all(req.params.projectId);
  res.json(phases);
});

router.post('/:projectId/phases', (req, res) => {
  const db = getDb();
  const id = uuid();
  const { phase_name, status = 'pending', budget = 0, actual_cost = 0, start_date = '', target_date = '', end_date = '', notes = '' } = req.body;

  db.prepare(`
    INSERT INTO renovation_phases VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(id, req.params.projectId, phase_name, status, budget, actual_cost, start_date, target_date, end_date, notes);

  res.status(201).json(db.prepare('SELECT * FROM renovation_phases WHERE id = ?').get(id));
});

router.put('/:projectId/phases/:phaseId', (req, res) => {
  const db = getDb();
  const fields = ['phase_name', 'status', 'budget', 'actual_cost', 'start_date', 'target_date', 'end_date', 'notes'];
  const updates = fields.filter(f => req.body[f] !== undefined).map(f => `${f} = ?`).join(', ');
  const values = fields.filter(f => req.body[f] !== undefined).map(f => req.body[f]);

  if (updates) {
    db.prepare(`UPDATE renovation_phases SET ${updates} WHERE id = ? AND project_id = ?`).run(
      ...values, req.params.phaseId, req.params.projectId
    );
  }

  res.json(db.prepare('SELECT * FROM renovation_phases WHERE id = ?').get(req.params.phaseId));
});

router.delete('/:projectId/phases/:phaseId', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM renovation_phases WHERE id = ? AND project_id = ?').run(
    req.params.phaseId, req.params.projectId
  );
  res.json({ success: true });
});

export default router;
