import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { db } from './db';
import { processWarehouseQuery } from './gemini';

dotenv.config();

const app = express();
app.use(express.json());

// CORS headers for seamless cross-origin and serverless invocation
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const apiRouter = express.Router();

// --- API Endpoints ---

// Health check
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    name: 'OmniStock AI Warehouse Assistant',
    platform: 'Vercel Ready Full-Stack',
  });
});

// Ping endpoint
apiRouter.get('/ping', (req: Request, res: Response) => {
  res.json({
    name: 'OmniStock AI Warehouse Assistant API',
    status: 'online',
    endpoints: [
      '/api/health',
      '/api/inventory',
      '/api/zones',
      '/api/metrics',
      '/api/transactions',
      '/api/recommendations',
      '/api/ai/chat'
    ]
  });
});

// Get all inventory items
apiRouter.get('/inventory', (req: Request, res: Response) => {
  const { zone, category, status, search } = req.query;
  let items = db.getAllItems();

  if (zone && typeof zone === 'string') {
    items = items.filter((it) => it.zone.toLowerCase() === zone.toLowerCase());
  }
  if (category && typeof category === 'string') {
    items = items.filter((it) => it.category.toLowerCase() === category.toLowerCase());
  }
  if (status && typeof status === 'string') {
    items = items.filter((it) => it.status.toLowerCase() === status.toLowerCase());
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    items = items.filter(
      (it) =>
        it.sku.toLowerCase().includes(q) ||
        it.name.toLowerCase().includes(q) ||
        it.binLocation.toLowerCase().includes(q)
    );
  }

  res.json({ items });
});

// Get single inventory item by SKU
apiRouter.get('/inventory/:sku', (req: Request, res: Response) => {
  const item = db.getItem(req.params.sku);
  if (!item) {
    return res.status(404).json({ error: `SKU '${req.params.sku}' not found.` });
  }
  res.json({ item });
});

// Create new inventory item
apiRouter.post('/inventory', (req: Request, res: Response) => {
  try {
    const { item, performedBy = 'System Admin', role = 'Admin' } = req.body;
    if (!item || !item.sku || !item.name) {
      return res.status(400).json({ error: 'Missing required item fields (sku, name).' });
    }
    const created = db.createItem(item, performedBy, role);
    res.status(201).json({ item: created });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update item details
apiRouter.put('/inventory/:sku', (req: Request, res: Response) => {
  try {
    const updated = db.updateItem(req.params.sku, req.body);
    res.json({ item: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Record stock movement (Stock-In, Stock-Out, Transfer, Adjustment)
apiRouter.post('/inventory/movement', (req: Request, res: Response) => {
  try {
    const { sku, type, quantityChange, performedBy, role, reason, referenceNumber, targetZone } = req.body;
    if (!sku || !type || quantityChange === undefined) {
      return res.status(400).json({ error: 'Missing required fields: sku, type, quantityChange.' });
    }

    const result = db.recordStockMovement({
      sku,
      type,
      quantityChange: Number(quantityChange),
      performedBy: performedBy || 'Warehouse Operator',
      role: role || 'Warehouse Staff',
      reason: reason || 'Inventory movement transaction',
      referenceNumber,
      targetZone,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get all transactions
apiRouter.get('/transactions', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const transactions = db.getTransactions(limit);
  res.json({ transactions });
});

// Get warehouse zones
apiRouter.get('/zones', (req: Request, res: Response) => {
  const zones = db.getZones();
  const metrics = db.getMetrics();
  res.json({ zones, zoneSummaries: metrics.zoneSummaries });
});

// Get dashboard metrics
apiRouter.get('/metrics', (req: Request, res: Response) => {
  const metrics = db.getMetrics();
  res.json(metrics);
});

// Reset database to initial mock dataset
apiRouter.post('/inventory/reset', (req: Request, res: Response) => {
  db.reset();
  res.json({ success: true, message: 'Database reset to default warehouse data.' });
});

// Get AI advisory recommendations (Human-in-the-Loop decision support)
apiRouter.get('/recommendations', (req: Request, res: Response) => {
  const recommendations = db.getRecommendations();
  const pendingCount = db.getPendingRecommendationsCount();
  res.json({ recommendations, pendingCount });
});

// Human Operator Approval of AI Recommendation
apiRouter.post('/recommendations/:id/approve', (req: Request, res: Response) => {
  try {
    const { performedBy = 'Warehouse Supervisor', role = 'Admin', operatorNotes } = req.body;
    const result = db.approveRecommendation(req.params.id, performedBy, role, operatorNotes);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Human Operator Rejection / Dismissal of AI Recommendation
apiRouter.post('/recommendations/:id/reject', (req: Request, res: Response) => {
  try {
    const { performedBy = 'Warehouse Supervisor', role = 'Admin', operatorNotes } = req.body;
    const rejected = db.rejectRecommendation(req.params.id, performedBy, role, operatorNotes);
    res.json({ recommendation: rejected });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Scenario Simulation endpoint
apiRouter.post('/scenarios/simulate', (req: Request, res: Response) => {
  try {
    const { scenarioType = 'HOLIDAY_SURGE' } = req.body;
    const simulationResult = db.simulateScenario(scenarioType);
    res.json(simulationResult);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// AI Chat endpoint
apiRouter.post('/ai/chat', async (req: Request, res: Response) => {
  try {
    const { query, history = [], userRole = 'Warehouse Staff', userName = 'Warehouse Operator' } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string is required.' });
    }

    const assistantReply = await processWarehouseQuery(query, history, userRole, userName);
    res.json(assistantReply);
  } catch (err: any) {
    console.error('AI chat endpoint error:', err);
    res.status(500).json({ error: 'Internal AI processing error', details: err.message });
  }
});

// Mount router on both '/api' and '/' to ensure zero 404s on Vercel rewrites or direct API access
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
