import React from 'react';
import { X, Box, Plus, Minus, Mail, Clock, MapPin, AlertTriangle, ShieldCheck } from 'lucide-react';
import { InventoryItem } from '../types';

interface ItemDetailModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onOpenMovement: (sku: string, type: 'STOCK_IN' | 'STOCK_OUT') => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onOpenMovement,
}) => {
  if (!item) return null;

  const totalValuation = item.quantity * item.unitPrice;
  const pctCapacity = Math.min(100, Math.round((item.quantity / item.maxCapacity) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-950/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-purple-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-[#160c29] text-white flex items-center justify-between border-b border-[#291749]">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-purple-400" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-purple-300">{item.sku}</span>
                <span className="text-xs text-purple-400">·</span>
                <span className="text-xs text-purple-200">{item.category}</span>
              </div>
              <h3 className="text-sm font-bold text-white line-clamp-1">{item.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Main Status & Metrics Card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-purple-50/40 rounded-lg border border-purple-100">
            <div>
              <span className="text-purple-600/80">Current Stock</span>
              <div className="text-base font-bold font-mono text-slate-900">
                {item.quantity} {item.unit}
              </div>
              <span className={`font-semibold ${
                item.status === 'Out of Stock' ? 'text-rose-600' : item.status === 'Low Stock' ? 'text-amber-600' : 'text-emerald-700'
              }`}>
                {item.status}
              </span>
            </div>

            <div>
              <span className="text-purple-600/80">Unit Wholesale</span>
              <div className="text-base font-bold font-mono text-slate-900">
                ${item.unitPrice.toFixed(2)}
              </div>
              <span className="text-slate-500">Per {item.unit}</span>
            </div>

            <div>
              <span className="text-purple-600/80">Total Valuation</span>
              <div className="text-base font-bold font-mono text-slate-900">
                ${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-slate-500">Active asset value</span>
            </div>
          </div>

          {/* Location & Storage Details */}
          <div className="space-y-2 p-3 bg-white rounded-lg border border-purple-200/80">
            <h4 className="font-bold text-purple-950 uppercase tracking-wider">
              Warehouse Placement & Capacity
            </h4>
            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-600" />
                <span>Assigned Zone:</span>
              </span>
              <span className="font-semibold text-slate-900">{item.zone}</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span>Bin Coordinates:</span>
              <span className="font-mono font-bold text-purple-950">{item.binLocation}</span>
            </div>
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-slate-500">
                <span>Storage Utilization ({item.quantity} / {item.maxCapacity})</span>
                <span className="font-mono">{pctCapacity}%</span>
              </div>
              <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${pctCapacity}%` }}
                  className={`h-full rounded-full ${
                    item.status === 'Out of Stock'
                      ? 'bg-rose-500'
                      : item.status === 'Low Stock'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-slate-500 pt-1">
              <span>Safety Reorder Threshold:</span>
              <span className="font-mono font-semibold text-slate-800">{item.minThreshold} {item.unit}</span>
            </div>
          </div>

          {/* Supplier Info */}
          <div className="space-y-2 p-3 bg-white rounded-lg border border-purple-200/80">
            <h4 className="font-bold text-purple-950 uppercase tracking-wider">
              Supplier & Logistics
            </h4>
            <div className="flex items-center justify-between text-slate-700">
              <span>Vendor Name:</span>
              <span className="font-semibold text-slate-900">{item.supplier.name}</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-purple-500" />
                <span>Contact Email:</span>
              </span>
              <span className="font-mono text-purple-950">{item.supplier.contactEmail}</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-purple-500" />
                <span>Procurement Lead Time:</span>
              </span>
              <span className="font-mono font-medium text-slate-900">~{item.supplier.leadTimeDays} days</span>
            </div>
          </div>

          {/* Notes if any */}
          {item.notes && (
            <div className="p-3 bg-purple-50/70 rounded-lg border border-purple-200 text-purple-900">
              <span className="font-semibold">Special Handling Directives:</span> {item.notes}
            </div>
          )}

          {/* Quick Actions Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-purple-100">
            <span className="text-[11px] text-purple-600/70">
              Last restocked: {new Date(item.lastRestocked).toLocaleDateString()}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenMovement(item.sku, 'STOCK_IN');
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Stock In</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenMovement(item.sku, 'STOCK_OUT');
                }}
                disabled={item.quantity <= 0}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-200 text-white rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Stock Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
