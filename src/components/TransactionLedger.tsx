import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCw, 
  Search, 
  Download
} from 'lucide-react';
import { InventoryTransaction } from '../types';

interface TransactionLedgerProps {
  transactions: InventoryTransaction[];
  onOpenMovementModal: () => void;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  onOpenMovementModal,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filtered = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchSku = tx.sku.toLowerCase().includes(q);
      const matchName = tx.itemName.toLowerCase().includes(q);
      const matchRef = tx.referenceNumber.toLowerCase().includes(q);
      const matchStaff = tx.performedBy.toLowerCase().includes(q);
      const matchReason = tx.reason.toLowerCase().includes(q);
      if (!matchSku && !matchName && !matchRef && !matchStaff && !matchReason) return false;
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Transaction ID', 'Timestamp', 'Type', 'SKU', 'Item Name', 'Quantity', 'Previous Qty', 'New Qty', 'Zone', 'Staff', 'Role', 'Reference', 'Reason'];
    const rows = filtered.map((t) => [
      t.id,
      t.timestamp,
      t.type,
      t.sku,
      `"${t.itemName.replace(/"/g, '""')}"`,
      t.quantity,
      t.previousQuantity,
      t.newQuantity,
      t.targetZone || t.sourceZone || '',
      `"${t.performedBy}"`,
      t.role,
      t.referenceNumber,
      `"${t.reason.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-purple-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by SKU, item, PO #, staff or reason..."
              className="w-full pl-9 pr-3 py-2 bg-purple-50/20 border border-purple-200/90 rounded-lg text-sm text-slate-900 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMovementModal}
              className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Record New Movement</span>
            </button>
            <button
              onClick={exportCSV}
              className="px-3 py-2 bg-white hover:bg-purple-50 text-purple-900 border border-purple-200 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-purple-600" />
              <span>Export Ledger</span>
            </button>
          </div>
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1 pt-2 border-t border-purple-100 text-xs">
          <span className="text-purple-900/80 font-medium mr-2">Movement Type:</span>
          {[
            { id: 'all', label: 'All Operations' },
            { id: 'STOCK_IN', label: 'Stock-In (Receipts)' },
            { id: 'STOCK_OUT', label: 'Stock-Out (Picks/Dispatches)' },
            { id: 'TRANSFER', label: 'Transfers' },
            { id: 'ADJUSTMENT', label: 'Cycle Adjustments' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                filterType === type.id
                  ? 'bg-[#1a0f30] text-purple-100 shadow-xs font-semibold'
                  : 'bg-purple-50/70 text-purple-800 hover:bg-purple-100'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-purple-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-purple-50/50 border-b border-purple-100 text-xs text-purple-900/80 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Movement Type</th>
                <th className="px-4 py-3">Item & SKU</th>
                <th className="px-4 py-3">Quantity Delta</th>
                <th className="px-4 py-3">Balance Progression</th>
                <th className="px-4 py-3">Logged By & Role</th>
                <th className="px-4 py-3">Reference & Reason</th>
                <th className="px-4 py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100/70">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-purple-600/70 text-sm">
                    No transactions found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const isStockIn = tx.type === 'STOCK_IN';
                  const isStockOut = tx.type === 'STOCK_OUT';

                  return (
                    <tr key={tx.id} className="hover:bg-purple-50/40 transition-colors">
                      {/* Movement Type */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                              isStockIn
                                ? 'bg-emerald-50 text-emerald-700'
                                : isStockOut
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {isStockIn ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : isStockOut ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-900">
                              {tx.type.replace('_', ' ')}
                            </div>
                            <div className="text-[11px] font-mono text-purple-700/70">
                              {tx.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Item & SKU */}
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-bold text-purple-950">
                          {tx.sku}
                        </div>
                        <div className="text-xs text-slate-700 line-clamp-1 font-medium">
                          {tx.itemName}
                        </div>
                        {tx.targetZone && (
                          <div className="text-[11px] text-purple-600/70">
                            Location: {tx.targetZone}
                          </div>
                        )}
                      </td>

                      {/* Quantity Delta */}
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono text-sm font-bold ${
                            isStockIn
                              ? 'text-emerald-700'
                              : isStockOut
                              ? 'text-rose-700'
                              : 'text-purple-700'
                          }`}
                        >
                          {isStockIn ? '+' : isStockOut ? '-' : ''}
                          {tx.quantity}
                        </span>
                      </td>

                      {/* Balance Progression */}
                      <td className="px-4 py-3 text-xs">
                        <div className="flex items-center gap-1.5 font-mono text-slate-600">
                          <span>{tx.previousQuantity}</span>
                          <span className="text-purple-300">➔</span>
                          <span className="font-bold text-slate-900">{tx.newQuantity} units</span>
                        </div>
                      </td>

                      {/* Performed By & Role */}
                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-slate-900">{tx.performedBy}</div>
                        <div className="text-purple-600/70">{tx.role}</div>
                      </td>

                      {/* Reference & Reason */}
                      <td className="px-4 py-3 text-xs max-w-xs">
                        <div className="font-mono text-slate-800 font-semibold">
                          {tx.referenceNumber}
                        </div>
                        <div className="text-slate-500 line-clamp-1">
                          {tx.reason}
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3 text-right text-xs text-purple-600/70 font-mono">
                        {new Date(tx.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
