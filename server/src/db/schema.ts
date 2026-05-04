import type Database from 'better-sqlite3';

export function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip TEXT DEFAULT '',
      status TEXT DEFAULT 'acquired',

      purchase_price REAL DEFAULT 0,
      legal_fees REAL DEFAULT 0,
      inspection_cost REAL DEFAULT 0,
      closing_costs REAL DEFAULT 0,

      rehab_budget REAL DEFAULT 0,
      labor_cost REAL DEFAULT 0,
      materials_cost REAL DEFAULT 0,
      holding_costs_monthly REAL DEFAULT 0,

      estimated_sale_price REAL DEFAULT 0,
      actual_sale_price REAL DEFAULT 0,

      acquisition_date TEXT DEFAULT '',
      target_completion_date TEXT DEFAULT '',
      actual_completion_date TEXT DEFAULT '',
      listed_date TEXT DEFAULT '',
      sold_date TEXT DEFAULT '',

      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS renovation_phases (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      phase_name TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      budget REAL DEFAULT 0,
      actual_cost REAL DEFAULT 0,
      start_date TEXT DEFAULT '',
      target_date TEXT DEFAULT '',
      end_date TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      specialty TEXT DEFAULT '',
      rating INTEGER DEFAULT 0,
      hourly_rate REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS project_vendors (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      vendor_id TEXT NOT NULL,
      phase_name TEXT DEFAULT '',
      contracted_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      vendor_id TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      due_date TEXT DEFAULT '',
      completed INTEGER DEFAULT 0,
      completed_date TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT '',
      url TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  seedData(db);
}

function seedData(db: Database.Database): void {
  const count = (db.prepare('SELECT COUNT(*) as c FROM projects').get() as { c: number }).c;
  if (count > 0) return;

  const { v4: uuid } = require('uuid');

  const p1 = uuid();
  const p2 = uuid();
  const p3 = uuid();

  const v1 = uuid();
  const v2 = uuid();
  const v3 = uuid();

  db.prepare(`INSERT INTO vendors VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(
    v1, 'Mike Torres', 'Torres Contracting', '555-101-2020', 'mike@torrescontracting.com', 'General Contractor', 5, 85, 'Reliable, great quality'
  );
  db.prepare(`INSERT INTO vendors VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(
    v2, 'Sarah Chen', 'Chen Electric', '555-202-3030', 'sarah@chenelectric.com', 'Electrical', 4, 95, 'Licensed electrician, fast'
  );
  db.prepare(`INSERT INTO vendors VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(
    v3, 'Dave Plumb', 'ProPlumb LLC', '555-303-4040', 'dave@proplumb.com', 'Plumbing', 4, 90, 'Good rates on full renos'
  );

  const projectInsert = db.prepare(`
    INSERT INTO projects VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?, ?,
      ?, datetime('now'), datetime('now')
    )
  `);

  projectInsert.run(
    p1, '124 Maple Street', '124 Maple Street', 'Austin', 'TX', '78701', 'renovation',
    385000, 8400, 1250, 7750,
    92000, 54200, 37800, 2200,
    680000, 0,
    '2024-09-15', '2024-12-01', '', '', '',
    'Phase 4 in progress. Kitchen countertops pending.'
  );

  projectInsert.run(
    p2, '88 Oak Avenue', '88 Oak Avenue', 'Dallas', 'TX', '75201', 'listed',
    245000, 5200, 900, 4800,
    48000, 28000, 20000, 1500,
    420000, 0,
    '2024-07-01', '2024-10-15', '2024-10-12', '2024-10-20', '',
    'Listed. Showing scheduled.'
  );

  projectInsert.run(
    p3, '331 Pine Lane', '331 Pine Lane', 'Houston', 'TX', '77001', 'acquired',
    310000, 6800, 1100, 6200,
    75000, 0, 0, 1800,
    580000, 0,
    '2024-11-01', '2025-03-01', '', '', '',
    'Just acquired. Planning phase.'
  );

  const phases1 = [
    { name: 'Demo', status: 'completed', budget: 8000, actual: 7500 },
    { name: 'Junk Removal', status: 'completed', budget: 2000, actual: 1800 },
    { name: 'Framing', status: 'completed', budget: 5000, actual: 5200 },
    { name: 'Electrical', status: 'completed', budget: 12000, actual: 11500 },
    { name: 'Plumbing', status: 'completed', budget: 9000, actual: 8800 },
    { name: 'HVAC', status: 'completed', budget: 8000, actual: 7900 },
    { name: 'Drywall', status: 'completed', budget: 6000, actual: 6300 },
    { name: 'Flooring', status: 'in_progress', budget: 14000, actual: 9200 },
    { name: 'Paint', status: 'pending', budget: 5000, actual: 0 },
    { name: 'Kitchen', status: 'in_progress', budget: 18000, actual: 12000 },
    { name: 'Bathrooms', status: 'pending', budget: 10000, actual: 0 },
    { name: 'Final Punch', status: 'pending', budget: 3000, actual: 0 },
  ];

  for (const ph of phases1) {
    db.prepare(`INSERT INTO renovation_phases VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(
      uuid(), p1, ph.name, ph.status, ph.budget, ph.actual, '', '', '', ''
    );
  }

  const phases2 = [
    { name: 'Demo', status: 'completed', budget: 5000, actual: 4800 },
    { name: 'Flooring', status: 'completed', budget: 8000, actual: 7900 },
    { name: 'Paint', status: 'completed', budget: 4000, actual: 3900 },
    { name: 'Kitchen', status: 'completed', budget: 15000, actual: 14800 },
    { name: 'Bathrooms', status: 'completed', budget: 10000, actual: 9800 },
    { name: 'Landscaping', status: 'completed', budget: 3000, actual: 2800 },
    { name: 'Final Punch', status: 'completed', budget: 2000, actual: 1900 },
  ];

  for (const ph of phases2) {
    db.prepare(`INSERT INTO renovation_phases VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(
      uuid(), p2, ph.name, ph.status, ph.budget, ph.actual, '', '', '', ''
    );
  }

  db.prepare(`INSERT INTO project_vendors VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(
    uuid(), p1, v1, 'General', 45000, 40000, 'Main GC for renovation'
  );
  db.prepare(`INSERT INTO project_vendors VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(
    uuid(), p1, v2, 'Electrical', 11500, 11500, 'Full electrical rewire'
  );
  db.prepare(`INSERT INTO project_vendors VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(
    uuid(), p1, v3, 'Plumbing', 8800, 8800, 'Kitchen and bath plumbing'
  );

  const milestones1 = [
    { title: 'Property Acquired', due: '2024-09-15', done: 1, done_date: '2024-09-15' },
    { title: 'Demo Complete', due: '2024-09-30', done: 1, done_date: '2024-09-28' },
    { title: 'Rough-In Inspections', due: '2024-10-20', done: 1, done_date: '2024-10-18' },
    { title: 'Kitchen Countertop Install', due: '2024-10-12', done: 0, done_date: '' },
    { title: 'Final Walkthrough', due: '2024-11-15', done: 0, done_date: '' },
    { title: 'List on MLS', due: '2024-11-25', done: 0, done_date: '' },
  ];
  for (const m of milestones1) {
    db.prepare(`INSERT INTO milestones VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(
      uuid(), p1, m.title, m.due, m.done, m.done_date, ''
    );
  }

  const expenses1 = [
    { cat: 'purchase', desc: 'Purchase Price', amt: 385000, date: '2024-09-15' },
    { cat: 'closing', desc: 'Closing Costs (Buyer)', amt: 7750, date: '2024-09-15' },
    { cat: 'legal', desc: 'Legal & Title Fees', amt: 8400, date: '2024-09-15' },
    { cat: 'inspection', desc: 'Property Inspection', amt: 1250, date: '2024-09-10' },
    { cat: 'labor', desc: 'Demo Labor', amt: 7500, date: '2024-09-28' },
    { cat: 'labor', desc: 'Electrical Work', amt: 11500, date: '2024-10-18' },
    { cat: 'labor', desc: 'Plumbing Work', amt: 8800, date: '2024-10-18' },
    { cat: 'materials', desc: 'Flooring Materials', amt: 9200, date: '2024-10-25' },
  ];
  for (const e of expenses1) {
    db.prepare(`INSERT INTO expenses VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(
      uuid(), p1, e.cat, e.desc, e.amt, e.date, '', ''
    );
  }
}
