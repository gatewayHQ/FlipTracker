import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import sql from '../db/connection';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  console.log('[projects list] userId:', req.userId);
  try {
    const projects = await sql`SELECT * FROM projects WHERE user_id = ${req.userId} ORDER BY created_at DESC`;
    console.log('[projects list] found:', projects.length);
    const projectIds = projects.map((p: any) => p.id);
    const allPhases = projectIds.length > 0
      ? await sql`SELECT project_id, status FROM renovation_phases WHERE project_id IN ${sql(projectIds)}`
      : [];
    const enriched = projects.map((p: any) => {
      const phases = allPhases.filter((ph: any) => ph.project_id === p.id);
      const completedPhases = phases.filter((ph: any) => ph.status === 'completed').length;
      const progress = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;
      const totalInvestment = Number(p.purchase_price) + Number(p.legal_fees) + Number(p.inspection_cost) + Number(p.closing_costs);
      const rehabSpent = Number(p.labor_cost) + Number(p.materials_cost);
      const holdingTotal = Number(p.holding_costs_monthly) * 6;
      const salePrice = Number(p.actual_sale_price) > 0 ? Number(p.actual_sale_price) : Number(p.estimated_sale_price);
      const estProfit = salePrice - totalInvestment - rehabSpent - holdingTotal;
      return { ...p, phase_count: phases.length, completed_phases: completedPhases, progress, total_investment: totalInvestment, est_profit: estProfit };
    });
    res.json(enriched);
  } catch (err: any) {
    console.error('[projects list]', err);
    res.status(500).json({ error: 'Failed to fetch projects', detail: err?.message });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  console.log('[projects create] userId:', req.userId, 'address:', req.body?.address);
  try {
    const id = uuid();
    const {
      name, address, city, state, zip = '', status = 'acquired',
      purchase_price = 0, legal_fees = 0, inspection_cost = 0, closing_costs = 0,
      rehab_budget = 0, labor_cost = 0, materials_cost = 0, holding_costs_monthly = 0,
      estimated_sale_price = 0, actual_sale_price = 0,
      acquisition_date = '', target_completion_date = '', actual_completion_date = '',
      listed_date = '', sold_date = '', notes = '', phases = [],
    } = req.body;

    const [project] = await sql`
      INSERT INTO projects (id, user_id, name, address, city, state, zip, status, purchase_price, legal_fees, inspection_cost, closing_costs, rehab_budget, labor_cost, materials_cost, holding_costs_monthly, estimated_sale_price, actual_sale_price, acquisition_date, target_completion_date, actual_completion_date, listed_date, sold_date, notes)
      VALUES (${id}, ${req.userId}, ${name}, ${address}, ${city}, ${state}, ${zip}, ${status}, ${purchase_price}, ${legal_fees}, ${inspection_cost}, ${closing_costs}, ${rehab_budget}, ${labor_cost}, ${materials_cost}, ${holding_costs_monthly}, ${estimated_sale_price}, ${actual_sale_price}, ${acquisition_date}, ${target_completion_date}, ${actual_completion_date}, ${listed_date}, ${sold_date}, ${notes})
      RETURNING *
    `;
    await Promise.all(
      (phases as string[]).map(phaseName =>
        sql`INSERT INTO renovation_phases (id, project_id, phase_name) VALUES (${uuid()}, ${id}, ${phaseName})`
      )
    );
    console.log('[projects create] success id:', project?.id, 'user_id:', project?.user_id);
    res.status(201).json(project);
  } catch (err: any) {
    console.error('[projects create]', err);
    res.status(500).json({ error: 'Failed to create project', detail: err?.message });
  }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await sql`SELECT * FROM projects WHERE id = ${req.params.id} AND user_id = ${req.userId}`;
    const project = rows[0] as any;
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const [phases, expenses, milestones, projectVendors, loans, comps, notes, documents] = await Promise.all([
      sql`SELECT * FROM renovation_phases WHERE project_id = ${req.params.id} ORDER BY created_at`,
      sql`SELECT * FROM expenses WHERE project_id = ${req.params.id} ORDER BY date DESC`,
      sql`SELECT * FROM milestones WHERE project_id = ${req.params.id} ORDER BY due_date`,
      sql`SELECT pv.*, v.name as vendor_name, v.company, v.phone, v.email, v.specialty, v.rating FROM project_vendors pv JOIN vendors v ON pv.vendor_id = v.id WHERE pv.project_id = ${req.params.id}`,
      sql`SELECT * FROM loans WHERE project_id = ${req.params.id} ORDER BY created_at DESC`,
      sql`SELECT * FROM comps WHERE project_id = ${req.params.id} ORDER BY created_at DESC`,
      sql`SELECT * FROM project_notes WHERE project_id = ${req.params.id} ORDER BY created_at DESC`,
      sql`SELECT * FROM documents WHERE project_id = ${req.params.id} ORDER BY created_at DESC`,
    ]);

    // Fetch tasks for each phase
    const phaseIds = phases.map((ph: any) => ph.id);
    const allTasks = phaseIds.length > 0
      ? await sql`SELECT * FROM phase_tasks WHERE phase_id IN ${sql(phaseIds)} ORDER BY sort_order, created_at`
      : [];
    const phasesWithTasks = phases.map((ph: any) => ({
      ...ph,
      tasks: (allTasks as any[]).filter(t => t.phase_id === ph.id),
    }));

    const totalInvestment = Number(project.purchase_price) + Number(project.legal_fees) + Number(project.inspection_cost) + Number(project.closing_costs);
    const totalExpenses = Number(project.labor_cost) + Number(project.materials_cost);
    const holdingTotal = Number(project.holding_costs_monthly) * 6;
    const salePrice = Number(project.actual_sale_price) > 0 ? Number(project.actual_sale_price) : Number(project.estimated_sale_price);
    const estProfit = salePrice - totalInvestment - totalExpenses - holdingTotal;
    const roi = (totalInvestment + totalExpenses + holdingTotal) > 0
      ? ((estProfit / (totalInvestment + totalExpenses + holdingTotal)) * 100)
      : 0;

    res.json({
      ...project,
      phases: phasesWithTasks,
      expenses,
      milestones,
      vendors: projectVendors,
      loans,
      comps,
      notes,
      documents,
      computed: { totalInvestment, totalExpenses, holdingTotal, estProfit, roi: Math.round(roi * 10) / 10 },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await sql`SELECT * FROM projects WHERE id = ${req.params.id} AND user_id = ${req.userId}`;
    const e = rows[0] as any;
    if (!e) return res.status(404).json({ error: 'Project not found' });
    const b = req.body;

    const [updated] = await sql`
      UPDATE projects SET
        name = ${b.name ?? e.name},
        address = ${b.address ?? e.address},
        city = ${b.city ?? e.city},
        state = ${b.state ?? e.state},
        zip = ${b.zip ?? e.zip},
        status = ${b.status ?? e.status},
        purchase_price = ${b.purchase_price ?? e.purchase_price},
        legal_fees = ${b.legal_fees ?? e.legal_fees},
        inspection_cost = ${b.inspection_cost ?? e.inspection_cost},
        closing_costs = ${b.closing_costs ?? e.closing_costs},
        rehab_budget = ${b.rehab_budget ?? e.rehab_budget},
        labor_cost = ${b.labor_cost ?? e.labor_cost},
        materials_cost = ${b.materials_cost ?? e.materials_cost},
        holding_costs_monthly = ${b.holding_costs_monthly ?? e.holding_costs_monthly},
        estimated_sale_price = ${b.estimated_sale_price ?? e.estimated_sale_price},
        actual_sale_price = ${b.actual_sale_price ?? e.actual_sale_price},
        acquisition_date = ${b.acquisition_date ?? e.acquisition_date},
        target_completion_date = ${b.target_completion_date ?? e.target_completion_date},
        actual_completion_date = ${b.actual_completion_date ?? e.actual_completion_date},
        listed_date = ${b.listed_date ?? e.listed_date},
        sold_date = ${b.sold_date ?? e.sold_date},
        notes = ${b.notes ?? e.notes},
        updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await sql`DELETE FROM projects WHERE id = ${req.params.id} AND user_id = ${req.userId} RETURNING id`;
    if (!rows[0]) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
