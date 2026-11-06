import React from 'react';
import { 
  Boxes, 
  Bot, 
  ArrowLeftRight, 
  Plus, 
  RotateCcw, 
  ShieldCheck, 
  UserCheck, 
  Layers, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import { UserRole, WarehouseMetrics } from '../types';

interface HeaderProps {
  currentTab: 'assistant' | 'advisory' | 'inventory' | 'zones' | 'transactions' | 'reorder';
  setCurrentTab: (tab: 'assistant' | 'advisory' | 'inventory' | 'zones' | 'transactions' | 'reorder') => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  metrics: WarehouseMetrics | null;
  pendingRecommendationsCount?: number;
  onOpenMovementModal: () => void;
  onOpenNewItemModal: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  userRole,
  setUserRole,
  metrics,
  pendingRecommendationsCount = 0,
  onOpenMovementModal,
  onOpenNewItemModal,
  onResetData,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#130b24] border-b border-[#291749] text-purple-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top utility row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 border-b border-[#251542] gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-xs">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">OmniStock AI</span>
                <span className="text-xs text-purple-400 font-mono">v2.4</span>
              </div>
              <p className="text-xs text-purple-300/70">
                Autonomous Warehouse & Inventory Intelligence
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar & Role Switcher */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {metrics && (
              <div className="flex items-center gap-3 text-purple-200">
                <div>
                  <span className="text-purple-300/70">Total Stock Value:</span>{' '}
                  <span className="font-semibold text-white font-mono">
                    ${metrics.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <span className="text-purple-900" aria-hidden="true">|</span>
                <div>
                  <span className="text-purple-300/70">Units:</span>{' '}
                  <span className="font-semibold text-white font-mono">
                    {metrics.totalQuantity.toLocaleString()}
                  </span>
                </div>
                <span className="text-purple-900" aria-hidden="true">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-purple-300/70">Reorders:</span>{' '}
                  <span className={`font-semibold font-mono ${metrics.reorderAlerts > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {metrics.reorderAlerts}
                  </span>
                  {metrics.reorderAlerts > 0 && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 inline" />
                  )}
                </div>
              </div>
            )}

            {/* Role Switcher */}
            <div className="flex items-center gap-1 p-0.5 bg-[#1e1035] rounded-lg border border-purple-900/60">
              <button
                onClick={() => setUserRole('Warehouse Staff')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  userRole === 'Warehouse Staff'
                    ? 'bg-purple-600 text-white font-semibold shadow-xs'
                    : 'text-purple-300/70 hover:text-white'
                }`}
                title="Switch to Warehouse Staff mode (picks, counts, stock updates)"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Staff View</span>
              </button>
              <button
                onClick={() => setUserRole('Admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  userRole === 'Admin'
                    ? 'bg-purple-600 text-white font-semibold shadow-xs'
                    : 'text-purple-300/70 hover:text-white'
                }`}
                title="Switch to Logistics Manager / Admin mode (full catalog, POs, audit approvals)"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin View</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenMovementModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#201138] hover:bg-[#2c174d] text-purple-100 rounded-md border border-purple-800/80 text-xs font-medium transition-colors cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-purple-400" />
                <span>Stock Movement</span>
              </button>

              {userRole === 'Admin' && (
                <button
                  onClick={onOpenNewItemModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-md text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New SKU</span>
                </button>
              )}

              <button
                onClick={onResetData}
                title="Reset database to default warehouse dataset"
                className="p-1.5 text-purple-300/70 hover:text-white hover:bg-[#201138] rounded transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 sm:space-x-4 py-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setCurrentTab('assistant')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              currentTab === 'assistant'
                ? 'border-purple-400 text-purple-300 font-semibold'
                : 'border-transparent text-purple-300/70 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4 text-purple-400" />
            <span>AI Warehouse Assistant</span>
          </button>

          <button
            onClick={() => setCurrentTab('advisory')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              currentTab === 'advisory'
                ? 'border-purple-400 text-purple-300 font-semibold'
                : 'border-transparent text-purple-300/70 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Advisory & Approvals</span>
            {pendingRecommendationsCount > 0 && (
              <span className="text-amber-300 text-xs font-mono font-bold bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                {pendingRecommendationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('inventory')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              currentTab === 'inventory'
                ? 'border-purple-400 text-purple-300 font-semibold'
                : 'border-transparent text-purple-300/70 hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4 text-purple-400" />
            <span>Inventory Catalog</span>
          </button>

          <button
            onClick={() => setCurrentTab('zones')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              currentTab === 'zones'
                ? 'border-purple-400 text-purple-300 font-semibold'
                : 'border-transparent text-purple-300/70 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Warehouse Zones (A-E)</span>
          </button>

          <button
            onClick={() => setCurrentTab('transactions')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              currentTab === 'transactions'
                ? 'border-purple-400 text-purple-300 font-semibold'
                : 'border-transparent text-purple-300/70 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-purple-400" />
            <span>Transaction Ledger</span>
          </button>

          <button
            onClick={() => setCurrentTab('reorder')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              currentTab === 'reorder'
                ? 'border-purple-400 text-purple-300 font-semibold'
                : 'border-transparent text-purple-300/70 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Reorder Center</span>
            {metrics && metrics.reorderAlerts > 0 && (
              <span className="text-purple-300 text-xs font-mono">
                ({metrics.reorderAlerts})
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
