import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Plus, 
  Minus, 
  Download, 
  Eye
} from 'lucide-react';
import { InventoryItem, UserRole } from '../types';

interface InventoryTableProps {
  items: InventoryItem[];
  userRole: UserRole;
  onSelectMovement: (sku: string, type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT') => void;
  onSelectItemDetail: (item: InventoryItem) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  userRole,
  onSelectMovement,
  onSelectItemDetail,
}) => {
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<'sku' | 'name' | 'quantity' | 'valuation'>('sku');
  const [sortAsc, setSortAsc] = useState(true);

  // Filtered & sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (search) {
          const q = search.toLowerCase();
          const matchSku = item.sku.toLowerCase().includes(q);
          const matchName = item.name.toLowerCase().includes(q);
          const matchBin = item.binLocation.toLowerCase().includes(q);
          const matchSupplier = item.supplier.name.toLowerCase().includes(q);
          if (!matchSku && !matchName && !matchBin && !matchSupplier) return false;
        }

        if (selectedZone !== 'all' && item.zone !== selectedZone) return false;
        if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
        if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'valuation') {
          const valA = a.quantity * a.unitPrice;
          const valB = b.quantity * b.unitPrice;
          return sortAsc ? valA - valB : valB - valA;
        }

        const valA = a[sortField];
        const valB = b[sortField];

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      });
  }, [items, search, selectedZone, selectedCategory, selectedStatus, sortField, sortAsc]);

  const toggleSort = (field: 'sku' | 'name' | 'quantity' | 'valuation') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleExportCSV = () => {
    const headers = ['SKU', 'Name', 'Category', 'Zone', 'Bin', 'Quantity', 'Unit', 'Threshold', 'Unit Price ($)', 'Valuation ($)', 'Status', 'Supplier'];
    const rows = filteredItems.map((it) => [
      it.sku,
      `"${it.name.replace(/"/g, '""')}"`,
      it.category,
      it.zone,
      it.binLocation,
      it.quantity,
      it.unit,
      it.minThreshold,
      it.unitPrice.toFixed(2),
      (it.quantity * it.unitPrice).toFixed(2),
      it.status,
      `"${it.supplier.name.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Controls & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-purple-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU, item name, bin (e.g. A-01-14) or supplier..."
              className="w-full pl-9 pr-3 py-2 bg-purple-50/20 border border-purple-200/90 rounded-lg text-sm text-slate-900 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
          </div>

          {/* Action tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-purple-50 text-purple-900 border border-purple-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-purple-600" />
              <span>Export CSV ({filteredItems.length})</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-purple-100 text-xs">
          {/* Zone Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-purple-900/80 font-medium">Zone:</span>
            <div className="flex items-center gap-1 bg-purple-50/80 p-0.5 rounded-md border border-purple-100">
              {['all', 'Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'].map((z) => (
                <button
                  key={z}
                  onClick={() => setSelectedZone(z)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    selectedZone === z
                      ? 'bg-white text-purple-950 shadow-xs ring-1 ring-purple-200 font-semibold'
                      : 'text-purple-700/80 hover:text-purple-950'
                  }`}
                >
                  {z === 'all' ? 'All Zones' : z.replace('Zone ', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-purple-900/80 font-medium">Status:</span>
            <div className="flex items-center gap-1 bg-purple-50/80 p-0.5 rounded-md border border-purple-100">
              {[
                { id: 'all', label: 'All' },
                { id: 'In Stock', label: 'Healthy' },
                { id: 'Low Stock', label: 'Low' },
                { id: 'Out of Stock', label: 'Out' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStatus(s.id)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    selectedStatus === s.id
                      ? 'bg-white text-purple-950 shadow-xs ring-1 ring-purple-200 font-semibold'
                      : 'text-purple-700/80 hover:text-purple-950'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-purple-900/80 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-purple-50/40 border border-purple-200 text-purple-950 text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Fast Moving">Fast Moving</option>
              <option value="Heavy Parts">Heavy Parts</option>
              <option value="Cold Storage">Cold Storage</option>
              <option value="Packaging">Packaging</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-xl border border-purple-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-purple-50/50 border-b border-purple-100 text-xs text-purple-900/80 uppercase tracking-wider font-semibold">
              <tr>
                <th
                  onClick={() => toggleSort('sku')}
                  className="px-4 py-3 cursor-pointer hover:text-purple-950"
                >
                  <div className="flex items-center gap-1">
                    <span>SKU & Item</span>
                    <ArrowUpDown className="w-3 h-3 text-purple-400" />
                  </div>
                </th>
                <th className="px-4 py-3">Location & Zone</th>
                <th
                  onClick={() => toggleSort('quantity')}
                  className="px-4 py-3 cursor-pointer hover:text-purple-950"
                >
                  <div className="flex items-center gap-1">
                    <span>Stock Level / Capacity</span>
                    <ArrowUpDown className="w-3 h-3 text-purple-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('valuation')}
                  className="px-4 py-3 cursor-pointer hover:text-purple-950"
                >
                  <div className="flex items-center gap-1">
                    <span>Unit / Total Value</span>
                    <ArrowUpDown className="w-3 h-3 text-purple-400" />
                  </div>
                </th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Supplier & Lead Time</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100/70">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-purple-600/70 text-sm">
                    No inventory records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const valuation = item.quantity * item.unitPrice;
                  const pctCapacity = Math.min(
                    100,
                    Math.round((item.quantity / item.maxCapacity) * 100)
                  );

                  return (
                    <tr
                      key={item.sku}
                      className="hover:bg-purple-50/40 transition-colors group"
                    >
                      {/* SKU & Name */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-bold text-purple-950">
                            {item.sku}
                          </span>
                          <span className="font-medium text-slate-900 group-hover:text-purple-800 transition-colors">
                            {item.name}
                          </span>
                          <span className="text-xs text-purple-500 mt-0.5">
                            {item.category}
                          </span>
                        </div>
                      </td>

                      {/* Location & Zone */}
                      <td className="px-4 py-3 text-xs">
                        <div className="font-semibold text-slate-900">{item.zone}</div>
                        <div className="font-mono text-purple-700/80">Bin: {item.binLocation}</div>
                      </td>

                      {/* Stock Level / Capacity */}
                      <td className="px-4 py-3">
                        <div className="w-44">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold font-mono text-slate-900">
                              {item.quantity} {item.unit}
                            </span>
                            <span className="text-purple-500 text-[11px]">
                              Cap: {item.maxCapacity}
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full h-1.5 bg-purple-100/70 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pctCapacity}%` }}
                              className={`h-full rounded-full transition-all duration-300 ${
                                item.status === 'Out of Stock'
                                  ? 'bg-rose-500'
                                  : item.status === 'Low Stock'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                          <div className="text-[11px] text-purple-600/70 mt-0.5">
                            Min Threshold: {item.minThreshold} {item.unit}
                          </div>
                        </div>
                      </td>

                      {/* Unit Price & Valuation */}
                      <td className="px-4 py-3 text-xs">
                        <div className="font-mono font-bold text-slate-900">
                          ${valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-purple-600/80 font-mono">
                          @ ${item.unitPrice.toFixed(2)} / {item.unit}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              item.status === 'Out of Stock'
                                ? 'bg-rose-500 animate-pulse'
                                : item.status === 'Low Stock'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <span
                            className={`text-xs font-semibold ${
                              item.status === 'Out of Stock'
                                ? 'text-rose-700'
                                : item.status === 'Low Stock'
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="px-4 py-3 text-xs">
                        <div className="text-slate-900 font-medium">
                          {item.supplier.name}
                        </div>
                        <div className="text-purple-600/70">
                          ~{item.supplier.leadTimeDays}d lead time
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectMovement(item.sku, 'STOCK_IN')}
                            title="Quick Stock-In (Receipt)"
                            className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSelectMovement(item.sku, 'STOCK_OUT')}
                            disabled={item.quantity <= 0}
                            title="Quick Stock-Out (Fulfillment Pick)"
                            className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 disabled:text-slate-300 disabled:hover:bg-transparent rounded transition-colors cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSelectItemDetail(item)}
                            title="Inspect SKU details"
                            className="p-1.5 text-purple-700 hover:text-purple-950 hover:bg-purple-100 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
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
