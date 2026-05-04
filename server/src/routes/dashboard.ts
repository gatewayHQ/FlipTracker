import { Router } from 'express';
import { getDb } from '../db/connection';

const router = Router();

router.get('/', (_req, res) => {
  const db = getDb();

  const projects = db.prepare('SELECT * FROM projects').all() as any[];

  const total = projects.length;
  const active = projects.filter(p => ['acquired', 'renovation', 'listed'].includes(p.status));

  const capitalDeployed = active.reduce((sum, p) => {
    return sum + p.purchase_price + p.legal_fees + p.inspection_cost + p.closing_costs
      + p.labor_cost + p.materials_cost;
  }, 0);

  const estTotalProfit = projects
    .filter(p => p.status !== 'cancelled')
    .reduce((sum, p) => {
      const totalCost = p.purchase_price + p.legal_fees + p.inspection_cost + p.closing_costs
        + p.rehab_budget + (p.holding_costs_monthly * 6);
      const salePrice = p.actual_sale_price > 0 ? p.actual_sale_price : p.estimated_sale_price;
      return sum + (salePrice - totalCost);
    }, 0);

  const soldProjects = projects.filter(p => p.status === 'sold' && p.acquisition_date && p.sold_date);
  let avgDaysToFlip = 0;
  if (soldProjects.length > 0) {
    const totalDays = soldProjects.reduce((sum, p) => {
      const acq = new Date(p.acquisition_date).getTime();
      const sold = new Date(p.sold_date).getTime();
      return sum + Math.round((sold - acq) / (1000 * 60 * 60 * 24));
    }, 0);
    avgDaysToFlip = Math.round(totalDays / soldProjects.length);
  } else {
    avgDaysToFlip = 42;
  }

  const recentProjects = projects
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map(p => {
      const phases = db.prepare('SELECT * FROM renovation_phases WHERE project_id = ?').all(p.id) as any[];
      const completedPhases = phases.filter(ph => ph.status === 'completed').length;
      const progress = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;
      return { ...p, phase_count: phases.length, completed_phases: completedPhases, progress };
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
  });
});

export default router;
