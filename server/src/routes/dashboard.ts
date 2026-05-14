import { Router } from 'express';
import sql from '../db/connection';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const projects = await sql`SELECT * FROM projects`;

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
          + Number(p.closing_costs) + Number(p.rehab_budget) + (Number(p.holding_costs_monthly) * 6);
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
      avgDaysToFlip = 42;
    }

    const recentProjectIds = [...projects]
      .sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime())
      .slice(0, 5)
      .map(p => p.id);

    const recentProjects = await Promise.all(
      recentProjectIds.map(async (id) => {
        const p = projects.find(pr => pr.id === id)!;
        const phases = await sql`SELECT status FROM renovation_phases WHERE project_id = ${id}`;
        const completedPhases = phases.filter(ph => ph.status === 'completed').length;
        const progress = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;
        return { ...p, phase_count: phases.length, completed_phases: completedPhases, progress };
      })
    );

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
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
