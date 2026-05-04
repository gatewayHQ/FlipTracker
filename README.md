# Flip Folio

A mobile-first real estate flip tracker for investors. Track projects, financials, renovation phases, vendors, milestones, and portfolio analytics — all in one dark-themed PWA.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite (better-sqlite3) |
| Charts | Recharts |
| Icons | Lucide React |
| Routing | React Router v6 |

## Architecture

```
FlipTracker/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── pages/   # Portfolio, Projects, ProjectDetail, AddProject, Capital, Analytics, Vendors, Settings
│       ├── components/  # Layout, BottomNav, StatCard, DonutChart, ProjectCard, PhaseSelector
│       ├── lib/     # api.ts (REST client), formatters
│       └── types/   # Shared TypeScript interfaces
└── server/          # Express REST API
    └── src/
        ├── routes/  # dashboard, projects, phases, expenses, milestones, vendors
        └── db/      # SQLite schema + seed data
```

## Database Schema

- **projects** — Core flip project: purchase, costs, rehab budget, sale price, dates, status
- **renovation_phases** — Per-project phases (Demo, Electrical, Kitchen, etc.) with status + budget tracking
- **vendors** — Vendor directory: name, company, specialty, rating, contact info
- **project_vendors** — Junction: attach vendors to projects with contracted/paid amounts
- **expenses** — Itemized expense log per project
- **milestones** — Timeline checkpoints per project
- **documents** — Document references per project

## API Endpoints

```
GET    /api/dashboard
GET    /api/projects                    POST   /api/projects
GET    /api/projects/:id                PUT    /api/projects/:id          DELETE /api/projects/:id
GET    /api/projects/:id/phases         POST   /api/projects/:id/phases
PUT    /api/projects/:id/phases/:pid    DELETE /api/projects/:id/phases/:pid
GET    /api/projects/:id/expenses       POST   /api/projects/:id/expenses
PUT    /api/projects/:id/expenses/:eid  DELETE /api/projects/:id/expenses/:eid
GET    /api/projects/:id/milestones     POST   /api/projects/:id/milestones
PUT    /api/projects/:id/milestones/:mid DELETE /api/projects/:id/milestones/:mid
GET    /api/vendors                     POST   /api/vendors
GET    /api/vendors/:id                 PUT    /api/vendors/:id           DELETE /api/vendors/:id
POST   /api/vendors/:vid/projects/:pid  DELETE /api/vendors/:vid/projects/:pid
```

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Run dev (both server + client with hot reload)
npm run dev

# Server: http://localhost:3001
# Client: http://localhost:5173
```

## Features

- **Portfolio Dashboard** — Total projects, capital deployed, estimated profit, avg days to flip
- **Project Management** — Full CRUD with address, financials, dates, status
- **Renovation Phases** — 15 predefined phases (Demo → Final Punch), tap to cycle status
- **Financial Tracking** — Investment & acquisition breakdown, renovation budget utilization, projected ROI
- **Expense Logger** — Itemized expenses per project by category
- **Milestone Timeline** — Key dates and checkpoints with completion tracking
- **Vendor Directory** — Add vendors with specialty, rating, contact info; attach to projects
- **Capital Page** — Cross-project capital utilization with donut chart and per-category breakdown
- **Analytics** — ROI by project, investment vs sale bar chart, portfolio status breakdown
- **Settings** — Investor profile and investment goals

## Future Enhancements

- Document upload (inspection reports, contracts, photos)
- Push notifications for milestone due dates
- Multi-user / team access with role permissions
- Comps integration (Zillow / MLS data pull for ARV estimates)
- Lender/loan tracking per project
- Export to CSV/PDF for tax purposes
- Mobile app (React Native with shared API)
