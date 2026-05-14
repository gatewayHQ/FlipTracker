import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import sql from '../db/connection';

const router = Router();

router.get('/:projectId/phases', async (req, res) => {
  try {
    res.json(await sql`SELECT * FROM renovation_phases WHERE project_id = ${req.params.projectId} ORDER BY created_at`);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch phases' });
  }
});

router.post('/:projectId/phases', async (req, res) => {
  try {
    const id = uuid();
    const { phase_name, status = 'pending', budget = 0, actual_cost = 0, start_date = '', target_date = '', end_date = '', notes = '' } = req.body;
    const [phase] = await sql`
      INSERT INTO renovation_phases (id, project_id, phase_name, status, budget, actual_cost, start_date, target_date, end_date, notes)
      VALUES (${id}, ${req.params.projectId}, ${phase_name}, ${status}, ${budget}, ${actual_cost}, ${start_date}, ${target_date}, ${end_date}, ${notes})
      RETURNING *
    `;
    res.status(201).json(phase);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create phase' });
  }
});

router.put('/:projectId/phases/:phaseId', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM renovation_phases WHERE id = ${req.params.phaseId} AND project_id = ${req.params.projectId}`;
    const e = rows[0] as any;
    if (!e) return res.status(404).json({ error: 'Phase not found' });
    const b = req.body;
    const [updated] = await sql`
      UPDATE renovation_phases SET
        phase_name = ${b.phase_name ?? e.phase_name},
        status = ${b.status ?? e.status},
        budget = ${b.budget ?? e.budget},
        actual_cost = ${b.actual_cost ?? e.actual_cost},
        start_date = ${b.start_date ?? e.start_date},
        target_date = ${b.target_date ?? e.target_date},
        end_date = ${b.end_date ?? e.end_date},
        notes = ${b.notes ?? e.notes}
      WHERE id = ${req.params.phaseId} AND project_id = ${req.params.projectId}
      RETURNING *
    `;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update phase' });
  }
});

router.delete('/:projectId/phases/:phaseId', async (req, res) => {
  try {
    await sql`DELETE FROM renovation_phases WHERE id = ${req.params.phaseId} AND project_id = ${req.params.projectId}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete phase' });
  }
});

export default router;
