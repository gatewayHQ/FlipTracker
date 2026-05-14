import express from 'express';
import cors from 'cors';
import dashboardRouter from './routes/dashboard';
import projectsRouter from './routes/projects';
import phasesRouter from './routes/phases';
import expensesRouter from './routes/expenses';
import milestonesRouter from './routes/milestones';
import vendorsRouter from './routes/vendors';
import bidsRouter from './routes/bids';
import changeOrdersRouter from './routes/change-orders';
import contractorPortalRouter from './routes/contractor-portal';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/dashboard', dashboardRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/projects', phasesRouter);
app.use('/api/projects', expensesRouter);
app.use('/api/projects', milestonesRouter);
app.use('/api/projects/:projectId/bids', bidsRouter);
app.use('/api/projects/:projectId/change-orders', changeOrdersRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api', contractorPortalRouter);

export default app;
