import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import sql from '../db/connection';

const router = Router();

router.get('/:projectId/milestones', async (req, res) => {
  try {
    res.json(await sql`SELECT * FROM milestones WHERE project_id = ${req.params.projectId} ORDER BY due_date`);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch milestones' });
  }
});

router.post('/:projectId/milestones', async (req, res) => {
  try {
    const id = uuid();
    const { title, due_date = '', completed = 0, completed_date = '', notes = '' } = req.body;
    const [milestone] = await sql`
      INSERT INTO milestones (id, project_id, title, due_date, completed, completed_date, notes)
      VALUES (${id}, ${req.params.projectId}, ${title}, ${due_date}, ${completed}, ${completed_date}, ${notes})
      RETURNING *
    `;
    res.status(201).json(milestone);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create milestone' });
  }
});

router.put('/:projectId/milestones/:milestoneId', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM milestones WHERE id = ${req.params.milestoneId} AND project_id = ${req.params.projectId}`;
    const e = rows[0] as any;
    if (!e) return res.status(404).json({ error: 'Milestone not found' });
    const b = req.body;
    const [updated] = await sql`
      UPDATE milestones SET
        title = ${b.title ?? e.title},
        due_date = ${b.due_date ?? e.due_date},
        completed = ${b.completed ?? e.completed},
        completed_date = ${b.completed_date ?? e.completed_date},
        notes = ${b.notes ?? e.notes}
      WHERE id = ${req.params.milestoneId} AND project_id = ${req.params.projectId}
      RETURNING *
    `;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

router.delete('/:projectId/milestones/:milestoneId', async (req, res) => {
  try {
    await sql`DELETE FROM milestones WHERE id = ${req.params.milestoneId} AND project_id = ${req.params.projectId}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete milestone' });
  }
});

export default router;
