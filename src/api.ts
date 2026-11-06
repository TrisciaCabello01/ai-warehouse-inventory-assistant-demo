import { InventoryItem, InventoryTransaction, WarehouseMetrics, WarehouseZone, ZoneSummary } from './types';
import { db } from '../server/db';

export async function fetchInventory(params?: {
  zone?: string;
  category?: string;
  status?: string;
  search?: string;
}): Promise<InventoryItem[]> {
  try {
    const query = new URLSearchParams();
    if (params?.zone) query.set('zone', params.zone);
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`/api/inventory?${query.toString()}`);
    if (res.ok) {
      const data = await res.json();
      return data.items;
    }
  } catch (e) {
    console.warn('Backend /api/inventory unavailable, using local store:', e);
  }

  // Graceful fallback to client db
  let items = db.getAllItems();
  if (params?.zone) {
    items = items.filter((it) => it.zone.toLowerCase() === params.zone!.toLowerCase());
  }
  if (params?.category) {
    items = items.filter((it) => it.category.toLowerCase() === params.category!.toLowerCase());
  }
  if (params?.status) {
    items = items.filter((it) => it.status.toLowerCase() === params.status!.toLowerCase());
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    items = items.filter(
      (it) =>
        it.sku.toLowerCase().includes(q) ||
        it.name.toLowerCase().includes(q) ||
        it.binLocation.toLowerCase().includes(q)
    );
  }
  return items;
}

export async function fetchItem(sku: string): Promise<InventoryItem> {
  try {
    const res = await fetch(`/api/inventory/${encodeURIComponent(sku)}`);
    if (res.ok) {
      const data = await res.json();
      return data.item;
    }
  } catch (e) {
    console.warn('Backend fetchItem failed, using local store:', e);
  }
  const item = db.getItem(sku);
  if (!item) throw new Error(`SKU '${sku}' not found.`);
  return item;
}

export async function createItem(
  item: InventoryItem,
  performedBy: string,
  role: string
): Promise<InventoryItem> {
  try {
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item, performedBy, role }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.item;
    }
  } catch (e) {
    console.warn('Backend createItem failed, creating in local store:', e);
  }
  return db.createItem(item, performedBy, role as any);
}

export async function updateItem(sku: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
  try {
    const res = await fetch(`/api/inventory/${encodeURIComponent(sku)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      return data.item;
    }
  } catch (e) {
    console.warn('Backend updateItem failed, updating in local store:', e);
  }
  return db.updateItem(sku, updates);
}

export async function recordMovement(payload: {
  sku: string;
  type: 'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantityChange: number;
  performedBy: string;
  role: string;
  reason: string;
  referenceNumber?: string;
  targetZone?: string;
}): Promise<{ item: InventoryItem; transaction: InventoryTransaction }> {
  try {
    const res = await fetch('/api/inventory/movement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return res.json();
    }
  } catch (e) {
    console.warn('Backend recordMovement failed, recording in local store:', e);
  }
  return db.recordStockMovement({
    ...payload,
    role: payload.role as any,
    targetZone: payload.targetZone as any,
  });
}

export async function fetchTransactions(limit = 50): Promise<InventoryTransaction[]> {
  try {
    const res = await fetch(`/api/transactions?limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      return data.transactions;
    }
  } catch (e) {
    console.warn('Backend fetchTransactions failed, using local store:', e);
  }
  return db.getTransactions(limit);
}

export async function fetchZones(): Promise<{ zones: WarehouseZone[]; zoneSummaries: ZoneSummary[] }> {
  try {
    const res = await fetch('/api/zones');
    if (res.ok) {
      return res.json();
    }
  } catch (e) {
    console.warn('Backend fetchZones failed, using local store:', e);
  }
  const zones = db.getZones();
  const metrics = db.getMetrics();
  return { zones, zoneSummaries: metrics.zoneSummaries };
}

export async function fetchMetrics(): Promise<WarehouseMetrics> {
  try {
    const res = await fetch('/api/metrics');
    if (res.ok) {
      return res.json();
    }
  } catch (e) {
    console.warn('Backend fetchMetrics failed, using local store:', e);
  }
  return db.getMetrics();
}

export async function resetDatabase(): Promise<void> {
  try {
    const res = await fetch('/api/inventory/reset', { method: 'POST' });
    if (res.ok) return;
  } catch (e) {
    console.warn('Backend resetDatabase failed, resetting local store:', e);
  }
  db.reset();
}

export async function askAIAssistant(
  query: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userRole: string,
  userName: string
) {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, history, userRole, userName }),
    });
    if (res.ok) {
      return res.json();
    }
  } catch (e) {
    console.warn('Backend AI chat failed, generating local advisory response:', e);
  }

  // Graceful client assistant response
  const q = query.toLowerCase();
  const allItems = db.getAllItems();
  const metrics = db.getMetrics();

  if (q.includes('low') || q.includes('reorder') || q.includes('out of stock')) {
    const low = allItems.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock');
    return {
      text: `### Low Stock & Out of Stock Alert Summary\n\nThere are currently **${low.length} items** requiring attention across the facility:\n\n` +
        low.map(it => `* **${it.name}** (\`${it.sku}\`): **${it.quantity} ${it.unit}** (Min: ${it.minThreshold}) — **${it.status}** in **${it.zone}**`).join('\n') +
        `\n\n> **Advisory Recommendation:** Expedite supplier purchase orders to prevent stockouts.`,
      matchedItems: low,
      suggestedActions: ['What is the total value of stock in Zone B?', 'How many products are currently in stock?'],
    };
  }

  if (q.includes('zone b') || (q.includes('zone') && q.includes('value'))) {
    const zb = metrics.zoneSummaries.find(z => z.zoneCode === 'Zone B');
    return {
      text: `### Valuation for Zone B (${zb?.name || 'Fast Moving'})\n\n` +
        `* **Total Valuation:** **$${zb?.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}**\n` +
        `* **Stored Units:** **${zb?.totalQuantity.toLocaleString()}** units across **${zb?.totalItems} SKUs**\n` +
        `* **Capacity Utilization:** **${zb?.utilizationPct}%**\n` +
        `* **Attention Alerts:** **${zb?.lowStockAlerts} items** below threshold.`,
      matchedItems: allItems.filter(i => i.zone === 'Zone B'),
      suggestedActions: ['Which items are running low?', 'Show me the latest inventory transactions'],
    };
  }

  if (q.includes('how many') || q.includes('in stock') || q.includes('total')) {
    return {
      text: `### Inventory Stock Census\n\n` +
        `* **Total Active SKUs:** **${metrics.totalSkus}**\n` +
        `* **Physical Stock Units:** **${metrics.totalQuantity.toLocaleString()}** units\n` +
        `* **Total Valuation:** **$${metrics.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}**\n` +
        `* **Healthy Level:** **${metrics.healthyStockCount} SKUs**\n` +
        `* **Attention Required:** **${metrics.reorderAlerts} SKUs**`,
      matchedItems: allItems.slice(0, 4),
      suggestedActions: ['Which items are running low?', 'What is the total value of stock in Zone B?'],
    };
  }

  return {
    text: `I have analyzed your warehouse inquiry. OmniStock AI is actively monitoring **${metrics.totalSkus} SKUs** with **$${metrics.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}** in total stock valuation across 5 storage zones.`,
    matchedItems: allItems.slice(0, 3),
    suggestedActions: ['Which items are running low?', 'What is the total value of stock in Zone B?', 'Show me the latest inventory transactions'],
  };
}

export async function fetchRecommendations(): Promise<{
  recommendations: import('./types').AIRecommendation[];
  pendingCount: number;
}> {
  try {
    const res = await fetch('/api/recommendations');
    if (res.ok) {
      return res.json();
    }
  } catch (e) {
    console.warn('Backend fetchRecommendations failed, using local store:', e);
  }
  return {
    recommendations: db.getRecommendations(),
    pendingCount: db.getPendingRecommendationsCount(),
  };
}

export async function approveRecommendation(
  id: string,
  performedBy: string,
  role: string,
  operatorNotes?: string
): Promise<{ recommendation: import('./types').AIRecommendation; executedTransaction?: import('./types').InventoryTransaction }> {
  try {
    const res = await fetch(`/api/recommendations/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ performedBy, role, operatorNotes }),
    });
    if (res.ok) {
      return res.json();
    }
  } catch (e) {
    console.warn('Backend approveRecommendation failed, approving in local store:', e);
  }
  return db.approveRecommendation(id, performedBy, role as any, operatorNotes);
}

export async function rejectRecommendation(
  id: string,
  performedBy: string,
  role: string,
  operatorNotes?: string
): Promise<{ recommendation: import('./types').AIRecommendation }> {
  try {
    const res = await fetch(`/api/recommendations/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ performedBy, role, operatorNotes }),
    });
    if (res.ok) {
      return res.json();
    }
  } catch (e) {
    console.warn('Backend rejectRecommendation failed, rejecting in local store:', e);
  }
  const rejected = db.rejectRecommendation(id, performedBy, role as any, operatorNotes);
  return { recommendation: rejected };
}

export async function simulateScenario(scenarioType: string): Promise<import('./types').ScenarioSimulationResult> {
  try {
    const res = await fetch('/api/scenarios/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioType }),
    });
    if (res.ok) {
      return res.json();
    }
  } catch (e) {
    console.warn('Backend simulateScenario failed, simulating in local store:', e);
  }
  return db.simulateScenario(scenarioType as any);
}
