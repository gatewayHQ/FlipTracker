import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import sql from '../db/connection';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/:projectId/expenses', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    res.json(await sql`SELECT * FROM expenses WHERE project_id = ${req.params.projectId} ORDER BY date DESC`);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.post('/:projectId/expenses', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = uuid();
    const { category, description, amount, date, vendor_id = '', notes = '' } = req.body;
    const [expense] = await sql`
      INSERT INTO expenses (id, project_id, category, description, amount, date, vendor_id, notes)
      VALUES (${id}, ${req.params.projectId}, ${category}, ${description}, ${amount}, ${date}, ${vendor_id}, ${notes})
      RETURNING *
    `;
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.put('/:projectId/expenses/:expenseId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await sql`SELECT * FROM expenses WHERE id = ${req.params.expenseId} AND project_id = ${req.params.projectId}`;
    const e = rows[0] as any;
    if (!e) return res.status(404).json({ error: 'Expense not found' });
    const b = req.body;
    const [updated] = await sql`
      UPDATE expenses SET
        category = ${b.category ?? e.category},
        description = ${b.description ?? e.description},
        amount = ${b.amount ?? e.amount},
        date = ${b.date ?? e.date},
        vendor_id = ${b.vendor_id ?? e.vendor_id},
        notes = ${b.notes ?? e.notes}
      WHERE id = ${req.params.expenseId} AND project_id = ${req.params.projectId}
      RETURNING *
    `;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

router.delete('/:projectId/expenses/:expenseId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await sql`DELETE FROM expenses WHERE id = ${req.params.expenseId} AND project_id = ${req.params.projectId}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
