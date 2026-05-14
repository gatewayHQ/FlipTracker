import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import dashboardRouter from './routes/dashboard';
import projectsRouter from './routes/projects';
import phasesRouter from './routes/phases';
import expensesRouter from './routes/expenses';
import milestonesRouter from './routes/milestones';
import vendorsRouter from './routes/vendors';
import loansRouter from './routes/loans';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/projects', phasesRouter);
app.use('/api/projects', expensesRouter);
app.use('/api/projects', milestonesRouter);
app.use('/api/projects/:projectId', loansRouter);
app.use('/api/vendors', vendorsRouter);

export default app;
