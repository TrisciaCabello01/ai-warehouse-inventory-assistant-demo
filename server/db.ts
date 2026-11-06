export interface InventoryItem {
  sku: string;
  name: string;
  category: 'Electronics' | 'Fast Moving' | 'Heavy Parts' | 'Cold Storage' | 'Packaging';
  zone: 'Zone A' | 'Zone B' | 'Zone C' | 'Zone D' | 'Zone E';
  binLocation: string; // e.g. A-12-03
  quantity: number;
  minThreshold: number; // reorder trigger point
  maxCapacity: number;
  unitPrice: number;
  supplier: {
    name: string;
    contactEmail: string;
    leadTimeDays: number;
  };
  unit: string; // 'pcs', 'boxes', 'pallets', 'kg', 'liters'
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

export interface AIRecommendation {
  id: string;
  category: 'REORDER' | 'REALLOCATION' | 'MAINTENANCE' | 'ANOMALY' | 'BUFFER';
  title: string;
  sku?: string;
  itemName?: string;
  summary: string;
  reasoning: string;
  forecastAccuracyPct: number; // e.g. 96.8
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

export const INITIAL_ZONES: WarehouseZone[] = [
  {
    id: 'z-a',
    name: 'High-Value Electronics Vault',
    code: 'Zone A',
    description: 'Secured climate-stabilized zone for sensors, boards, and optical gear.',
    totalCapacityUnits: 5000,
    temperatureControlled: true,
    securityTier: 'High Security',
  },
  {
    id: 'z-b',
    name: 'Fast-Moving Consumer Goods',
    code: 'Zone B',
    description: 'High-velocity flow floor for rapid pick-and-pack fulfillment.',
    totalCapacityUnits: 15000,
    temperatureControlled: false,
    securityTier: 'Standard',
  },
  {
    id: 'z-c',
    name: 'Industrial & Heavy Spares',
    code: 'Zone C',
    description: 'Reinforced pallet racking for heavy machinery parts, bearings, and motors.',
    totalCapacityUnits: 8000,
    temperatureControlled: false,
    securityTier: 'Standard',
  },
  {
    id: 'z-d',
    name: 'Cold Storage & Bio-Chemicals',
    code: 'Zone D',
    description: 'Strict 2°C - 6°C refrigeration bay for thermo-sensitive inventory.',
    totalCapacityUnits: 3500,
    temperatureControlled: true,
    securityTier: 'Restricted',
  },
  {
    id: 'z-e',
    name: 'Receiving, Staging & Packaging',
    code: 'Zone E',
    description: 'Dock cross-docking terminal, corrugated boxes, and outgoing crates.',
    totalCapacityUnits: 6000,
    temperatureControlled: false,
    securityTier: 'Standard',
  },
];

export const INITIAL_ITEMS: InventoryItem[] = [
  {
    sku: 'ELC-1092',
    name: 'Micro-Controller Board v4.2',
    category: 'Electronics',
    zone: 'Zone A',
    binLocation: 'A-01-14',
    quantity: 140,
    minThreshold: 50,
    maxCapacity: 500,
    unitPrice: 42.50,
    supplier: {
      name: 'Apex Semiconductor Corp',
      contactEmail: 'orders@apexsemi.io',
      leadTimeDays: 7,
    },
    unit: 'pcs',
    status: 'In Stock',
    lastRestocked: '2026-10-28T09:15:00Z',
    notes: 'ESD safe bags required during transit.',
  },
  {
    sku: 'ELC-8841',
    name: 'Li-Ion Industrial Battery Pack 48V',
    category: 'Electronics',
    zone: 'Zone A',
    binLocation: 'A-04-02',
    quantity: 18,
    minThreshold: 25,
    maxCapacity: 100,
    unitPrice: 185.00,
    supplier: {
      name: 'VoltCore Energy Tech',
      contactEmail: 'b2b@voltcore.com',
      leadTimeDays: 14,
    },
    unit: 'pcs',
    status: 'Low Stock',
    lastRestocked: '2026-10-15T14:20:00Z',
    notes: 'Fire-resistant storage cabinet.',
  },
  {
    sku: 'ELC-3304',
    name: 'Optical Laser Rangefinder Sensor',
    category: 'Electronics',
    zone: 'Zone A',
    binLocation: 'A-02-08',
    quantity: 6,
    minThreshold: 20,
    maxCapacity: 150,
    unitPrice: 120.00,
    supplier: {
      name: 'Precision Photonics Ltd',
      contactEmail: 'logistics@precisionphoto.com',
      leadTimeDays: 10,
    },
    unit: 'pcs',
    status: 'Low Stock',
    lastRestocked: '2026-10-02T11:00:00Z',
  },
  {
    sku: 'FMC-5001',
    name: 'Thermal Receipt Rolls (50-Pack)',
    category: 'Fast Moving',
    zone: 'Zone B',
    binLocation: 'B-12-01',
    quantity: 450,
    minThreshold: 100,
    maxCapacity: 1200,
    unitPrice: 34.00,
    supplier: {
      name: 'EverPaper Supply Co',
      contactEmail: 'sales@everpaper.com',
      leadTimeDays: 3,
    },
    unit: 'boxes',
    status: 'In Stock',
    lastRestocked: '2026-11-02T08:30:00Z',
  },
  {
    sku: 'FMC-5002',
    name: 'Ergonomic Barcode Scanners (2D Wireless)',
    category: 'Fast Moving',
    zone: 'Zone B',
    binLocation: 'B-03-19',
    quantity: 82,
    minThreshold: 30,
    maxCapacity: 200,
    unitPrice: 89.90,
    supplier: {
      name: 'ScanTech Logistics Global',
      contactEmail: 'dispatch@scantech.net',
      leadTimeDays: 5,
    },
    unit: 'pcs',
    status: 'In Stock',
    lastRestocked: '2026-10-30T16:45:00Z',
  },
  {
    sku: 'FMC-7719',
    name: 'Biodegradable Bubble Wrap Roll (300m)',
    category: 'Fast Moving',
    zone: 'Zone B',
    binLocation: 'B-20-04',
    quantity: 12,
    minThreshold: 40,
    maxCapacity: 150,
    unitPrice: 28.50,
    supplier: {
      name: 'EcoPack Solutions',
      contactEmail: 'support@ecopack.org',
      leadTimeDays: 4,
    },
    unit: 'rolls',
    status: 'Low Stock',
    lastRestocked: '2026-10-18T10:10:00Z',
  },
  {
    sku: 'FMC-9020',
    name: 'Industrial Vinyl Packing Tape (36 Rolls)',
    category: 'Fast Moving',
    zone: 'Zone B',
    binLocation: 'B-15-08',
    quantity: 0,
    minThreshold: 35,
    maxCapacity: 300,
    unitPrice: 45.00,
    supplier: {
      name: 'SealFast Adhesive Corp',
      contactEmail: 'orders@sealfast.com',
      leadTimeDays: 6,
    },
    unit: 'boxes',
    status: 'Out of Stock',
    lastRestocked: '2026-09-24T13:00:00Z',
    notes: 'Urgent reorder required. Supplier out of raw resin until next Tuesday.',
  },
  {
    sku: 'IND-4421',
    name: 'Precision Heavy Ball Bearings (Set of 10)',
    category: 'Heavy Parts',
    zone: 'Zone C',
    binLocation: 'C-08-01',
    quantity: 94,
    minThreshold: 40,
    maxCapacity: 250,
    unitPrice: 62.00,
    supplier: {
      name: 'Titanium Motion Dynamics',
      contactEmail: 'sales@titanium-motion.com',
      leadTimeDays: 9,
    },
    unit: 'sets',
    status: 'In Stock',
    lastRestocked: '2026-10-25T11:40:00Z',
  },
  {
    sku: 'IND-6109',
    name: 'Hydraulic Cylinder Seal Kit',
    category: 'Heavy Parts',
    zone: 'Zone C',
    binLocation: 'C-04-11',
    quantity: 22,
    minThreshold: 20,
    maxCapacity: 120,
    unitPrice: 115.00,
    supplier: {
      name: 'Vortex Fluid Systems',
      contactEmail: 'parts@vortexfluid.com',
      leadTimeDays: 12,
    },
    unit: 'kits',
    status: 'In Stock',
    lastRestocked: '2026-10-10T09:00:00Z',
  },
  {
    sku: 'IND-9932',
    name: 'Cast Iron Flange Coupling 2-Inch',
    category: 'Heavy Parts',
    zone: 'Zone C',
    binLocation: 'C-11-03',
    quantity: 15,
    minThreshold: 25,
    maxCapacity: 80,
    unitPrice: 98.00,
    supplier: {
      name: 'Nordic Foundry Works',
      contactEmail: 'export@nordicfoundry.eu',
      leadTimeDays: 15,
    },
    unit: 'pcs',
    status: 'Low Stock',
    lastRestocked: '2026-09-30T15:20:00Z',
  },
  {
    sku: 'COL-2101',
    name: 'Medical Grade Adhesive Gel (5L Container)',
    category: 'Cold Storage',
    zone: 'Zone D',
    binLocation: 'D-02-05',
    quantity: 45,
    minThreshold: 20,
    maxCapacity: 100,
    unitPrice: 210.00,
    supplier: {
      name: 'BioTherm Reagents Int.',
      contactEmail: 'orders@biotherm.ch',
      leadTimeDays: 8,
    },
    unit: 'containers',
    status: 'In Stock',
    lastRestocked: '2026-11-01T07:15:00Z',
    notes: 'Maintain temperature strictly between 3°C and 5°C.',
  },
  {
    sku: 'COL-3388',
    name: 'Enzyme Assay Substrate Kits',
    category: 'Cold Storage',
    zone: 'Zone D',
    binLocation: 'D-01-09',
    quantity: 8,
    minThreshold: 15,
    maxCapacity: 60,
    unitPrice: 380.00,
    supplier: {
      name: 'GeneBio Synthetics',
      contactEmail: 'shipments@genebiosyn.com',
      leadTimeDays: 11,
    },
    unit: 'kits',
    status: 'Low Stock',
    lastRestocked: '2026-10-12T13:40:00Z',
  },
  {
    sku: 'PKG-1001',
    name: 'Heavy-Duty Corrugated Cartons (Size L, 25-pk)',
    category: 'Packaging',
    zone: 'Zone E',
    binLocation: 'E-05-01',
    quantity: 320,
    minThreshold: 100,
    maxCapacity: 800,
    unitPrice: 22.00,
    supplier: {
      name: 'BoxCraft Containers LLC',
      contactEmail: 'wholesale@boxcraft.com',
      leadTimeDays: 2,
    },
    unit: 'packs',
    status: 'In Stock',
    lastRestocked: '2026-11-03T14:10:00Z',
  },
  {
    sku: 'PKG-2044',
    name: 'Poly Strapping Banding Roll (1000m)',
    category: 'Packaging',
    zone: 'Zone E',
    binLocation: 'E-02-04',
    quantity: 38,
    minThreshold: 15,
    maxCapacity: 90,
    unitPrice: 54.00,
    supplier: {
      name: 'BoxCraft Containers LLC',
      contactEmail: 'wholesale@boxcraft.com',
      leadTimeDays: 2,
    },
    unit: 'rolls',
    status: 'In Stock',
    lastRestocked: '2026-10-27T10:00:00Z',
  },
  {
    sku: 'PKG-3099',
    name: 'Wooden Shipping Pallets (Euro Standard)',
    category: 'Packaging',
    zone: 'Zone E',
    binLocation: 'E-09-00',
    quantity: 110,
    minThreshold: 50,
    maxCapacity: 250,
    unitPrice: 18.50,
    supplier: {
      name: 'TimberLogix Pallet Co',
      contactEmail: 'dispatch@timberlogix.net',
      leadTimeDays: 4,
    },
    unit: 'pcs',
    status: 'In Stock',
    lastRestocked: '2026-10-29T16:00:00Z',
  }
];

export const INITIAL_TRANSACTIONS: InventoryTransaction[] = [
  {
    id: 'TXN-9021',
    timestamp: '2026-11-05T18:30:00Z',
    sku: 'FMC-5001',
    itemName: 'Thermal Receipt Rolls (50-Pack)',
    type: 'STOCK_OUT',
    quantity: 50,
    previousQuantity: 500,
    newQuantity: 450,
    sourceZone: 'Zone B',
    performedBy: 'David Chen',
    role: 'Warehouse Staff',
    reason: 'Customer Order #ORD-88210 fulfillment',
    referenceNumber: 'ORD-88210',
  },
  {
    id: 'TXN-9020',
    timestamp: '2026-11-05T14:15:00Z',
    sku: 'ELC-8841',
    itemName: 'Li-Ion Industrial Battery Pack 48V',
    type: 'STOCK_OUT',
    quantity: 4,
    previousQuantity: 22,
    newQuantity: 18,
    sourceZone: 'Zone A',
    performedBy: 'Sarah Jenkins',
    role: 'Warehouse Staff',
    reason: 'Assembly line requisition #REQ-4401',
    referenceNumber: 'REQ-4401',
  },
  {
    id: 'TXN-9019',
    timestamp: '2026-11-05T09:45:00Z',
    sku: 'COL-2101',
    itemName: 'Medical Grade Adhesive Gel (5L Container)',
    type: 'STOCK_IN',
    quantity: 15,
    previousQuantity: 30,
    newQuantity: 45,
    targetZone: 'Zone D',
    performedBy: 'Marcus Brody',
    role: 'Admin',
    reason: 'Scheduled restock delivery PO #PO-99124',
    referenceNumber: 'PO-99124',
  },
  {
    id: 'TXN-9018',
    timestamp: '2026-11-04T16:20:00Z',
    sku: 'FMC-9020',
    itemName: 'Industrial Vinyl Packing Tape (36 Rolls)',
    type: 'STOCK_OUT',
    quantity: 25,
    previousQuantity: 25,
    newQuantity: 0,
    sourceZone: 'Zone B',
    performedBy: 'Elena Rostova',
    role: 'Warehouse Staff',
    reason: 'Warehouse packaging bay consumption',
    referenceNumber: 'INT-BAY-3',
  },
  {
    id: 'TXN-9017',
    timestamp: '2026-11-04T11:00:00Z',
    sku: 'PKG-1001',
    itemName: 'Heavy-Duty Corrugated Cartons (Size L, 25-pk)',
    type: 'STOCK_IN',
    quantity: 100,
    previousQuantity: 220,
    newQuantity: 320,
    targetZone: 'Zone E',
    performedBy: 'Marcus Brody',
    role: 'Admin',
    reason: 'Bulk supplier shipment PO #PO-99119',
    referenceNumber: 'PO-99119',
  },
  {
    id: 'TXN-9016',
    timestamp: '2026-11-03T15:10:00Z',
    sku: 'IND-9932',
    itemName: 'Cast Iron Flange Coupling 2-Inch',
    type: 'ADJUSTMENT',
    quantity: -3,
    previousQuantity: 18,
    newQuantity: 15,
    sourceZone: 'Zone C',
    performedBy: 'Marcus Brody',
    role: 'Admin',
    reason: 'Annual cycle audit count reconciliation (damaged in transit)',
    referenceNumber: 'AUD-2026-Q4',
  },
  {
    id: 'TXN-9015',
    timestamp: '2026-11-02T13:00:00Z',
    sku: 'FMC-5002',
    itemName: 'Ergonomic Barcode Scanners (2D Wireless)',
    type: 'TRANSFER',
    quantity: 10,
    previousQuantity: 82,
    newQuantity: 82,
    sourceZone: 'Zone E',
    targetZone: 'Zone B',
    performedBy: 'David Chen',
    role: 'Warehouse Staff',
    reason: 'Inter-zone relocation from dock staging to primary bin',
    referenceNumber: 'TRF-0091',
  }
];

export const INITIAL_RECOMMENDATIONS: AIRecommendation[] = [
  {
    id: 'REC-301',
    category: 'REORDER',
    title: 'Emergency Replenishment PO: Industrial Vinyl Packing Tape',
    sku: 'FMC-9020',
    itemName: 'Industrial Vinyl Packing Tape (36 Rolls)',
    summary: 'Predictive model forecasts 100% stockout impact on Zone B fulfillment within 48 hours unless replenishment PO is dispatched.',
    reasoning: 'Outbound packaging consumption has consumed all 25 reserve boxes. Current stock is 0 with 40 orders queued in WMS.',
    forecastAccuracyPct: 97.4,
    urgency: 'CRITICAL',
    impactStatement: 'Averts fulfillment packaging freeze across 85 daily customer order shipments.',
    suggestedAction: {
      type: 'STOCK_IN',
      quantity: 150,
      estimatedCost: 6750.00,
    },
    status: 'PENDING_APPROVAL',
    generatedAt: '2026-11-05T19:00:00Z',
  },
  {
    id: 'REC-302',
    category: 'REALLOCATION',
    title: 'Pick-Path Optimization: Corrugated Cartons to Forward Floor',
    sku: 'PKG-1001',
    itemName: 'Heavy-Duty Corrugated Cartons (Size L, 25-pk)',
    summary: 'Move 60 packs from Zone E (Dock Staging) to Zone B (Fast Moving forward pick face).',
    reasoning: 'AI travel simulation calculates pickers currently walk 340m round-trip per order to retrieve carton stock from the rear staging bay.',
    forecastAccuracyPct: 95.8,
    urgency: 'HIGH',
    impactStatement: 'Reduces manual travel distance by 21.5% and accelerates average pick-and-pack turnaround by 4.2 minutes per order.',
    suggestedAction: {
      type: 'TRANSFER',
      quantity: 60,
      sourceZone: 'Zone E',
      targetZone: 'Zone B',
    },
    status: 'PENDING_APPROVAL',
    generatedAt: '2026-11-05T17:30:00Z',
  },
  {
    id: 'REC-303',
    category: 'MAINTENANCE',
    title: 'Zone D Cold Storage Sub-Bay D-02 Preventive Inspection',
    sku: 'COL-2101',
    itemName: 'Medical Grade Adhesive Gel (5L Container)',
    summary: 'Schedule HVAC sensor inspection for Cold Storage Bay D-02 compressor unit.',
    reasoning: 'IoT ambient temperature sensors logged intermittent +1.6°C variances outside nominal 2°C–6°C bands during peak compressor cycles.',
    forecastAccuracyPct: 98.2,
    urgency: 'HIGH',
    impactStatement: 'Protects $9,450.00 of temperature-sensitive biological and medical adhesive inventory from spoilage.',
    suggestedAction: {
      type: 'MAINTENANCE_SCHEDULE',
    },
    status: 'PENDING_APPROVAL',
    generatedAt: '2026-11-05T15:10:00Z',
  },
  {
    id: 'REC-304',
    category: 'BUFFER',
    title: 'Dynamic Safety Stock Elevation: Micro-Controller Board v4.2',
    sku: 'ELC-1092',
    itemName: 'Micro-Controller Board v4.2',
    summary: 'Elevate minimum safety stock threshold from 50 to 75 units ahead of projected assembly spike.',
    reasoning: '30-day moving average outbound rate increased from 14 units/week to 38 units/week. Supplier lead time is 7 days.',
    forecastAccuracyPct: 96.1,
    urgency: 'MEDIUM',
    impactStatement: 'Maintains 99.2% customer order fulfillment service level through December robotics manufacturing cycle.',
    suggestedAction: {
      type: 'BUFFER_ADJUSTMENT',
      newMinThreshold: 75,
    },
    status: 'PENDING_APPROVAL',
    generatedAt: '2026-11-05T12:00:00Z',
  },
];

class InventoryDatabase {
  private items: Map<string, InventoryItem>;
  private transactions: InventoryTransaction[];
  private zones: WarehouseZone[];
  private recommendations: Map<string, AIRecommendation>;

  constructor() {
    this.items = new Map();
    this.transactions = [];
    this.zones = [...INITIAL_ZONES];
    this.recommendations = new Map();
    this.reset();
  }

  reset() {
    this.items.clear();
    for (const item of INITIAL_ITEMS) {
      this.items.set(item.sku, { ...item });
    }
    this.transactions = [...INITIAL_TRANSACTIONS];
    this.recommendations.clear();
    for (const rec of INITIAL_RECOMMENDATIONS) {
      this.recommendations.set(rec.id, { ...rec });
    }
    this.recalculateAllStatuses();
  }

  private recalculateStatus(item: InventoryItem): InventoryItem['status'] {
    if (item.quantity <= 0) return 'Out of Stock';
    if (item.quantity <= item.minThreshold) return 'Low Stock';
    if (item.quantity > item.maxCapacity) return 'Overstocked';
    return 'In Stock';
  }

  private recalculateAllStatuses() {
    for (const item of this.items.values()) {
      item.status = this.recalculateStatus(item);
    }
  }

  getAllItems(): InventoryItem[] {
    return Array.from(this.items.values());
  }

  getItem(sku: string): InventoryItem | undefined {
    return this.items.get(sku.trim().toUpperCase());
  }

  getZones(): WarehouseZone[] {
    return [...this.zones];
  }

  getTransactions(limit = 50): InventoryTransaction[] {
    return [...this.transactions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  getMetrics() {
    const items = this.getAllItems();
    const totalSkus = items.length;
    const totalQuantity = items.reduce((acc, it) => acc + it.quantity, 0);
    const totalValuation = items.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
    const lowStockCount = items.filter(it => it.status === 'Low Stock').length;
    const outOfStockCount = items.filter(it => it.status === 'Out of Stock').length;
    const healthyStockCount = items.filter(it => it.status === 'In Stock').length;

    // Zone breakdown
    const zoneSummaries = this.zones.map(z => {
      const zoneItems = items.filter(it => it.zone === z.code);
      const zoneQuantity = zoneItems.reduce((acc, it) => acc + it.quantity, 0);
      const zoneValuation = zoneItems.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
      const zoneLowStock = zoneItems.filter(it => it.status === 'Low Stock' || it.status === 'Out of Stock').length;
      const utilizationPct = Math.min(100, Math.round((zoneQuantity / z.totalCapacityUnits) * 100));

      return {
        zoneCode: z.code,
        name: z.name,
        totalItems: zoneItems.length,
        totalQuantity: zoneQuantity,
        totalValuation: zoneValuation,
        capacity: z.totalCapacityUnits,
        utilizationPct,
        lowStockAlerts: zoneLowStock,
      };
    });

    return {
      totalSkus,
      totalQuantity,
      totalValuation,
      lowStockCount,
      outOfStockCount,
      healthyStockCount,
      reorderAlerts: lowStockCount + outOfStockCount,
      zoneSummaries,
    };
  }

  createItem(item: InventoryItem, performedBy: string, role: 'Admin' | 'Warehouse Staff'): InventoryItem {
    const sku = item.sku.trim().toUpperCase();
    if (this.items.has(sku)) {
      throw new Error(`Item with SKU '${sku}' already exists.`);
    }

    const newItem: InventoryItem = {
      ...item,
      sku,
      status: this.recalculateStatus(item),
      lastRestocked: new Date().toISOString(),
    };

    this.items.set(sku, newItem);

    // Record initial transaction
    this.addTransaction({
      sku: newItem.sku,
      itemName: newItem.name,
      type: 'STOCK_IN',
      quantity: newItem.quantity,
      previousQuantity: 0,
      newQuantity: newItem.quantity,
      targetZone: newItem.zone,
      performedBy,
      role,
      reason: 'New SKU catalog onboarding',
      referenceNumber: `NEW-${sku}`,
    });

    return newItem;
  }

  updateItem(sku: string, updates: Partial<InventoryItem>): InventoryItem {
    const current = this.getItem(sku);
    if (!current) {
      throw new Error(`SKU '${sku}' not found.`);
    }

    const updated: InventoryItem = {
      ...current,
      ...updates,
      sku: current.sku, // immutable
    };

    updated.status = this.recalculateStatus(updated);
    this.items.set(current.sku, updated);
    return updated;
  }

  recordStockMovement(params: {
    sku: string;
    type: 'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER' | 'ADJUSTMENT';
    quantityChange: number; // positive or negative
    performedBy: string;
    role: 'Admin' | 'Warehouse Staff';
    reason: string;
    referenceNumber?: string;
    targetZone?: 'Zone A' | 'Zone B' | 'Zone C' | 'Zone D' | 'Zone E';
  }): { item: InventoryItem; transaction: InventoryTransaction } {
    const item = this.getItem(params.sku);
    if (!item) {
      throw new Error(`SKU '${params.sku}' not found.`);
    }

    const prevQty = item.quantity;
    let nextQty = prevQty;

    if (params.type === 'STOCK_IN') {
      if (params.quantityChange <= 0) {
        throw new Error('Stock-In quantity must be greater than 0.');
      }
      nextQty = prevQty + params.quantityChange;
      item.lastRestocked = new Date().toISOString();
    } else if (params.type === 'STOCK_OUT') {
      if (params.quantityChange <= 0) {
        throw new Error('Stock-Out quantity must be greater than 0.');
      }
      if (prevQty < params.quantityChange) {
        throw new Error(`Insufficient stock. Current quantity is ${prevQty}, requested ${params.quantityChange}.`);
      }
      nextQty = prevQty - params.quantityChange;
    } else if (params.type === 'ADJUSTMENT') {
      // quantityChange is the delta (+ or -) or new total
      nextQty = Math.max(0, prevQty + params.quantityChange);
    } else if (params.type === 'TRANSFER') {
      if (params.targetZone && params.targetZone !== item.zone) {
        item.zone = params.targetZone;
      }
    }

    item.quantity = nextQty;
    item.status = this.recalculateStatus(item);
    this.items.set(item.sku, item);

    const txn: InventoryTransaction = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      sku: item.sku,
      itemName: item.name,
      type: params.type,
      quantity: Math.abs(params.quantityChange),
      previousQuantity: prevQty,
      newQuantity: nextQty,
      sourceZone: item.zone,
      targetZone: params.targetZone,
      performedBy: params.performedBy || 'Warehouse System',
      role: params.role || 'Warehouse Staff',
      reason: params.reason || `Manual ${params.type} action`,
      referenceNumber: params.referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
    };

    this.transactions.unshift(txn);
    return { item, transaction: txn };
  }

  private addTransaction(txn: Omit<InventoryTransaction, 'id' | 'timestamp'>) {
    this.transactions.unshift({
      ...txn,
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
    });
  }

  getRecommendations(): AIRecommendation[] {
    return Array.from(this.recommendations.values()).sort((a, b) => {
      // Sort PENDING_APPROVAL first, then by date
      if (a.status === 'PENDING_APPROVAL' && b.status !== 'PENDING_APPROVAL') return -1;
      if (b.status === 'PENDING_APPROVAL' && a.status !== 'PENDING_APPROVAL') return 1;
      return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
    });
  }

  getPendingRecommendationsCount(): number {
    return Array.from(this.recommendations.values()).filter(
      (r) => r.status === 'PENDING_APPROVAL'
    ).length;
  }

  approveRecommendation(
    id: string,
    performedBy: string,
    role: 'Admin' | 'Warehouse Staff',
    operatorNotes?: string
  ): { recommendation: AIRecommendation; executedTransaction?: InventoryTransaction } {
    const rec = this.recommendations.get(id);
    if (!rec) {
      throw new Error(`Recommendation '${id}' not found.`);
    }
    if (rec.status !== 'PENDING_APPROVAL') {
      throw new Error(`Recommendation '${id}' is already ${rec.status}.`);
    }

    let executedTransaction: InventoryTransaction | undefined;

    // Execute the Human-Approved Action based on recommendation type
    if (rec.suggestedAction.type === 'STOCK_IN' && rec.sku && rec.suggestedAction.quantity) {
      const res = this.recordStockMovement({
        sku: rec.sku,
        type: 'STOCK_IN',
        quantityChange: rec.suggestedAction.quantity,
        performedBy,
        role,
        reason: `Approved AI Recommendation [${rec.id}]: ${rec.title}`,
        referenceNumber: `REC-APV-${rec.id.replace('REC-', '')}`,
      });
      executedTransaction = res.transaction;
    } else if (rec.suggestedAction.type === 'TRANSFER' && rec.sku && rec.suggestedAction.quantity) {
      const res = this.recordStockMovement({
        sku: rec.sku,
        type: 'TRANSFER',
        quantityChange: rec.suggestedAction.quantity,
        performedBy,
        role,
        reason: `Approved AI Spatial Optimization [${rec.id}]: ${rec.title}`,
        referenceNumber: `REC-TRF-${rec.id.replace('REC-', '')}`,
        targetZone: rec.suggestedAction.targetZone,
      });
      executedTransaction = res.transaction;
    } else if (rec.suggestedAction.type === 'BUFFER_ADJUSTMENT' && rec.sku && rec.suggestedAction.newMinThreshold) {
      const item = this.getItem(rec.sku);
      if (item) {
        item.minThreshold = rec.suggestedAction.newMinThreshold;
        item.status = this.recalculateStatus(item);
        this.items.set(item.sku, item);

        this.addTransaction({
          sku: item.sku,
          itemName: item.name,
          type: 'ADJUSTMENT',
          quantity: 0,
          previousQuantity: item.quantity,
          newQuantity: item.quantity,
          sourceZone: item.zone,
          performedBy,
          role,
          reason: `Approved AI Dynamic Buffer [${rec.id}]: Threshold updated to ${item.minThreshold} units`,
          referenceNumber: `REC-BUF-${rec.id.replace('REC-', '')}`,
        });
      }
    } else if (rec.suggestedAction.type === 'MAINTENANCE_SCHEDULE') {
      this.addTransaction({
        sku: rec.sku || 'ZONE-D-HVAC',
        itemName: rec.itemName || 'Zone D Compressor Unit',
        type: 'ADJUSTMENT',
        quantity: 0,
        previousQuantity: 0,
        newQuantity: 0,
        sourceZone: 'Zone D',
        performedBy,
        role,
        reason: `Approved AI Maintenance Work Order [${rec.id}]: Work order #WO-4819 dispatched to facilities engineering`,
        referenceNumber: `WO-4819`,
      });
    }

    rec.status = 'APPROVED';
    rec.reviewedBy = performedBy;
    rec.reviewedAt = new Date().toISOString();
    rec.operatorNotes = operatorNotes || 'Approved for operational execution by human supervisor.';
    this.recommendations.set(rec.id, rec);

    return { recommendation: rec, executedTransaction };
  }

  rejectRecommendation(
    id: string,
    performedBy: string,
    role: 'Admin' | 'Warehouse Staff',
    operatorNotes?: string
  ): AIRecommendation {
    const rec = this.recommendations.get(id);
    if (!rec) {
      throw new Error(`Recommendation '${id}' not found.`);
    }
    rec.status = 'REJECTED';
    rec.reviewedBy = performedBy;
    rec.reviewedAt = new Date().toISOString();
    rec.operatorNotes = operatorNotes || 'Rejected by human operator after review.';
    this.recommendations.set(rec.id, rec);
    return rec;
  }

  simulateScenario(scenarioType: string): ScenarioSimulationResult {
    const items = this.getAllItems();

    if (scenarioType === 'HOLIDAY_SURGE') {
      return {
        scenarioId: 'SCEN-HOLIDAY',
        scenarioName: 'Q4 Peak Season & Holiday Surge (+35% Velocity)',
        demandMultiplier: 1.35,
        simulatedDays: 30,
        forecastConfidencePct: 96.8,
        summary: 'Simulates +35% outbound shipping acceleration across consumer, packaging, and electronics SKUs over the next 30 days.',
        vulnerableSkus: [
          {
            sku: 'FMC-9020',
            name: 'Industrial Vinyl Packing Tape',
            currentStock: this.getItem('FMC-9020')?.quantity || 0,
            projectedDemand: 165,
            daysUntilStockout: 0,
            recommendedMitigation: 'Emergency Purchase Order of 200 boxes; expedite supplier dispatch.',
          },
          {
            sku: 'ELC-3304',
            name: 'Optical Laser Rangefinder Sensor',
            currentStock: this.getItem('ELC-3304')?.quantity || 6,
            projectedDemand: 28,
            daysUntilStockout: 4,
            recommendedMitigation: 'Issue PO for 45 units immediately. Lead time is 10 days.',
          },
          {
            sku: 'PKG-1001',
            name: 'Heavy-Duty Corrugated Cartons',
            currentStock: this.getItem('PKG-1001')?.quantity || 320,
            projectedDemand: 450,
            daysUntilStockout: 14,
            recommendedMitigation: 'Reorder 250 packs on regular 2-day supplier routing.',
          },
        ],
        aiAdvisoryGuidance:
          'Human-in-the-loop recommendation: Approve PO #REC-301 for packing tape and establish secondary forward pick faces in Zone B to prevent packing conveyor starvation.',
      };
    }

    if (scenarioType === 'SUPPLIER_DELAY') {
      return {
        scenarioId: 'SCEN-DELAY',
        scenarioName: 'Supply Chain Bottleneck (+10 Days Lead Time Extension)',
        demandMultiplier: 1.0,
        simulatedDays: 45,
        forecastConfidencePct: 95.2,
        summary: 'Simulates a 10-day overseas freight and customs delay across international vendors.',
        vulnerableSkus: [
          {
            sku: 'ELC-8841',
            name: 'Li-Ion Industrial Battery Pack 48V',
            currentStock: this.getItem('ELC-8841')?.quantity || 18,
            projectedDemand: 32,
            daysUntilStockout: 11,
            recommendedMitigation: 'Pre-order 30 units with domestic emergency premium vendor.',
          },
          {
            sku: 'COL-3388',
            name: 'Enzyme Assay Substrate Kits',
            currentStock: this.getItem('COL-3388')?.quantity || 8,
            projectedDemand: 18,
            daysUntilStockout: 13,
            recommendedMitigation: 'Quarantine reserve kit for high-priority hospital contracts.',
          },
        ],
        aiAdvisoryGuidance:
          'Advisory recommendation: Approve domestic buffer pre-orders to bridge the 10-day port delay window.',
      };
    }

    // Default: Zone D Climate Anomaly
    return {
      scenarioId: 'SCEN-CLIMATE',
      scenarioName: 'Cold Chain HVAC Degradation & Thermal Drift',
      demandMultiplier: 1.0,
      simulatedDays: 7,
      forecastConfidencePct: 98.4,
      summary: 'Models a potential failure of Zone D Sub-bay D-02 cooling compressor during peak summer load.',
      vulnerableSkus: [
        {
          sku: 'COL-2101',
          name: 'Medical Grade Adhesive Gel',
          currentStock: this.getItem('COL-2101')?.quantity || 45,
          projectedDemand: 10,
          daysUntilStockout: 99,
          recommendedMitigation: 'Temporary relocation of 45 containers to Bay D-01 backup chiller.',
        },
        {
          sku: 'COL-3388',
          name: 'Enzyme Assay Substrate Kits',
          currentStock: this.getItem('COL-3388')?.quantity || 8,
          projectedDemand: 4,
          daysUntilStockout: 99,
          recommendedMitigation: 'Relocate 8 kits to emergency cryogenic locker.',
        },
      ],
      aiAdvisoryGuidance:
        'Advisory recommendation: Approve Preventive Work Order #REC-303 and trigger inter-bay precautionary relocation.',
    };
  }
}

export const db = new InventoryDatabase();
