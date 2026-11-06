import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { InventoryItem, UserRole } from '../types';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  preselectedSku?: string;
  preselectedType?: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'TRANSFER';
  userRole: UserRole;
  onSubmit: (payload: {
    sku: string;
    type: 'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER' | 'ADJUSTMENT';
    quantityChange: number;
    reason: string;
    referenceNumber: string;
    targetZone?: string;
  }) => Promise<void>;
}

export const MovementModal: React.FC<MovementModalProps> = ({
  isOpen,
  onClose,
  items,
  preselectedSku,
  preselectedType = 'STOCK_IN',
  userRole,
  onSubmit,
}) => {
  const [sku, setSku] = useState(preselectedSku || (items[0]?.sku ?? ''));
  const [type, setType] = useState<'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER' | 'ADJUSTMENT'>(preselectedType);
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [targetZone, setTargetZone] = useState<string>('Zone B');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedSku) setSku(preselectedSku);
    if (preselectedType) setType(preselectedType);
    setError(null);
  }, [preselectedSku, preselectedType, isOpen]);

  const selectedItem = items.find((i) => i.sku === sku);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      setError('Please select a valid item.');
      return;
    }
    if (quantity <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    if (type === 'STOCK_OUT' && selectedItem.quantity < quantity) {
      setError(`Insufficient stock. Current available quantity is ${selectedItem.quantity} ${selectedItem.unit}.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        sku,
        type,
        quantityChange: quantity,
        reason: reason || `${type} action logged by ${userRole}`,
        referenceNumber: referenceNumber || `${type.slice(0, 3)}-${Date.now().toString().slice(-5)}`,
        targetZone: type === 'TRANSFER' ? targetZone : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record movement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-950/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-purple-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-[#160c29] text-white flex items-center justify-between border-b border-[#291749]">
          <div>
            <h3 className="text-base font-bold">Record Inventory Movement</h3>
            <p className="text-xs text-purple-300/80">
              Update physical stock balance and append to transaction ledger
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Movement Type Radio Tabs */}
          <div>
            <label className="block text-xs font-semibold text-purple-900 mb-1.5">
              Operation Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'STOCK_IN', label: 'Stock-In', icon: ArrowDownLeft, color: 'text-emerald-600' },
                { id: 'STOCK_OUT', label: 'Stock-Out', icon: ArrowUpRight, color: 'text-rose-600' },
                { id: 'TRANSFER', label: 'Transfer', icon: ArrowRightLeft, color: 'text-purple-600' },
                { id: 'ADJUSTMENT', label: 'Audit Adj.', icon: RefreshCw, color: 'text-amber-600' },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = type === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setType(m.id as any)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1a0f30] text-purple-100 border-[#1a0f30] shadow-xs'
                        : 'bg-purple-50/50 hover:bg-purple-100/60 text-purple-900 border-purple-200/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-purple-300' : m.color}`} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SKU Select */}
          <div>
            <label className="block text-xs font-semibold text-purple-900 mb-1">
              Select Product SKU
            </label>
            <select
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50/20 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {items.map((i) => (
                <option key={i.sku} value={i.sku}>
                  [{i.sku}] {i.name} — Current: {i.quantity} {i.unit} ({i.zone})
                </option>
              ))}
            </select>
          </div>

          {/* Item Telemetry Preview */}
          {selectedItem && (
            <div className="p-3 bg-purple-50/40 rounded-lg border border-purple-100 text-xs flex items-center justify-between">
              <div>
                <span className="text-purple-600/70">Current Balance:</span>{' '}
                <span className="font-mono font-bold text-purple-950">
                  {selectedItem.quantity} {selectedItem.unit}
                </span>
                <span className="mx-2 text-purple-200">|</span>
                <span className="text-purple-600/70">Zone:</span>{' '}
                <span className="font-semibold text-slate-800">{selectedItem.zone}</span>
              </div>
              <div>
                <span className="text-purple-600/70">Unit Price:</span>{' '}
                <span className="font-mono font-semibold text-purple-950">
                  ${selectedItem.unitPrice.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* If Transfer, pick Target Zone */}
          {type === 'TRANSFER' && (
            <div>
              <label className="block text-xs font-semibold text-purple-900 mb-1">
                Target Destination Zone
              </label>
              <select
                value={targetZone}
                onChange={(e) => setTargetZone(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/20 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Zone A">Zone A - Electronics Vault</option>
                <option value="Zone B">Zone B - Fast Moving</option>
                <option value="Zone C">Zone C - Heavy Spares</option>
                <option value="Zone D">Zone D - Cold Storage</option>
                <option value="Zone E">Zone E - Dock & Packaging</option>
              </select>
            </div>
          )}

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-semibold text-purple-900 mb-1">
              Quantity ({selectedItem?.unit || 'units'})
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 0))}
              className="w-full px-3 py-2 bg-purple-50/20 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
            />
          </div>

          {/* Reference # */}
          <div>
            <label className="block text-xs font-semibold text-purple-900 mb-1">
              Reference / PO / Order # (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. PO-99210 or ORD-77124"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50/20 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-purple-900 mb-1">
              Reason / Operational Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Inbound supplier shipment receipt, assembly line requisition"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50/20 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-purple-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-200 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
            >
              {loading ? 'Recording...' : 'Commit Movement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
