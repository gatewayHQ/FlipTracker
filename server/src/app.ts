import express from 'express';
import cors from 'cors';
import sql from './db/connection';
import authRouter from './routes/auth';
import dashboardRouter from './routes/dashboard';
import projectsRouter from './routes/projects';
import phasesRouter from './routes/phases';
import expensesRouter from './routes/expenses';
import milestonesRouter from './routes/milestones';
import vendorsRouter from './routes/vendors';
import loansRouter from './routes/loans';
import tasksRouter from './routes/tasks';
import compsRouter from './routes/comps';
import notesRouter from './routes/notes';
import documentsRouter from './routes/documents';
import analyzerRouter from './routes/analyzer';

const app = express();

app.use(cors());
app.use(express.json());

// Health check — no auth required, useful for diagnosing DB connectivity
app.get('/api/health', async (_req, res) => {
  try {
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `;
    const [uc] = await sql`SELECT COUNT(*) AS count FROM users`;
    const [pc] = await sql`SELECT COUNT(*) AS count FROM projects`;
    const [ac] = await sql`SELECT COUNT(*) AS count FROM deal_analyses`;
    res.json({
      ok: true,
      tables: tables.map((t: any) => t.table_name),
      counts: {
        users: Number(uc?.count ?? 0),
        projects: Number(pc?.count ?? 0),
        deal_analyses: Number(ac?.count ?? 0),
      },
    });
  } catch (err: any) {
    console.error('[health]', err);
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/projects', phasesRouter);
app.use('/api/projects', expensesRouter);
app.use('/api/projects', milestonesRouter);
app.use('/api/projects/:projectId', loansRouter);
app.use('/api/projects/:projectId', compsRouter);
app.use('/api/projects/:projectId', notesRouter);
app.use('/api/projects/:projectId', documentsRouter);
app.use('/api/projects/:projectId/phases/:phaseId', tasksRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/analyzer', analyzerRouter);

export default app;
