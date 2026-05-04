-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROJECTS
-- ============================================================
create table public.projects (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,

  name          text not null default '',
  address       text not null,
  city          text not null,
  state         text not null,
  zip           text default '',
  status        text default 'acquired'
                check (status in ('acquired','renovation','listed','sold','cancelled')),

  -- Investment & Acquisition
  purchase_price          numeric default 0,
  legal_fees              numeric default 0,
  inspection_cost         numeric default 0,
  closing_costs           numeric default 0,

  -- Renovation
  rehab_budget            numeric default 0,
  labor_cost              numeric default 0,
  materials_cost          numeric default 0,
  holding_costs_monthly   numeric default 0,

  -- Sale
  estimated_sale_price    numeric default 0,
  actual_sale_price       numeric default 0,

  -- Dates
  acquisition_date        date,
  target_completion_date  date,
  actual_completion_date  date,
  listed_date             date,
  sold_date               date,

  notes       text default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- RENOVATION PHASES
-- ============================================================
create table public.renovation_phases (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,

  phase_name  text not null,
  status      text default 'pending'
              check (status in ('pending','in_progress','completed')),
  budget      numeric default 0,
  actual_cost numeric default 0,
  start_date  date,
  target_date date,
  end_date    date,
  notes       text default '',
  created_at  timestamptz default now()
);

-- ============================================================
-- VENDORS
-- ============================================================
create table public.vendors (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,

  name        text not null,
  company     text default '',
  phone       text default '',
  email       text default '',
  specialty   text default '',
  rating      integer default 0 check (rating between 0 and 5),
  hourly_rate numeric default 0,
  notes       text default '',
  created_at  timestamptz default now()
);

-- ============================================================
-- PROJECT VENDORS (junction)
-- ============================================================
create table public.project_vendors (
  id                  uuid primary key default uuid_generate_v4(),
  project_id          uuid not null references public.projects(id) on delete cascade,
  vendor_id           uuid not null references public.vendors(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,

  phase_name          text default '',
  contracted_amount   numeric default 0,
  paid_amount         numeric default 0,
  notes               text default '',
  created_at          timestamptz default now(),

  unique (project_id, vendor_id)
);

-- ============================================================
-- EXPENSES
-- ============================================================
create table public.expenses (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,

  category    text not null,
  description text not null,
  amount      numeric not null,
  date        date not null,
  vendor_id   uuid references public.vendors(id) on delete set null,
  notes       text default '',
  created_at  timestamptz default now()
);

-- ============================================================
-- MILESTONES
-- ============================================================
create table public.milestones (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,

  title           text not null,
  due_date        date,
  completed       boolean default false,
  completed_date  date,
  notes           text default '',
  created_at      timestamptz default now()
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
create table public.documents (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,

  name        text not null,
  type        text default '',
  url         text default '',
  created_at  timestamptz default now()
);

-- ============================================================
-- updated_at trigger for projects
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY — users only see their own data
-- ============================================================
alter table public.projects        enable row level security;
alter table public.renovation_phases enable row level security;
alter table public.vendors         enable row level security;
alter table public.project_vendors enable row level security;
alter table public.expenses        enable row level security;
alter table public.milestones      enable row level security;
alter table public.documents       enable row level security;

-- Projects
create policy "users manage own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Renovation phases
create policy "users manage own phases"
  on public.renovation_phases for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Vendors
create policy "users manage own vendors"
  on public.vendors for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Project vendors
create policy "users manage own project_vendors"
  on public.project_vendors for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Expenses
create policy "users manage own expenses"
  on public.expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Milestones
create policy "users manage own milestones"
  on public.milestones for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Documents
create policy "users manage own documents"
  on public.documents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
