import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import sql from '../db/connection';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

// GET /api/projects/:projectId/loans
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const loans = await sql`
      SELECT l.* FROM loans l
      JOIN projects p ON l.project_id = p.id
      WHERE l.project_id = ${req.params.projectId} AND p.user_id = ${req.userId}
      ORDER BY l.created_at DESC
    `;
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

// POST /api/projects/:projectId/loans
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    // verify project ownership
    const proj = await sql`SELECT id FROM projects WHERE id = ${req.params.projectId} AND user_id = ${req.userId}`;
    if (!proj[0]) return res.status(403).json({ error: 'Project not found' });

    const {
      lender, loan_amount = 0, interest_rate = 0, points = 0,
      term_months = 12, monthly_payment = 0,
      origination_date = '', maturity_date = '', notes = '',
    } = req.body;

    if (!lender) return res.status(400).json({ error: 'Lender name is required' });

    const id = uuid();
    const [loan] = await sql`
      INSERT INTO loans (id, project_id, lender, loan_amount, interest_rate, points, term_months, monthly_payment, origination_date, maturity_date, notes)
      VALUES (${id}, ${req.params.projectId}, ${lender}, ${loan_amount}, ${interest_rate}, ${points}, ${term_months}, ${monthly_payment}, ${origination_date}, ${maturity_date}, ${notes})
      RETURNING *
    `;
    res.status(201).json(loan);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create loan' });
  }
});

// PUT /api/projects/:projectId/loans/:loanId
router.put('/:loanId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await sql`
      SELECT l.* FROM loans l
      JOIN projects p ON l.project_id = p.id
      WHERE l.id = ${req.params.loanId} AND p.user_id = ${req.userId}
    `;
    const e = rows[0] as any;
    if (!e) return res.status(404).json({ error: 'Loan not found' });

    const b = req.body;
    const [updated] = await sql`
      UPDATE loans SET
        lender = ${b.lender ?? e.lender},
        loan_amount = ${b.loan_amount ?? e.loan_amount},
        interest_rate = ${b.interest_rate ?? e.interest_rate},
        points = ${b.points ?? e.points},
        term_months = ${b.term_months ?? e.term_months},
        monthly_payment = ${b.monthly_payment ?? e.monthly_payment},
        origination_date = ${b.origination_date ?? e.origination_date},
        maturity_date = ${b.maturity_date ?? e.maturity_date},
        notes = ${b.notes ?? e.notes}
      WHERE id = ${req.params.loanId}
      RETURNING *
    `;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update loan' });
  }
});

// DELETE /api/projects/:projectId/loans/:loanId
router.delete('/:loanId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await sql`
      DELETE FROM loans WHERE id = ${req.params.loanId}
      AND project_id IN (SELECT id FROM projects WHERE user_id = ${req.userId})
    `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete loan' });
  }
});

export default router;
