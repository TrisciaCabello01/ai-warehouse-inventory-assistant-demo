import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  Mail, 
  Clock, 
  DollarSign, 
  Download,
  PlusCircle,
  FileText
} from 'lucide-react';
import { InventoryItem, UserRole } from '../types';

interface ReorderCenterProps {
  items: InventoryItem[];
  userRole: UserRole;
  onSimulateRestock: (sku: string, quantity: number, supplierName: string) => Promise<void>;
  onAskAIAboutReorders: () => void;
}

export const ReorderCenter: React.FC<ReorderCenterProps> = ({
  items,
  userRole,
  onSimulateRestock,
  onAskAIAboutReorders,
}) => {
  const [poGenerated, setPoGenerated] = useState<string | null>(null);
  const [processingSku, setProcessingSku] = useState<string | null>(null);

  // Items needing reorder
  const lowStockItems = items.filter(
    (it) => it.status === 'Low Stock' || it.status === 'Out of Stock' || it.quantity <= it.minThreshold
  );

  const totalReplenishmentCost = lowStockItems.reduce((acc, it) => {
    const recommended = Math.max(0, it.maxCapacity - it.quantity);
    return acc + recommended * it.unitPrice;
  }, 0);

  const totalUnitsToReplenish = lowStockItems.reduce((acc, it) => {
    return acc + Math.max(0, it.maxCapacity - it.quantity);
  }, 0);

  const handleRestockClick = async (sku: string, qty: number, supplier: string) => {
    setProcessingSku(sku);
    try {
      await onSimulateRestock(sku, qty, supplier);
    } finally {
      setProcessingSku(null);
    }
  };

  const handleGenerateConsolidatedPO = () => {
    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    setPoGenerated(poNumber);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-purple-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center border border-purple-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Automated Reorder & Procurement Management
            </h2>
          </div>
          <p className="text-xs text-purple-700/80 mt-1">
            OmniStock tracks inventory levels against minimum safety thresholds and auto-computes optimal replenishment quantities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAskAIAboutReorders}
            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Ask AI: "Which items are running low?"
          </button>
          {lowStockItems.length > 0 && userRole === 'Admin' && (
            <button
              onClick={handleGenerateConsolidatedPO}
              className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Consolidated PO</span>
            </button>
          )}
        </div>
      </div>

      {/* PO Generated Notification Banner */}
      {poGenerated && (
        <div className="bg-purple-50 border border-purple-300 rounded-xl p-4 flex items-center justify-between gap-3 text-purple-950 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
            <div>
              <span className="font-bold">Purchase Requisition {poGenerated} Created!</span>{' '}
              <span>
                Consolidated PO for {lowStockItems.length} SKUs ({totalUnitsToReplenish} total units, est. ${totalReplenishmentCost.toLocaleString()}) dispatched to supplier routing queues.
              </span>
            </div>
          </div>
          <button
            onClick={() => setPoGenerated(null)}
            className="font-medium underline hover:text-purple-800 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-purple-200/80 shadow-xs">
          <div className="text-xs text-purple-600/80 font-medium">Flagged Items Under Threshold</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {lowStockItems.length} SKUs
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {items.filter((i) => i.status === 'Out of Stock').length} completely out of stock
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-purple-200/80 shadow-xs">
          <div className="text-xs text-purple-600/80 font-medium">Recommended Replenishment Units</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {totalUnitsToReplenish.toLocaleString()} units
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Brings inventory to maximum target capacity
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-purple-200/80 shadow-xs">
          <div className="text-xs text-purple-600/80 font-medium">Estimated Replenishment Cost</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            ${totalReplenishmentCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Based on supplier contract wholesale rates
          </div>
        </div>
      </div>

      {/* Low Stock Items Table */}
      <div className="bg-white rounded-xl border border-purple-200/80 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-purple-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-purple-950">
            Replenishment Requirements Queue
          </h3>
          <span className="text-xs text-purple-500">
            Lead times range from 2 to 15 days
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-purple-50/50 border-b border-purple-100 text-xs text-purple-900/80 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">SKU & Product</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3">Min Safety Threshold</th>
                <th className="px-4 py-3">Suggested Order Qty</th>
                <th className="px-4 py-3">Estimated Cost</th>
                <th className="px-4 py-3">Supplier & Lead Time</th>
                <th className="px-4 py-3 text-right">Procure Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100/70">
              {lowStockItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                    All inventory items are currently above safety replenishment thresholds.
                  </td>
                </tr>
              ) : (
                lowStockItems.map((item) => {
                  const recommendedQty = Math.max(0, item.maxCapacity - item.quantity);
                  const cost = recommendedQty * item.unitPrice;
                  const isProcessing = processingSku === item.sku;

                  return (
                    <tr key={item.sku} className="hover:bg-purple-50/40 transition-colors">
                      {/* SKU & Product */}
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-bold text-purple-950">
                          {item.sku}
                        </div>
                        <div className="text-xs font-medium text-slate-900">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-purple-500">
                          {item.zone} ({item.binLocation})
                        </div>
                      </td>

                      {/* Current Stock */}
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono text-sm font-bold ${
                            item.quantity === 0
                              ? 'text-rose-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {item.quantity} {item.unit}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {item.status}
                        </div>
                      </td>

                      {/* Safety Threshold */}
                      <td className="px-4 py-3 text-xs font-mono text-slate-700">
                        {item.minThreshold} {item.unit}
                      </td>

                      {/* Suggested Order */}
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-bold text-slate-900">
                          +{recommendedQty} {item.unit}
                        </div>
                        <div className="text-[10px] text-purple-500">
                          Target max: {item.maxCapacity}
                        </div>
                      </td>

                      {/* Estimated Cost */}
                      <td className="px-4 py-3 text-xs font-mono font-bold text-slate-900">
                        ${cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <div className="text-[10px] font-normal text-purple-500">
                          @ ${item.unitPrice.toFixed(2)}/unit
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-slate-900">
                          {item.supplier.name}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-purple-700">
                          <Mail className="w-3 h-3 text-purple-400" />
                          <span>{item.supplier.contactEmail}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-purple-600/70">
                          <Clock className="w-3 h-3 text-purple-400" />
                          <span>Lead time: ~{item.supplier.leadTimeDays} days</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRestockClick(item.sku, recommendedQty, item.supplier.name)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-200 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>{isProcessing ? 'Receiving...' : 'Simulate Delivery'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
