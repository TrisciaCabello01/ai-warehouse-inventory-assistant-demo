export interface InventoryItem {
  sku: string;
  name: string;
  category: 'Electronics' | 'Fast Moving' | 'Heavy Parts' | 'Cold Storage' | 'Packaging';
  zone: 'Zone A' | 'Zone B' | 'Zone C' | 'Zone D' | 'Zone E';
  binLocation: string;
  quantity: number;
  minThreshold: number;
  maxCapacity: number;
  unitPrice: number;
  supplier: {
    name: string;
    contactEmail: string;
    leadTimeDays: number;
  };
  unit: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstocked';
  lastRestocked: string;
  notes?: string;
}

export interface InventoryTransaction {
  id: string;
  timestamp: string;
  sku: string;
  itemName: string;
  type: 'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  sourceZone?: string;
  targetZone?: string;
  performedBy: string;
  role: 'Admin' | 'Warehouse Staff';
  reason: string;
  referenceNumber: string;
}

export interface WarehouseZone {
  id: string;
  name: string;
  code: 'Zone A' | 'Zone B' | 'Zone C' | 'Zone D' | 'Zone E';
  description: string;
  totalCapacityUnits: number;
  temperatureControlled: boolean;
  securityTier: 'Standard' | 'Restricted' | 'High Security';
}

export interface ZoneSummary {
  zoneCode: string;
  name: string;
  totalItems: number;
  totalQuantity: number;
  totalValuation: number;
  capacity: number;
  utilizationPct: number;
  lowStockAlerts: number;
}

export interface WarehouseMetrics {
  totalSkus: number;
  totalQuantity: number;
  totalValuation: number;
  lowStockCount: number;
  outOfStockCount: number;
  healthyStockCount: number;
  reorderAlerts: number;
  zoneSummaries: ZoneSummary[];
}

export interface AIRecommendation {
  id: string;
  category: 'REORDER' | 'REALLOCATION' | 'MAINTENANCE' | 'ANOMALY' | 'BUFFER';
  title: string;
  sku?: string;
  itemName?: string;
  summary: string;
  reasoning: string;
  forecastAccuracyPct: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  impactStatement: string;
  suggestedAction: {
    type: 'STOCK_IN' | 'TRANSFER' | 'MAINTENANCE_SCHEDULE' | 'BUFFER_ADJUSTMENT';
    quantity?: number;
    sourceZone?: string;
    targetZone?: 'Zone A' | 'Zone B' | 'Zone C' | 'Zone D' | 'Zone E';
    newMinThreshold?: number;
    estimatedCost?: number;
  };
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  generatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  operatorNotes?: string;
}

export interface ScenarioSimulationResult {
  scenarioId: string;
  scenarioName: string;
  demandMultiplier: number;
  simulatedDays: number;
  forecastConfidencePct: number;
  summary: string;
  vulnerableSkus: Array<{
    sku: string;
    name: string;
    currentStock: number;
    projectedDemand: number;
    daysUntilStockout: number;
    recommendedMitigation: string;
  }>;
  aiAdvisoryGuidance: string;
}

export interface ToolInvocation {
  name: string;
  args: any;
  result: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolInvocations?: ToolInvocation[];
  matchedItems?: InventoryItem[];
  suggestedActions?: string[];
  isPending?: boolean;
}

export type UserRole = 'Admin' | 'Warehouse Staff';
