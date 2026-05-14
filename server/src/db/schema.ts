import { v4 as uuid } from 'uuid';
import sql from './connection';

export async function initializeSchema(): Promise<void> {
  // --- Core tables ---
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip TEXT DEFAULT '',
      status TEXT DEFAULT 'acquired',
      purchase_price NUMERIC DEFAULT 0,
      legal_fees NUMERIC DEFAULT 0,
      inspection_cost NUMERIC DEFAULT 0,
      closing_costs NUMERIC DEFAULT 0,
      rehab_budget NUMERIC DEFAULT 0,
      labor_cost NUMERIC DEFAULT 0,
      materials_cost NUMERIC DEFAULT 0,
      holding_costs_monthly NUMERIC DEFAULT 0,
      estimated_sale_price NUMERIC DEFAULT 0,
      actual_sale_price NUMERIC DEFAULT 0,
      acquisition_date TEXT DEFAULT '',
      target_completion_date TEXT DEFAULT '',
      actual_completion_date TEXT DEFAULT '',
      listed_date TEXT DEFAULT '',
      sold_date TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS renovation_phases (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      phase_name TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      budget NUMERIC DEFAULT 0,
      actual_cost NUMERIC DEFAULT 0,
      start_date TEXT DEFAULT '',
      target_date TEXT DEFAULT '',
      end_date TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      company TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      specialty TEXT DEFAULT '',
      rating INTEGER DEFAULT 0,
      hourly_rate NUMERIC DEFAULT 0,
      notes TEXT DEFAULT '',
      license_number TEXT DEFAULT '',
      license_expiry TEXT DEFAULT '',
      insurance_expiry TEXT DEFAULT '',
      w9_on_file INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS project_vendors (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      vendor_id TEXT NOT NULL,
      phase_name TEXT DEFAULT '',
      contracted_amount NUMERIC DEFAULT 0,
      paid_amount NUMERIC DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      date TEXT NOT NULL,
      vendor_id TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      due_date TEXT DEFAULT '',
      completed INTEGER DEFAULT 0,
      completed_date TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT '',
      url TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      lender TEXT NOT NULL,
      loan_amount NUMERIC DEFAULT 0,
      interest_rate NUMERIC DEFAULT 0,
      points NUMERIC DEFAULT 0,
      term_months INTEGER DEFAULT 12,
      monthly_payment NUMERIC DEFAULT 0,
      origination_date TEXT DEFAULT '',
      maturity_date TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      name TEXT DEFAULT '',
      capital_goal NUMERIC DEFAULT 0,
      target_roi NUMERIC DEFAULT 15,
      target_flip_days INTEGER DEFAULT 90,
      notifications_enabled INTEGER DEFAULT 1,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  // Additive migrations for existing deployments
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE`;
  await sql`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE`;
  await sql`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS license_number TEXT DEFAULT ''`;
  await sql`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS license_expiry TEXT DEFAULT ''`;
  await sql`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS insurance_expiry TEXT DEFAULT ''`;
  await sql`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS w9_on_file INTEGER DEFAULT 0`;
  await sql`ALTER TABLE milestones ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT ''`;
}
