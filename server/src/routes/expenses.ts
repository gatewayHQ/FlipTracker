import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection';

const router = Router();

router.get('/:projectId/expenses', (req, res) => {
  const db = getDb();
  const expenses = db.prepare(
    'SELECT * FROM expenses WHERE project_id = ? ORDER BY date DESC'
  ).all(req.params.projectId);
  res.json(expenses);
});

router.post('/:projectId/expenses', (req, res) => {
  const db = getDb();
  const id = uuid();
  const { category, description, amount, date, vendor_id = '', notes = '' } = req.body;

  db.prepare(`
    INSERT INTO expenses VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(id, req.params.projectId, category, description, amount, date, vendor_id, notes);

  res.status(201).json(db.prepare('SELECT * FROM expenses WHERE id = ?').get(id));
});

router.put('/:projectId/expenses/:expenseId', (req, res) => {
  const db = getDb();
  const fields = ['category', 'description', 'amount', 'date', 'vendor_id', 'notes'];
  const updates = fields.filter(f => req.body[f] !== undefined).map(f => `${f} = ?`).join(', ');
  const values = fields.filter(f => req.body[f] !== undefined).map(f => req.body[f]);

  if (updates) {
    db.prepare(`UPDATE expenses SET ${updates} WHERE id = ? AND project_id = ?`).run(
      ...values, req.params.expenseId, req.params.projectId
    );
  }

  res.json(db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.expenseId));
});

router.delete('/:projectId/expenses/:expenseId', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM expenses WHERE id = ? AND project_id = ?').run(
    req.params.expenseId, req.params.projectId
  );
  res.json({ success: true });
});

export default router;
