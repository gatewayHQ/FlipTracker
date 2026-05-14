import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import sql from '../db/connection';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const docs = await sql`
      SELECT d.* FROM documents d
      JOIN projects p ON d.project_id = p.id
      WHERE d.project_id = ${req.params.projectId} AND p.user_id = ${req.userId}
      ORDER BY d.created_at DESC
    `;
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const proj = await sql`SELECT id FROM projects WHERE id = ${req.params.projectId} AND user_id = ${req.userId}`;
    if (!proj[0]) return res.status(403).json({ error: 'Project not found' });

    const { name, type = '', url = '', notes = '' } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Document name required' });

    const [doc] = await sql`
      INSERT INTO documents (id, project_id, name, type, url)
      VALUES (${uuid()}, ${req.params.projectId}, ${name.trim()}, ${type}, ${url})
      RETURNING *
    `;
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create document' });
  }
});

router.delete('/:docId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await sql`
      DELETE FROM documents WHERE id = ${req.params.docId}
      AND project_id IN (SELECT id FROM projects WHERE user_id = ${req.userId})
    `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
