import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection';

const router = Router();

router.get('/:projectId/milestones', (req, res) => {
  const db = getDb();
  const milestones = db.prepare(
    'SELECT * FROM milestones WHERE project_id = ? ORDER BY due_date'
  ).all(req.params.projectId);
  res.json(milestones);
});

router.post('/:projectId/milestones', (req, res) => {
  const db = getDb();
  const id = uuid();
  const { title, due_date = '', completed = 0, completed_date = '', notes = '' } = req.body;

  db.prepare(`
    INSERT INTO milestones VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(id, req.params.projectId, title, due_date, completed, completed_date, notes);

  res.status(201).json(db.prepare('SELECT * FROM milestones WHERE id = ?').get(id));
});

router.put('/:projectId/milestones/:milestoneId', (req, res) => {
  const db = getDb();
  const fields = ['title', 'due_date', 'completed', 'completed_date', 'notes'];
  const updates = fields.filter(f => req.body[f] !== undefined).map(f => `${f} = ?`).join(', ');
  const values = fields.filter(f => req.body[f] !== undefined).map(f => req.body[f]);

  if (updates) {
    db.prepare(`UPDATE milestones SET ${updates} WHERE id = ? AND project_id = ?`).run(
      ...values, req.params.milestoneId, req.params.projectId
    );
  }

  res.json(db.prepare('SELECT * FROM milestones WHERE id = ?').get(req.params.milestoneId));
});

router.delete('/:projectId/milestones/:milestoneId', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM milestones WHERE id = ? AND project_id = ?').run(
    req.params.milestoneId, req.params.projectId
  );
  res.json({ success: true });
});

export default router;
