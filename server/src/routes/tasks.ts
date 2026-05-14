import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import sql from '../db/connection';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await sql`
      SELECT t.* FROM phase_tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.phase_id = ${req.params.phaseId}
        AND t.project_id = ${req.params.projectId}
        AND p.user_id = ${req.userId}
      ORDER BY t.sort_order, t.created_at
    `;
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const proj = await sql`SELECT id FROM projects WHERE id = ${req.params.projectId} AND user_id = ${req.userId}`;
    if (!proj[0]) return res.status(403).json({ error: 'Project not found' });

    const { title, sort_order = 0 } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title required' });

    const [task] = await sql`
      INSERT INTO phase_tasks (id, phase_id, project_id, title, sort_order)
      VALUES (${uuid()}, ${req.params.phaseId}, ${req.params.projectId}, ${title.trim()}, ${sort_order})
      RETURNING *
    `;
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/:taskId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await sql`
      SELECT t.* FROM phase_tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ${req.params.taskId} AND p.user_id = ${req.userId}
    `;
    const e = rows[0] as any;
    if (!e) return res.status(404).json({ error: 'Task not found' });

    const b = req.body;
    const [updated] = await sql`
      UPDATE phase_tasks SET
        title = ${b.title ?? e.title},
        completed = ${b.completed ?? e.completed},
        sort_order = ${b.sort_order ?? e.sort_order}
      WHERE id = ${req.params.taskId}
      RETURNING *
    `;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:taskId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await sql`
      DELETE FROM phase_tasks WHERE id = ${req.params.taskId}
      AND project_id IN (SELECT id FROM projects WHERE user_id = ${req.userId})
    `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
