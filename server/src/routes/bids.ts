import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import sql from '../db/connection';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  try {
    const bids = await sql`
      SELECT b.*, v.name as vendor_name, v.company, v.specialty, v.phone
      FROM bids b
      LEFT JOIN vendors v ON b.vendor_id = v.id
      WHERE b.project_id = ${(req.params as any).projectId}
      ORDER BY b.created_at DESC
    `;
    res.json(bids);
  } catch {
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { vendor_id, phase_name = '', scope_description = '', amount = 0, submitted_date = '', status = 'pending', notes = '' } = req.body;
    const id = uuid();
    const [bid] = await sql`
      INSERT INTO bids (id, project_id, vendor_id, phase_name, scope_description, amount, submitted_date, status, notes)
      VALUES (${id}, ${(req.params as any).projectId}, ${vendor_id}, ${phase_name}, ${scope_description}, ${amount}, ${submitted_date}, ${status}, ${notes})
      RETURNING *
    `;
    res.status(201).json(bid);
  } catch {
    res.status(500).json({ error: 'Failed to create bid' });
  }
});

router.put('/:bidId', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM bids WHERE id = ${req.params.bidId}`;
    const e = rows[0] as any;
    if (!e) return res.status(404).json({ error: 'Bid not found' });
    const b = req.body;
    const [updated] = await sql`
      UPDATE bids SET
        vendor_id = ${b.vendor_id ?? e.vendor_id},
        phase_name = ${b.phase_name ?? e.phase_name},
        scope_description = ${b.scope_description ?? e.scope_description},
        amount = ${b.amount ?? e.amount},
        submitted_date = ${b.submitted_date ?? e.submitted_date},
        status = ${b.status ?? e.status},
        notes = ${b.notes ?? e.notes}
      WHERE id = ${req.params.bidId}
      RETURNING *
    `;
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update bid' });
  }
});

router.delete('/:bidId', async (req, res) => {
  try {
    await sql`DELETE FROM bids WHERE id = ${req.params.bidId}`;
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete bid' });
  }
});

router.put('/:bidId/approve', async (req, res) => {
  try {
    const rows = await sql`UPDATE bids SET status = 'approved' WHERE id = ${req.params.bidId} RETURNING *`;
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to approve bid' });
  }
});

router.put('/:bidId/reject', async (req, res) => {
  try {
    const rows = await sql`UPDATE bids SET status = 'rejected' WHERE id = ${req.params.bidId} RETURNING *`;
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to reject bid' });
  }
});

export default router;
