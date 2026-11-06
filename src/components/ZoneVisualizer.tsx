import React, { useState } from 'react';
import { 
  Layers, 
  Thermometer, 
  ShieldCheck, 
  Box, 
  DollarSign, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  Warehouse
} from 'lucide-react';
import { InventoryItem, WarehouseZone, ZoneSummary } from '../types';

interface ZoneVisualizerProps {
  zones: WarehouseZone[];
  zoneSummaries: ZoneSummary[];
  items: InventoryItem[];
  onSelectZoneFilter: (zoneCode: string) => void;
  onAskAIAboutZone: (zoneCode: string) => void;
}

export const ZoneVisualizer: React.FC<ZoneVisualizerProps> = ({
  zones,
  zoneSummaries,
  items,
  onSelectZoneFilter,
  onAskAIAboutZone,
}) => {
  const [selectedZoneCode, setSelectedZoneCode] = useState<string>('Zone B');

  const selectedZone = zones.find((z) => z.code === selectedZoneCode) || zones[0];
  const selectedSummary = zoneSummaries.find((s) => s.zoneCode === selectedZoneCode);
  const zoneItems = items.filter((it) => it.zone === selectedZoneCode);

  return (
    <div className="space-y-6">
      {/* Overview Intro */}
      <div className="bg-white p-5 rounded-xl border border-purple-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-purple-600" />
            <span>Facility Spatial Architecture & Zone Telemetry</span>
          </h2>
          <p className="text-xs text-purple-700/80 mt-0.5">
            Real-time physical capacity utilization, climate enforcement, and SKU valuation across warehouse bays.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-purple-900/80 font-medium">Quick Query AI:</span>
          <button
            onClick={() => onAskAIAboutZone('Zone B')}
            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 rounded font-medium transition-colors cursor-pointer"
          >
            "What is the total value of stock in Zone B?"
          </button>
        </div>
      </div>

      {/* Interactive 5-Zone Floor Plan Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {zones.map((zone) => {
          const summary = zoneSummaries.find((s) => s.zoneCode === zone.code);
          const isSelected = selectedZoneCode === zone.code;

          return (
            <div
              key={zone.id}
              onClick={() => setSelectedZoneCode(zone.code)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-purple-50/70 border-purple-500 ring-2 ring-purple-500/25 shadow-sm'
                  : 'bg-white border-purple-200/70 hover:border-purple-300 hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-purple-950">
                    {zone.code}
                  </span>
                  {summary && summary.lowStockAlerts > 0 && (
                    <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{summary.lowStockAlerts} alert</span>
                    </span>
                  )}
                </div>

                <div className="text-xs font-bold text-slate-900 line-clamp-1 mb-1">
                  {zone.name}
                </div>

                <div className="text-xs text-purple-600/80 mb-3">
                  {summary?.totalItems || 0} SKUs stored
                </div>

                {/* Valuation */}
                <div className="mb-3">
                  <div className="text-[11px] text-purple-600/70">Total Valuation</div>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    ${(summary?.totalValuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Utilization</span>
                    <span className="font-mono font-medium text-purple-950">{summary?.utilizationPct || 0}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${summary?.utilizationPct || 0}%` }}
                      className={`h-full rounded-full ${
                        (summary?.utilizationPct || 0) > 85 ? 'bg-amber-500' : 'bg-purple-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Status Tags */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-purple-100 text-[10px] text-slate-500">
                {zone.temperatureControlled && (
                  <span className="flex items-center gap-0.5 text-purple-700 font-medium">
                    <Thermometer className="w-3 h-3 text-purple-500" />
                    <span>Climate</span>
                  </span>
                )}
                <span className="flex items-center gap-0.5 text-slate-600">
                  <ShieldCheck className="w-3 h-3 text-purple-500" />
                  <span>{zone.securityTier}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Selected Zone Explorer */}
      {selectedZone && selectedSummary && (
        <div className="bg-white rounded-xl border border-purple-200/80 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-[#1a0f30] text-purple-200 px-2 py-0.5 rounded">
                  {selectedZone.code}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{selectedZone.name}</h3>
              </div>
              <p className="text-xs text-purple-700/80 mt-1">{selectedZone.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onAskAIAboutZone(selectedZone.code)}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
              >
                Ask AI Assistant About {selectedZone.code}
              </button>
              <button
                onClick={() => onSelectZoneFilter(selectedZone.code)}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Filter Catalog to {selectedZone.code}
              </button>
            </div>
          </div>

          {/* Quick Metrics of Selected Zone */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-purple-50/40 rounded-lg border border-purple-100">
              <div className="text-xs text-purple-600/80 font-medium">Zone Valuation</div>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                ${selectedSummary.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-3 bg-purple-50/40 rounded-lg border border-purple-100">
              <div className="text-xs text-purple-600/80 font-medium">Stored Units</div>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {selectedSummary.totalQuantity.toLocaleString()} / {selectedSummary.capacity.toLocaleString()}
              </div>
            </div>

            <div className="p-3 bg-purple-50/40 rounded-lg border border-purple-100">
              <div className="text-xs text-purple-600/80 font-medium">Distinct Products</div>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {selectedSummary.totalItems} SKUs
              </div>
            </div>

            <div className="p-3 bg-purple-50/40 rounded-lg border border-purple-100">
              <div className="text-xs text-purple-600/80 font-medium">Attention Alerts</div>
              <div className={`text-lg font-bold font-mono mt-0.5 ${selectedSummary.lowStockAlerts > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {selectedSummary.lowStockAlerts} items low
              </div>
            </div>
          </div>

          {/* Items Currently Housed in Zone */}
          <div>
            <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-3">
              Items Currently Located in {selectedZone.code} ({zoneItems.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {zoneItems.map((item) => (
                <div
                  key={item.sku}
                  className="p-3 rounded-lg border border-purple-200 hover:border-purple-400 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-purple-950">{item.sku}</span>
                      <span className="font-mono text-purple-600">Bin: {item.binLocation}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-900 line-clamp-1">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      <span>{item.quantity} {item.unit}</span>
                      <span aria-hidden="true" className="mx-1">·</span>
                      <span>${item.unitPrice.toFixed(2)}/unit</span>
                      <span aria-hidden="true" className="mx-1">·</span>
                      <span className="font-semibold text-slate-900">${(item.quantity * item.unitPrice).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-purple-100 text-[11px]">
                    <span className={`font-semibold ${
                      item.status === 'Out of Stock' ? 'text-rose-600' : item.status === 'Low Stock' ? 'text-amber-600' : 'text-emerald-700'
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-purple-600/70">{item.supplier.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
