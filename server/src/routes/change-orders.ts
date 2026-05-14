import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import sql from '../db/connection';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  try {
    const cos = await sql`
      SELECT co.*, v.name as vendor_name, v.company
      FROM change_orders co
      LEFT JOIN vendors v ON co.vendor_id = v.id
      WHERE co.project_id = ${(req.params as any).projectId}
      ORDER BY co.created_at DESC
    `;
    res.json(cos);
  } catch {
    res.status(500).json({ error: 'Failed to fetch change orders' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { vendor_id, phase_name = '', description = '', amount = 0, submitted_date = '', approved_date = '', status = 'pending' } = req.body;
    const id = uuid();
    const [co] = await sql`
      INSERT INTO change_orders (id, project_id, vendor_id, phase_name, description, amount, submitted_date, approved_date, status)
      VALUES (${id}, ${(req.params as any).projectId}, ${vendor_id}, ${phase_name}, ${description}, ${amount}, ${submitted_date}, ${approved_date}, ${status})
      RETURNING *
    `;
    res.status(201).json(co);
  } catch {
    res.status(500).json({ error: 'Failed to create change order' });
  }
});

router.put('/:coId', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM change_orders WHERE id = ${req.params.coId}`;
    const e = rows[0] as any;
    if (!e) return res.status(404).json({ error: 'Change order not found' });
    const b = req.body;
    const [updated] = await sql`
      UPDATE change_orders SET
        vendor_id = ${b.vendor_id ?? e.vendor_id},
        phase_name = ${b.phase_name ?? e.phase_name},
        description = ${b.description ?? e.description},
        amount = ${b.amount ?? e.amount},
        submitted_date = ${b.submitted_date ?? e.submitted_date},
        approved_date = ${b.approved_date ?? e.approved_date},
        status = ${b.status ?? e.status}
      WHERE id = ${req.params.coId}
      RETURNING *
    `;
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update change order' });
  }
});

router.delete('/:coId', async (req, res) => {
  try {
    await sql`DELETE FROM change_orders WHERE id = ${req.params.coId}`;
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete change order' });
  }
});

router.put('/:coId/approve', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await sql`
      UPDATE change_orders SET status = 'approved', approved_date = ${today}
      WHERE id = ${req.params.coId} RETURNING *
    `;
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to approve change order' });
  }
});

router.put('/:coId/reject', async (req, res) => {
  try {
    const rows = await sql`UPDATE change_orders SET status = 'rejected' WHERE id = ${req.params.coId} RETURNING *`;
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to reject change order' });
  }
});

export default router;
