import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import sql from '../db/connection';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    res.json(await sql`SELECT * FROM vendors ORDER BY name`);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

router.post('/', async (req, res) => {
  try {
    const id = uuid();
    const {
      name, company = '', phone = '', email = '', specialty = '', trade_category = '',
      rating = 0, hourly_rate = 0, notes = '',
      license_number = '', license_state = '', insurance_expiry = '',
      w9_status = 'missing', do_not_rehire = 0,
    } = req.body;
    const [vendor] = await sql`
      INSERT INTO vendors (id, name, company, phone, email, specialty, trade_category, rating, hourly_rate, notes, license_number, license_state, insurance_expiry, w9_status, do_not_rehire)
      VALUES (${id}, ${name}, ${company}, ${phone}, ${email}, ${specialty}, ${trade_category}, ${rating}, ${hourly_rate}, ${notes}, ${license_number}, ${license_state}, ${insurance_expiry}, ${w9_status}, ${do_not_rehire})
      RETURNING *
    `;
    res.status(201).json(vendor);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM vendors WHERE id = ${req.params.id}`;
    if (!rows[0]) return res.status(404).json({ error: 'Vendor not found' });
    const projects = await sql`
      SELECT pv.*, p.name as project_name, p.address, p.status as project_status
      FROM project_vendors pv JOIN projects p ON pv.project_id = p.id
      WHERE pv.vendor_id = ${req.params.id}
    `;
    res.json({ ...rows[0], projects });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM vendors WHERE id = ${req.params.id}`;
    const e = rows[0] as any;
    if (!e) return res.status(404).json({ error: 'Vendor not found' });
    const b = req.body;
    const [updated] = await sql`
      UPDATE vendors SET
        name = ${b.name ?? e.name},
        company = ${b.company ?? e.company},
        phone = ${b.phone ?? e.phone},
        email = ${b.email ?? e.email},
        specialty = ${b.specialty ?? e.specialty},
        trade_category = ${b.trade_category ?? e.trade_category ?? ''},
        rating = ${b.rating ?? e.rating},
        hourly_rate = ${b.hourly_rate ?? e.hourly_rate},
        notes = ${b.notes ?? e.notes},
        license_number = ${b.license_number ?? e.license_number ?? ''},
        license_state = ${b.license_state ?? e.license_state ?? ''},
        insurance_expiry = ${b.insurance_expiry ?? e.insurance_expiry ?? ''},
        w9_status = ${b.w9_status ?? e.w9_status ?? 'missing'},
        do_not_rehire = ${b.do_not_rehire ?? e.do_not_rehire ?? 0}
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await sql`DELETE FROM vendors WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

router.post('/:vendorId/projects/:projectId', async (req, res) => {
  try {
    const existing = await sql`SELECT id FROM project_vendors WHERE vendor_id = ${req.params.vendorId} AND project_id = ${req.params.projectId}`;
    if (existing[0]) return res.status(400).json({ error: 'Vendor already attached to this project' });
    const id = uuid();
    const { phase_name = '', contracted_amount = 0, paid_amount = 0, notes = '' } = req.body;
    const [pv] = await sql`
      INSERT INTO project_vendors (id, project_id, vendor_id, phase_name, contracted_amount, paid_amount, notes)
      VALUES (${id}, ${req.params.projectId}, ${req.params.vendorId}, ${phase_name}, ${contracted_amount}, ${paid_amount}, ${notes})
      RETURNING *
    `;
    res.status(201).json(pv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to attach vendor to project' });
  }
});

router.delete('/:vendorId/projects/:projectId', async (req, res) => {
  try {
    await sql`DELETE FROM project_vendors WHERE vendor_id = ${req.params.vendorId} AND project_id = ${req.params.projectId}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to detach vendor' });
  }
});

export default router;
