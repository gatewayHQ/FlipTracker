import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import sql from '../db/connection';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const comps = await sql`
      SELECT c.* FROM comps c
      JOIN projects p ON c.project_id = p.id
      WHERE c.project_id = ${req.params.projectId} AND p.user_id = ${req.userId}
      ORDER BY c.created_at DESC
    `;
    res.json(comps);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comps' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const proj = await sql`SELECT id FROM projects WHERE id = ${req.params.projectId} AND user_id = ${req.userId}`;
    if (!proj[0]) return res.status(403).json({ error: 'Project not found' });

    const { address, sale_price = 0, sqft = 0, beds = 0, baths = 0, sale_date = '', source = '', notes = '' } = req.body;
    if (!address?.trim()) return res.status(400).json({ error: 'Address required' });

    const [comp] = await sql`
      INSERT INTO comps (id, project_id, address, sale_price, sqft, beds, baths, sale_date, source, notes)
      VALUES (${uuid()}, ${req.params.projectId}, ${address.trim()}, ${sale_price}, ${sqft}, ${beds}, ${baths}, ${sale_date}, ${source}, ${notes})
      RETURNING *
    `;
    res.status(201).json(comp);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create comp' });
  }
});

router.delete('/:compId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await sql`
      DELETE FROM comps WHERE id = ${req.params.compId}
      AND project_id IN (SELECT id FROM projects WHERE user_id = ${req.userId})
    `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comp' });
  }
});

export default router;
