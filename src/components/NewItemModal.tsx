import React, { useState } from 'react';
import { X, Plus, Box } from 'lucide-react';
import { InventoryItem } from '../types';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: InventoryItem) => Promise<void>;
}

export const NewItemModal: React.FC<NewItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('Fast Moving');
  const [zone, setZone] = useState<InventoryItem['zone']>('Zone B');
  const [binLocation, setBinLocation] = useState('B-01-01');
  const [quantity, setQuantity] = useState(50);
  const [minThreshold, setMinThreshold] = useState(20);
  const [maxCapacity, setMaxCapacity] = useState(200);
  const [unitPrice, setUnitPrice] = useState(25.00);
  const [unit, setUnit] = useState('pcs');
  const [supplierName, setSupplierName] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState(5);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) {
      setError('SKU and Product Name are required.');
      return;
    }
    if (!supplierName.trim()) {
      setError('Supplier Name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    const newItem: InventoryItem = {
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category,
      zone,
      binLocation: binLocation.trim().toUpperCase(),
      quantity,
      minThreshold,
      maxCapacity,
      unitPrice,
      unit,
      supplier: {
        name: supplierName.trim(),
        contactEmail: supplierEmail.trim() || 'orders@supplier.com',
        leadTimeDays,
      },
      status: quantity <= 0 ? 'Out of Stock' : quantity <= minThreshold ? 'Low Stock' : 'In Stock',
      lastRestocked: new Date().toISOString(),
      notes: notes.trim() || undefined,
    };

    try {
      await onSubmit(newItem);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-purple-200 max-w-xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-[#160c29] text-white flex items-center justify-between border-b border-[#291749]">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-base font-bold">Catalog New Inventory SKU</h3>
              <p className="text-xs text-purple-300/80">Onboard a new product to warehouse storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-purple-900 mb-1">
                SKU Identifier *
              </label>
              <input
                type="text"
                placeholder="e.g. ELC-9901 or FMC-2201"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                className="w-full px-3 py-2 bg-purple-50/20 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-900 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-purple-50/20 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Electronics">Electronics</option>
                <option value="Fast Moving">Fast Moving</option>
                <option value="Heavy Parts">Heavy Parts</option>
                <option value="Cold Storage">Cold Storage</option>
                <option value="Packaging">Packaging</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-900 mb-1">
              Product Title / Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Wireless Barcode Scanner Holster"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-purple-50/20 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-purple-900 mb-1">
                Assigned Storage Zone
              </label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value as any)}
                className="w-full px-3 py-2 bg-purple-50/20 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Zone A">Zone A - Electronics Vault</option>
                <option value="Zone B">Zone B - Fast Moving</option>
                <option value="Zone C">Zone C - Heavy Spares</option>
                <option value="Zone D">Zone D - Cold Storage</option>
                <option value="Zone E">Zone E - Dock & Packaging</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-900 mb-1">
                Bin Coordinate Location
              </label>
              <input
                type="text"
                placeholder="e.g. B-04-12"
                value={binLocation}
                onChange={(e) => setBinLocation(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/20 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-purple-900 mb-1">
                Initial Stock
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-purple-50/20 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-900 mb-1">
                Min Threshold
              </label>
              <input
                type="number"
                min="1"
                value={minThreshold}
                onChange={(e) => setMinThreshold(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-purple-50/20 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-900 mb-1">
                Max Capacity
              </label>
              <input
                type="number"
                min="1"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(parseInt(e.target.value, 10) || 100)}
                className="w-full px-3 py-2 bg-purple-50/20 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-900 mb-1">
                Unit
              </label>
              <input
                type="text"
                placeholder="pcs, boxes"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/20 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-900 mb-1">
              Unit Wholesale Price ($ USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-purple-50/20 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
            />
          </div>

          <div className="pt-2 border-t border-purple-100">
            <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider mb-2">
              Supplier & Procurement Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-purple-900 mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  placeholder="Apex Hardware Ltd"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-purple-50/20 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-900 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  placeholder="sales@apex.com"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-purple-50/20 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-900 mb-1">
                  Lead Time (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(parseInt(e.target.value, 10) || 5)}
                  className="w-full px-3 py-2 bg-purple-50/20 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-900 mb-1">
              Handling Instructions / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Temperature sensitive, fragile glass, ESD protection required"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50/20 border border-purple-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

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
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-200 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Adding...' : 'Onboard SKU'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
