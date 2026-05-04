import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection';

const router = Router();

router.get('/', (_req, res) => {
  const db = getDb();
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as any[];

  const enriched = projects.map(p => {
    const phases = db.prepare('SELECT * FROM renovation_phases WHERE project_id = ?').all(p.id) as any[];
    const completedPhases = phases.filter((ph: any) => ph.status === 'completed').length;
    const progress = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;
    const totalInvestment = p.purchase_price + p.legal_fees + p.inspection_cost + p.closing_costs;
    const totalExpenses = p.labor_cost + p.materials_cost + (p.holding_costs_monthly * 6);
    const salePrice = p.actual_sale_price > 0 ? p.actual_sale_price : p.estimated_sale_price;
    const estProfit = salePrice - totalInvestment - totalExpenses - p.rehab_budget;
    return { ...p, phase_count: phases.length, completed_phases: completedPhases, progress, total_investment: totalInvestment, est_profit: estProfit };
  });

  res.json(enriched);
});

router.post('/', (req, res) => {
  const db = getDb();
  const id = uuid();
  const {
    name, address, city, state, zip = '', status = 'acquired',
    purchase_price = 0, legal_fees = 0, inspection_cost = 0, closing_costs = 0,
    rehab_budget = 0, labor_cost = 0, materials_cost = 0, holding_costs_monthly = 0,
    estimated_sale_price = 0, actual_sale_price = 0,
    acquisition_date = '', target_completion_date = '', actual_completion_date = '',
    listed_date = '', sold_date = '', notes = '',
    phases = [],
  } = req.body;

  db.prepare(`
    INSERT INTO projects VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?, ?,
      ?, datetime('now'), datetime('now')
    )
  `).run(
    id, name, address, city, state, zip, status,
    purchase_price, legal_fees, inspection_cost, closing_costs,
    rehab_budget, labor_cost, materials_cost, holding_costs_monthly,
    estimated_sale_price, actual_sale_price,
    acquisition_date, target_completion_date, actual_completion_date, listed_date, sold_date,
    notes
  );

  for (const phaseName of phases as string[]) {
    db.prepare(`INSERT INTO renovation_phases VALUES (?, ?, ?, 'pending', 0, 0, '', '', '', '', datetime('now'))`).run(
      uuid(), id, phaseName
    );
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json(project);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as any;
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const phases = db.prepare('SELECT * FROM renovation_phases WHERE project_id = ? ORDER BY created_at').all(req.params.id);
  const expenses = db.prepare('SELECT * FROM expenses WHERE project_id = ? ORDER BY date DESC').all(req.params.id);
  const milestones = db.prepare('SELECT * FROM milestones WHERE project_id = ? ORDER BY due_date').all(req.params.id);
  const projectVendors = db.prepare(`
    SELECT pv.*, v.name as vendor_name, v.company, v.phone, v.email, v.specialty, v.rating
    FROM project_vendors pv
    JOIN vendors v ON pv.vendor_id = v.id
    WHERE pv.project_id = ?
  `).all(req.params.id);

  const totalInvestment = project.purchase_price + project.legal_fees + project.inspection_cost + project.closing_costs;
  const totalExpenses = project.labor_cost + project.materials_cost;
  const holdingTotal = project.holding_costs_monthly * 6;
  const salePrice = project.actual_sale_price > 0 ? project.actual_sale_price : project.estimated_sale_price;
  const estProfit = salePrice - totalInvestment - totalExpenses - holdingTotal;
  const roi = totalInvestment > 0 ? ((estProfit / (totalInvestment + totalExpenses + holdingTotal)) * 100) : 0;

  res.json({
    ...project,
    phases,
    expenses,
    milestones,
    vendors: projectVendors,
    computed: { totalInvestment, totalExpenses, holdingTotal, estProfit, roi: Math.round(roi * 10) / 10 },
  });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const fields = [
    'name', 'address', 'city', 'state', 'zip', 'status',
    'purchase_price', 'legal_fees', 'inspection_cost', 'closing_costs',
    'rehab_budget', 'labor_cost', 'materials_cost', 'holding_costs_monthly',
    'estimated_sale_price', 'actual_sale_price',
    'acquisition_date', 'target_completion_date', 'actual_completion_date',
    'listed_date', 'sold_date', 'notes',
  ];

  const updates = fields
    .filter(f => req.body[f] !== undefined)
    .map(f => `${f} = ?`)
    .join(', ');

  const values = fields
    .filter(f => req.body[f] !== undefined)
    .map(f => req.body[f]);

  if (updates.length > 0) {
    db.prepare(`UPDATE projects SET ${updates}, updated_at = datetime('now') WHERE id = ?`).run(
      ...values, req.params.id
    );
  }

  res.json(db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
