import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import sql from '../db/connection';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const notes = await sql`
      SELECT n.* FROM project_notes n
      JOIN projects p ON n.project_id = p.id
      WHERE n.project_id = ${req.params.projectId} AND p.user_id = ${req.userId}
      ORDER BY n.created_at DESC
    `;
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const proj = await sql`SELECT id FROM projects WHERE id = ${req.params.projectId} AND user_id = ${req.userId}`;
    if (!proj[0]) return res.status(403).json({ error: 'Project not found' });

    const { note } = req.body;
    if (!note?.trim()) return res.status(400).json({ error: 'Note text required' });

    const [created] = await sql`
      INSERT INTO project_notes (id, project_id, user_id, note)
      VALUES (${uuid()}, ${req.params.projectId}, ${req.userId}, ${note.trim()})
      RETURNING *
    `;
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

router.delete('/:noteId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await sql`
      DELETE FROM project_notes WHERE id = ${req.params.noteId}
      AND project_id IN (SELECT id FROM projects WHERE user_id = ${req.userId})
    `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
