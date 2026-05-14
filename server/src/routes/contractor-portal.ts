import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import sql from '../db/connection';

const router = Router();

// ── Generate magic-link token for a vendor on a project ──────────────────────
router.post('/projects/:projectId/vendors/:vendorId/portal-link', async (req, res) => {
  try {
    const { projectId, vendorId } = req.params;
    const { label = '', expires_days = 30 } = req.body;

    // Verify project + vendor exist
    const [project] = await sql`SELECT id, name, address FROM projects WHERE id = ${projectId}`;
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const [vendor] = await sql`SELECT id, name FROM vendors WHERE id = ${vendorId}`;
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    const token = uuid().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + expires_days * 86_400_000).toISOString();

    const [row] = await sql`
      INSERT INTO contractor_tokens (id, project_id, vendor_id, token, label, expires_at)
      VALUES (${uuid()}, ${projectId}, ${vendorId}, ${token}, ${label}, ${expiresAt})
      RETURNING *
    `;

    res.status(201).json({ ...row, portal_url: `/contractor/${token}` });
  } catch {
    res.status(500).json({ error: 'Failed to generate portal link' });
  }
});

// ── List tokens for a project/vendor ─────────────────────────────────────────
router.get('/projects/:projectId/vendors/:vendorId/portal-links', async (req, res) => {
  try {
    const tokens = await sql`
      SELECT * FROM contractor_tokens
      WHERE project_id = ${req.params.projectId} AND vendor_id = ${req.params.vendorId}
      ORDER BY created_at DESC
    `;
    res.json(tokens);
  } catch {
    res.status(500).json({ error: 'Failed to fetch portal links' });
  }
});

// ── Revoke a token ────────────────────────────────────────────────────────────
router.delete('/contractor-tokens/:tokenId', async (req, res) => {
  try {
    await sql`DELETE FROM contractor_tokens WHERE id = ${req.params.tokenId}`;
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to revoke token' });
  }
});

// ── Public: load portal data by token ────────────────────────────────────────
router.get('/contractor/:token', async (req, res) => {
  try {
    const rows = await sql`
      SELECT ct.*, v.name as vendor_name, v.company, v.specialty, v.phone,
             p.name as project_name, p.address, p.city, p.state, p.status as project_status
      FROM contractor_tokens ct
      JOIN vendors v ON ct.vendor_id = v.id
      JOIN projects p ON ct.project_id = p.id
      WHERE ct.token = ${req.params.token}
    `;
    const tokenRow = rows[0] as any;
    if (!tokenRow) return res.status(404).json({ error: 'Invalid or expired link' });

    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This link has expired' });
    }

    // Load project phases
    const phases = await sql`
      SELECT * FROM renovation_phases WHERE project_id = ${tokenRow.project_id}
      ORDER BY created_at ASC
    `;

    // Load this vendor's project_vendor record
    const pv = await sql`
      SELECT * FROM project_vendors WHERE project_id = ${tokenRow.project_id} AND vendor_id = ${tokenRow.vendor_id}
    `;

    // Load change orders for this vendor on this project
    const cos = await sql`
      SELECT * FROM change_orders
      WHERE project_id = ${tokenRow.project_id} AND vendor_id = ${tokenRow.vendor_id}
      ORDER BY created_at DESC
    `;

    res.json({
      vendor: {
        id: tokenRow.vendor_id,
        name: tokenRow.vendor_name,
        company: tokenRow.company,
        specialty: tokenRow.specialty,
        phone: tokenRow.phone,
      },
      project: {
        id: tokenRow.project_id,
        name: tokenRow.project_name,
        address: tokenRow.address,
        city: tokenRow.city,
        state: tokenRow.state,
        status: tokenRow.project_status,
      },
      assignment: pv[0] || null,
      phases,
      change_orders: cos,
      token_label: tokenRow.label,
      expires_at: tokenRow.expires_at,
    });
  } catch {
    res.status(500).json({ error: 'Failed to load portal' });
  }
});

// ── Public: update phase status ───────────────────────────────────────────────
router.put('/contractor/:token/phases/:phaseId', async (req, res) => {
  try {
    const tokenRows = await sql`SELECT * FROM contractor_tokens WHERE token = ${req.params.token}`;
    const tokenRow = tokenRows[0] as any;
    if (!tokenRow) return res.status(404).json({ error: 'Invalid link' });
    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Link expired' });
    }

    // Ensure phase belongs to this project
    const phaseRows = await sql`SELECT * FROM renovation_phases WHERE id = ${req.params.phaseId} AND project_id = ${tokenRow.project_id}`;
    if (!phaseRows[0]) return res.status(404).json({ error: 'Phase not found' });

    const { status, notes } = req.body;
    const existing = phaseRows[0] as any;
    const [updated] = await sql`
      UPDATE renovation_phases SET
        status = ${status ?? existing.status},
        notes = ${notes ?? existing.notes}
      WHERE id = ${req.params.phaseId}
      RETURNING *
    `;
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update phase' });
  }
});

// ── Public: submit pay request (creates a change order flagged as pay_request) ─
router.post('/contractor/:token/pay-request', async (req, res) => {
  try {
    const tokenRows = await sql`SELECT * FROM contractor_tokens WHERE token = ${req.params.token}`;
    const tokenRow = tokenRows[0] as any;
    if (!tokenRow) return res.status(404).json({ error: 'Invalid link' });
    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Link expired' });
    }

    const { phase_name = '', description = 'Pay Request', amount = 0 } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    const id = uuid();

    const [co] = await sql`
      INSERT INTO change_orders (id, project_id, vendor_id, phase_name, description, amount, submitted_date, status)
      VALUES (${id}, ${tokenRow.project_id}, ${tokenRow.vendor_id}, ${phase_name}, ${description}, ${amount}, ${today}, 'pending')
      RETURNING *
    `;
    res.status(201).json(co);
  } catch {
    res.status(500).json({ error: 'Failed to submit pay request' });
  }
});

export default router;
