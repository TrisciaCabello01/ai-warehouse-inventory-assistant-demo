import React, { useState, useEffect, useCallback } from 'react';
import { 
  fetchInventory, 
  fetchTransactions, 
  fetchZones, 
  fetchMetrics, 
  recordMovement, 
  createItem, 
  resetDatabase,
  fetchRecommendations,
  approveRecommendation,
  rejectRecommendation
} from './api';
import { 
  InventoryItem, 
  InventoryTransaction, 
  WarehouseZone, 
  ZoneSummary, 
  WarehouseMetrics, 
  UserRole,
  AIRecommendation 
} from './types';
import { Header } from './components/Header';
import { AIChatPanel } from './components/AIChatPanel';
import { AdvisoryCenter } from './components/AdvisoryCenter';
import { InventoryTable } from './components/InventoryTable';
import { ZoneVisualizer } from './components/ZoneVisualizer';
import { TransactionLedger } from './components/TransactionLedger';
import { ReorderCenter } from './components/ReorderCenter';
import { MovementModal } from './components/MovementModal';
import { NewItemModal } from './components/NewItemModal';
import { ItemDetailModal } from './components/ItemDetailModal';
import { 
  Boxes, 
  DollarSign, 
  TrendingDown, 
  AlertTriangle, 
  Layers, 
  CheckCircle2,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'assistant' | 'advisory' | 'inventory' | 'zones' | 'transactions' | 'reorder'>('assistant');
  const [userRole, setUserRole] = useState<UserRole>('Warehouse Staff');

  // Core Data States
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [zones, setZones] = useState<WarehouseZone[]>([]);
  const [zoneSummaries, setZoneSummaries] = useState<ZoneSummary[]>([]);
  const [metrics, setMetrics] = useState<WarehouseMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [pendingRecsCount, setPendingRecsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [selectedSkuForMovement, setSelectedSkuForMovement] = useState<string | undefined>();
  const [selectedTypeForMovement, setSelectedTypeForMovement] = useState<'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'TRANSFER'>('STOCK_IN');

  const [newItemModalOpen, setNewItemModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadAllData = useCallback(async () => {
    try {
      const [invItems, txns, zoneData, metricData, recData] = await Promise.all([
        fetchInventory(),
        fetchTransactions(50),
        fetchZones(),
        fetchMetrics(),
        fetchRecommendations(),
      ]);
      setItems(invItems);
      setTransactions(txns);
      setZones(zoneData.zones);
      setZoneSummaries(zoneData.zoneSummaries);
      setMetrics(metricData);
      setRecommendations(recData.recommendations);
      setPendingRecsCount(recData.pendingCount);
    } catch (err) {
      console.error('Error fetching warehouse data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Movement handler
  const handleMovementSubmit = async (payload: {
    sku: string;
    type: 'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER' | 'ADJUSTMENT';
    quantityChange: number;
    reason: string;
    referenceNumber: string;
    targetZone?: string;
  }) => {
    await recordMovement({
      ...payload,
      performedBy: userRole === 'Admin' ? 'Logistics Director' : 'Floor Lead Chen',
      role: userRole,
    });
    await loadAllData();
    showToast(
      `Recorded ${payload.type.replace('_', ' ')} of ${payload.quantityChange} units for SKU ${payload.sku}.`
    );
  };

  // Human Approval of AI Advisory Recommendation
  const handleApproveRecommendation = async (id: string, notes?: string) => {
    const operatorName = userRole === 'Admin' ? 'Logistics Director Brody' : 'Floor Lead Chen';
    const res = await approveRecommendation(id, operatorName, userRole, notes);
    await loadAllData();
    showToast(`Approved & Executed AI Recommendation [${id}]: ${res.recommendation.title}`);
  };

  // Human Dismissal of AI Advisory Recommendation
  const handleRejectRecommendation = async (id: string, notes?: string) => {
    const operatorName = userRole === 'Admin' ? 'Logistics Director Brody' : 'Floor Lead Chen';
    await rejectRecommendation(id, operatorName, userRole, notes);
    await loadAllData();
    showToast(`Rejected recommendation [${id}]. Feedback saved for model learning.`);
  };

  // New Item Onboarding handler
  const handleNewItemSubmit = async (item: InventoryItem) => {
    await createItem(
      item,
      userRole === 'Admin' ? 'Logistics Director' : 'Floor Lead Chen',
      userRole
    );
    await loadAllData();
    showToast(`New SKU ${item.sku} successfully cataloged into ${item.zone}!`);
  };

  // Simulate instant restock from Reorder Center
  const handleSimulateRestock = async (sku: string, quantity: number, supplierName: string) => {
    await recordMovement({
      sku,
      type: 'STOCK_IN',
      quantityChange: quantity,
      performedBy: 'Automated Supplier PO Fulfillment',
      role: 'Admin',
      reason: `Expedited shipment delivery from ${supplierName}`,
      referenceNumber: `PO-${Date.now().toString().slice(-6)}`,
    });
    await loadAllData();
    showToast(`Restocked ${quantity} units of ${sku} from ${supplierName}.`);
  };

  // Reset database to default
  const handleResetData = async () => {
    if (window.confirm('Reset warehouse inventory, AI recommendations, and ledgers to initial seed state?')) {
      await resetDatabase();
      await loadAllData();
      showToast('Warehouse dataset restored to default state.');
    }
  };

  // Open movement modal with pre-fill
  const openMovementForSku = (sku: string, type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT') => {
    setSelectedSkuForMovement(sku);
    setSelectedTypeForMovement(type);
    setMovementModalOpen(true);
  };

  // AI Assistant Jump Triggers
  const handleAskAIAboutZone = (zoneCode: string) => {
    setCurrentTab('assistant');
  };

  const handleAskAIAboutReorders = () => {
    setCurrentTab('assistant');
  };

  return (
    <div className="min-h-screen bg-[#faf8fd] text-slate-900 font-sans antialiased flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#160c29] text-white px-4 py-3 rounded-xl shadow-lg border border-purple-800/80 flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Primary Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={userRole}
        setUserRole={setUserRole}
        metrics={metrics}
        pendingRecommendationsCount={pendingRecsCount}
        onOpenMovementModal={() => {
          setSelectedSkuForMovement(undefined);
          setSelectedTypeForMovement('STOCK_IN');
          setMovementModalOpen(true);
        }}
        onOpenNewItemModal={() => setNewItemModalOpen(true)}
        onResetData={handleResetData}
      />

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-purple-700/80">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mb-3" />
            <p className="text-sm font-medium">Syncing warehouse databases & zone metrics...</p>
          </div>
        ) : (
          <>
            {/* View 1: AI Assistant Co-Pilot */}
            {currentTab === 'assistant' && (
              <div className="space-y-6">
                <AIChatPanel
                  userRole={userRole}
                  onSelectSkuForMovement={openMovementForSku}
                  onRefreshData={loadAllData}
                  onNavigateToAdvisory={() => setCurrentTab('advisory')}
                />
              </div>
            )}

            {/* View 2: Human-in-the-Loop Advisory & Approvals Queue */}
            {currentTab === 'advisory' && (
              <div className="space-y-6">
                <AdvisoryCenter
                  recommendations={recommendations}
                  userRole={userRole}
                  onApprove={handleApproveRecommendation}
                  onReject={handleRejectRecommendation}
                  onOpenAssistantWithQuery={(query) => {
                    setCurrentTab('assistant');
                  }}
                />
              </div>
            )}

            {/* View 3: Inventory Catalog Ledger */}
            {currentTab === 'inventory' && (
              <div className="space-y-6">
                {/* Metrics ribbon */}
                {metrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-white rounded-xl border border-purple-200/80 shadow-xs">
                      <div className="text-xs text-purple-600/80 font-medium">Total Inventory Valuation</div>
                      <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                        ${metrics.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Across {metrics.totalSkus} catalog SKUs</div>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-purple-200/80 shadow-xs">
                      <div className="text-xs text-purple-600/80 font-medium">Physical Units In Stock</div>
                      <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                        {metrics.totalQuantity.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">5 storage zones active</div>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-purple-200/80 shadow-xs">
                      <div className="text-xs text-purple-600/80 font-medium">Stock Health Ratio</div>
                      <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                        {Math.round((metrics.healthyStockCount / (metrics.totalSkus || 1)) * 100)}%
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{metrics.healthyStockCount} items at healthy level</div>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-purple-200/80 shadow-xs">
                      <div className="text-xs text-purple-600/80 font-medium">Attention Required</div>
                      <div className={`text-xl font-bold font-mono mt-1 ${metrics.reorderAlerts > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                        {metrics.reorderAlerts} SKUs
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {metrics.outOfStockCount} out of stock · {metrics.lowStockCount} low
                      </div>
                    </div>
                  </div>
                )}

                <InventoryTable
                  items={items}
                  userRole={userRole}
                  onSelectMovement={openMovementForSku}
                  onSelectItemDetail={(it) => setDetailItem(it)}
                />
              </div>
            )}

            {/* View 4: Warehouse Zones Visualizer */}
            {currentTab === 'zones' && (
              <ZoneVisualizer
                zones={zones}
                zoneSummaries={zoneSummaries}
                items={items}
                onSelectZoneFilter={(zoneCode) => {
                  setCurrentTab('inventory');
                }}
                onAskAIAboutZone={handleAskAIAboutZone}
              />
            )}

            {/* View 5: Real-Time Transaction Ledger */}
            {currentTab === 'transactions' && (
              <TransactionLedger
                transactions={transactions}
                onOpenMovementModal={() => {
                  setSelectedSkuForMovement(undefined);
                  setSelectedTypeForMovement('STOCK_IN');
                  setMovementModalOpen(true);
                }}
              />
            )}

            {/* View 6: Reorder & Procurement Center */}
            {currentTab === 'reorder' && (
              <ReorderCenter
                items={items}
                userRole={userRole}
                onSimulateRestock={handleSimulateRestock}
                onAskAIAboutReorders={handleAskAIAboutReorders}
              />
            )}
          </>
        )}
      </main>

      {/* Movement Modal */}
      <MovementModal
        isOpen={movementModalOpen}
        onClose={() => setMovementModalOpen(false)}
        items={items}
        preselectedSku={selectedSkuForMovement}
        preselectedType={selectedTypeForMovement}
        userRole={userRole}
        onSubmit={handleMovementSubmit}
      />

      {/* New Item Modal */}
      <NewItemModal
        isOpen={newItemModalOpen}
        onClose={() => setNewItemModalOpen(false)}
        onSubmit={handleNewItemSubmit}
      />

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onOpenMovement={openMovementForSku}
      />
    </div>
  );
}
