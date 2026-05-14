import express from 'express';
import cors from 'cors';
import { initializeSchema } from './db/schema';
import dashboardRouter from './routes/dashboard';
import projectsRouter from './routes/projects';
import phasesRouter from './routes/phases';
import expensesRouter from './routes/expenses';
import milestonesRouter from './routes/milestones';
import vendorsRouter from './routes/vendors';

const app = express();
app.use(cors());
app.use(express.json());

let initPromise: Promise<void> | null = null;
app.use((_req, _res, next) => {
  if (!initPromise) initPromise = initializeSchema();
  initPromise.then(() => next()).catch(next);
});

app.use('/api/dashboard', dashboardRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/projects', phasesRouter);
app.use('/api/projects', expensesRouter);
app.use('/api/projects', milestonesRouter);
app.use('/api/vendors', vendorsRouter);

export default app;
