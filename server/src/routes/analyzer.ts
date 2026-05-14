import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import sql from '../db/connection';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/debug', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tableCheck = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('deal_analyses','users','projects')
    `;
    const allRows = await sql`SELECT id, user_id, name, created_at FROM deal_analyses ORDER BY created_at DESC LIMIT 20`;
    const userRows = await sql`SELECT id, user_id, name, created_at FROM deal_analyses WHERE user_id = ${req.userId}`;
    res.json({
      requestUserId: req.userId,
      tables: tableCheck.map((t: any) => t.table_name),
      totalRows: allRows.length,
      rowsForUser: userRows.length,
      allRows,
      userRows,
    });
  } catch (err: any) {
    console.error('[analyzer debug]', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const analyses = await sql`
      SELECT * FROM deal_analyses WHERE user_id = ${req.userId}
      ORDER BY created_at DESC
    `;
    res.json(analyses);
  } catch (err: any) {
    console.error('[analyzer list]', err);
    res.status(500).json({ error: 'Failed to fetch analyses', detail: err?.message });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name = '', address = '',
      purchase_price = 0, arv = 0, repair_cost = 0,
      holding_months = 6, holding_cost_monthly = 0,
      financing_cost = 0, agent_commission_pct = 6,
      closing_cost_pct = 2, notes = '',
    } = req.body;

    const [analysis] = await sql`
      INSERT INTO deal_analyses
        (id, user_id, name, address, purchase_price, arv, repair_cost,
         holding_months, holding_cost_monthly, financing_cost,
         agent_commission_pct, closing_cost_pct, notes)
      VALUES
        (${uuid()}, ${req.userId}, ${name}, ${address}, ${purchase_price}, ${arv}, ${repair_cost},
         ${holding_months}, ${holding_cost_monthly}, ${financing_cost},
         ${agent_commission_pct}, ${closing_cost_pct}, ${notes})
      RETURNING *
    `;
    res.status(201).json(analysis);
  } catch (err: any) {
    console.error('[analyzer create]', err);
    res.status(500).json({ error: 'Failed to save analysis', detail: err?.message });
  }
});

router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await sql`SELECT * FROM deal_analyses WHERE id = ${req.params.id} AND user_id = ${req.userId}`;
    const e = rows[0] as any;
    if (!e) return res.status(404).json({ error: 'Analysis not found' });

    const b = req.body;
    const [updated] = await sql`
      UPDATE deal_analyses SET
        name = ${b.name ?? e.name},
        address = ${b.address ?? e.address},
        purchase_price = ${b.purchase_price ?? e.purchase_price},
        arv = ${b.arv ?? e.arv},
        repair_cost = ${b.repair_cost ?? e.repair_cost},
        holding_months = ${b.holding_months ?? e.holding_months},
        holding_cost_monthly = ${b.holding_cost_monthly ?? e.holding_cost_monthly},
        financing_cost = ${b.financing_cost ?? e.financing_cost},
        agent_commission_pct = ${b.agent_commission_pct ?? e.agent_commission_pct},
        closing_cost_pct = ${b.closing_cost_pct ?? e.closing_cost_pct},
        notes = ${b.notes ?? e.notes}
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    res.json(updated);
  } catch (err: any) {
    console.error('[analyzer update]', err);
    res.status(500).json({ error: 'Failed to update analysis', detail: err?.message });
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await sql`DELETE FROM deal_analyses WHERE id = ${req.params.id} AND user_id = ${req.userId}`;
    res.json({ success: true });
  } catch (err: any) {
    console.error('[analyzer delete]', err);
    res.status(500).json({ error: 'Failed to delete analysis', detail: err?.message });
  }
});

export default router;
