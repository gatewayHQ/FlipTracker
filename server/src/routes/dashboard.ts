import { Router, Response } from 'express';
import sql from '../db/connection';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  console.log('[dashboard] userId:', req.userId);
  try {
    const projects = await sql`SELECT * FROM projects WHERE user_id = ${req.userId}`;
    console.log('[dashboard] projects:', projects.length);

    const total = projects.length;
    const active = projects.filter(p => ['acquired', 'renovation', 'listed'].includes(p.status as string));

    const capitalDeployed = active.reduce((sum, p) => {
      return sum + Number(p.purchase_price) + Number(p.legal_fees) + Number(p.inspection_cost)
        + Number(p.closing_costs) + Number(p.labor_cost) + Number(p.materials_cost);
    }, 0);

    const estTotalProfit = projects
      .filter(p => p.status !== 'cancelled')
      .reduce((sum, p) => {
        const totalCost = Number(p.purchase_price) + Number(p.legal_fees) + Number(p.inspection_cost)
          + Number(p.closing_costs) + Number(p.labor_cost) + Number(p.materials_cost) + (Number(p.holding_costs_monthly) * 6);
        const salePrice = Number(p.actual_sale_price) > 0 ? Number(p.actual_sale_price) : Number(p.estimated_sale_price);
        return sum + (salePrice - totalCost);
      }, 0);

    const soldProjects = projects.filter(p => p.status === 'sold' && p.acquisition_date && p.sold_date);
    let avgDaysToFlip = 0;
    if (soldProjects.length > 0) {
      const totalDays = soldProjects.reduce((sum, p) => {
        const acq = new Date(p.acquisition_date as string).getTime();
        const sold = new Date(p.sold_date as string).getTime();
        return sum + Math.round((sold - acq) / (1000 * 60 * 60 * 24));
      }, 0);
      avgDaysToFlip = Math.round(totalDays / soldProjects.length);
    } else {
      avgDaysToFlip = 0;
    }

    const today = new Date().toISOString().slice(0, 10);
    // Fetch without LIMIT so health computation sees all overdue milestones, not just UI top-5
    const allOverdue = await sql`
      SELECT m.id, m.title, m.due_date, m.project_id, p.name as project_name, p.address
      FROM milestones m
      JOIN projects p ON m.project_id = p.id
      WHERE p.user_id = ${req.userId}
        AND m.completed = 0
        AND m.due_date != ''
        AND m.due_date < ${today}
      ORDER BY m.due_date ASC
    `;
    const overdueMilestones = (allOverdue as any[]).slice(0, 5);

    const recentProjectIds = [...projects]
      .sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime())
      .filter(p => ['acquired', 'renovation', 'listed'].includes(p.status as string))
      .slice(0, 5)
      .map(p => p.id);

    const allRecentPhases = recentProjectIds.length > 0
      ? await sql`SELECT project_id, status FROM renovation_phases WHERE project_id = ANY(${recentProjectIds as any})`
      : [];

    const recentProjects = recentProjectIds.map((id) => {
      const p = projects.find(pr => pr.id === id)!;
      const phases = allRecentPhases.filter(ph => ph.project_id === id);
      const completedPhases = phases.filter(ph => ph.status === 'completed').length;
      const progress = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;

      const rehabSpent = Number(p.labor_cost) + Number(p.materials_cost);
      const budget = Number(p.rehab_budget);
      const hasOverdue = (allOverdue as any[]).some((m: any) => m.project_id === id);
      const isOverBudget = budget > 0 && rehabSpent > budget;
      const isAtRisk = budget > 0 && rehabSpent / budget > 0.9;
      const health = isOverBudget || hasOverdue ? 'over_budget' : isAtRisk ? 'at_risk' : 'on_track';

      return { ...p, phase_count: phases.length, completed_phases: completedPhases, progress, health };
    });

    res.json({
      stats: {
        totalProjects: total,
        capitalDeployed,
        estTotalProfit,
        avgDaysToFlip,
        activeProjects: active.length,
        soldProjects: projects.filter(p => p.status === 'sold').length,
      },
      recentProjects,
      overdueMilestones,
    });
  } catch (err: any) {
    console.error('[dashboard]', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data', detail: err?.message });
  }
});

export default router;
