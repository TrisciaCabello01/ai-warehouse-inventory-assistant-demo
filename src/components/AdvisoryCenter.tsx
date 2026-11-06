import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Play, 
  Layers, 
  Wrench, 
  FileText, 
  ArrowRight,
  UserCheck,
  BrainCircuit,
  Sliders,
  Flame,
  Check,
  X
} from 'lucide-react';
import { AIRecommendation, ScenarioSimulationResult, UserRole } from '../types';
import { simulateScenario } from '../api';

interface AdvisoryCenterProps {
  recommendations: AIRecommendation[];
  userRole: UserRole;
  onApprove: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string, notes?: string) => Promise<void>;
  onOpenAssistantWithQuery: (query: string) => void;
}

export const AdvisoryCenter: React.FC<AdvisoryCenterProps> = ({
  recommendations,
  userRole,
  onApprove,
  onReject,
  onOpenAssistantWithQuery,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('PENDING_APPROVAL');
  const [activeScenario, setActiveScenario] = useState<string>('HOLIDAY_SURGE');
  const [simulationResult, setSimulationResult] = useState<ScenarioSimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [actionProcessingId, setActionProcessingId] = useState<string | null>(null);

  // Filter recommendations
  const filteredRecs = recommendations.filter((r) => {
    if (filterCategory !== 'all' && r.category !== filterCategory) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const pendingCount = recommendations.filter((r) => r.status === 'PENDING_APPROVAL').length;
  const approvedCount = recommendations.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = recommendations.filter((r) => r.status === 'REJECTED').length;

  const handleRunSimulation = async (type: string) => {
    setActiveScenario(type);
    setSimulating(true);
    try {
      const res = await simulateScenario(type);
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handleApproveClick = async (id: string) => {
    setActionProcessingId(id);
    try {
      await onApprove(id);
    } finally {
      setActionProcessingId(null);
    }
  };

  const handleRejectClick = async (id: string) => {
    const reason = window.prompt('Optional: Provide operator rejection feedback for the AI model:');
    if (reason !== null) {
      setActionProcessingId(id);
      try {
        await onReject(id, reason);
      } finally {
        setActionProcessingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Dimension Matrix Banner: Advisory / Co-pilot Constitution */}
      <div className="bg-gradient-to-r from-[#170c2c] via-[#200f3d] to-[#170c2c] text-purple-100 rounded-xl p-5 border border-purple-800/80 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Human-in-the-Loop AI Advisory Co-Pilot
                </h2>
                <span className="text-[11px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                  Advisory Level: Strict Decision Support
                </span>
              </div>
              <p className="text-xs text-purple-300/80 mt-0.5">
                The AI analyzes telemetry, forecasts demand (&gt;95% accuracy), and flags anomalies. Humans approve or reject all physical actions before execution.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAssistantWithQuery('Which recommendations are currently pending human approval?')}
              className="px-3 py-1.5 bg-[#2c154f] hover:bg-[#381a63] text-purple-200 border border-purple-700/80 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Ask AI about Pending Queue
            </button>
          </div>
        </div>

        {/* 4 Architectural Dimensions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="p-3 bg-[#130826]/70 rounded-lg border border-purple-900/60">
            <span className="text-purple-400 font-medium">Decision-Making</span>
            <div className="text-white font-bold mt-0.5">Recommends for Human Review</div>
            <p className="text-[11px] text-purple-300/70 mt-1">Zero autonomous physical override</p>
          </div>

          <div className="p-3 bg-[#130826]/70 rounded-lg border border-purple-900/60">
            <span className="text-purple-400 font-medium">Control Level</span>
            <div className="text-white font-bold mt-0.5">Advisory / Co-pilot Layer</div>
            <p className="text-[11px] text-purple-300/70 mt-1">Guidance & scenario simulations</p>
          </div>

          <div className="p-3 bg-[#130826]/70 rounded-lg border border-purple-900/60">
            <span className="text-purple-400 font-medium">Human Involvement</span>
            <div className="text-emerald-400 font-bold mt-0.5">High (Firmly in the Driver's Seat)</div>
            <p className="text-[11px] text-purple-300/70 mt-1">Workers & Managers authorize changes</p>
          </div>

          <div className="p-3 bg-[#130826]/70 rounded-lg border border-purple-900/60">
            <span className="text-purple-400 font-medium">Core Tech & Scope</span>
            <div className="text-white font-bold mt-0.5">Predictive NLP & WMS Overlays</div>
            <p className="text-[11px] text-purple-300/70 mt-1">Reduces cognitive load & stockouts</p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Approvals Queue + Scenario Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Human-in-the-Loop Recommendation Queue (Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-purple-200/80 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  <span>Recommendation Approval Queue</span>
                </h3>
                <p className="text-xs text-purple-700/80">
                  Review AI proposals for stock reorders, pick-path reallocations, and preventive maintenance.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-purple-50/80 p-0.5 rounded-lg border border-purple-200 text-xs">
                <button
                  onClick={() => setFilterStatus('PENDING_APPROVAL')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    filterStatus === 'PENDING_APPROVAL'
                      ? 'bg-white text-purple-950 font-bold shadow-xs'
                      : 'text-purple-700 hover:text-purple-950'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setFilterStatus('APPROVED')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    filterStatus === 'APPROVED'
                      ? 'bg-white text-emerald-800 font-bold shadow-xs'
                      : 'text-purple-700 hover:text-purple-950'
                  }`}
                >
                  Approved ({approvedCount})
                </button>
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    filterStatus === 'all'
                      ? 'bg-white text-purple-950 font-bold shadow-xs'
                      : 'text-purple-700 hover:text-purple-950'
                  }`}
                >
                  All ({recommendations.length})
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-purple-100 text-xs">
              <span className="text-purple-900/80 font-medium mr-1">Category:</span>
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'REORDER', label: 'Reorders' },
                { id: 'REALLOCATION', label: 'Pick Reallocation' },
                { id: 'MAINTENANCE', label: 'Maintenance' },
                { id: 'BUFFER', label: 'Dynamic Buffers' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilterCategory(c.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    filterCategory === c.id
                      ? 'bg-[#1a0f30] text-purple-100 font-semibold'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recommendation Cards */}
          <div className="space-y-3">
            {filteredRecs.length === 0 ? (
              <div className="bg-white p-12 rounded-xl border border-purple-200/80 text-center text-slate-500 text-sm shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">No recommendations match the filter.</p>
                <p className="text-xs text-purple-600/80 mt-1">
                  All AI proposals have been reviewed and acted upon by human operators.
                </p>
              </div>
            ) : (
              filteredRecs.map((rec) => {
                const isProcessing = actionProcessingId === rec.id;
                const isPending = rec.status === 'PENDING_APPROVAL';

                return (
                  <div
                    key={rec.id}
                    className={`bg-white rounded-xl border transition-all p-5 shadow-xs ${
                      isPending
                        ? 'border-purple-200 hover:border-purple-400'
                        : rec.status === 'APPROVED'
                        ? 'border-emerald-200 bg-emerald-50/15'
                        : 'border-slate-200 bg-slate-50/40 opacity-75'
                    }`}
                  >
                    {/* Top Row: Category, Urgency, Forecast Accuracy */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-[#1a0f30] text-purple-200 px-2 py-0.5 rounded">
                          {rec.id}
                        </span>
                        <span className="text-xs font-semibold text-purple-800">
                          {rec.category}
                        </span>
                        <span className="text-purple-300">·</span>
                        <span
                          className={`text-[11px] font-semibold ${
                            rec.urgency === 'CRITICAL'
                              ? 'text-rose-600'
                              : rec.urgency === 'HIGH'
                              ? 'text-amber-600'
                              : 'text-purple-600'
                          }`}
                        >
                          {rec.urgency} URGENCY
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {rec.forecastAccuracyPct}% Forecast Accuracy
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            rec.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-100 text-amber-900'
                              : rec.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {rec.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Title & SKU */}
                    <div className="mb-2">
                      <h4 className="text-sm font-bold text-slate-900">{rec.title}</h4>
                      {rec.sku && (
                        <div className="text-xs text-purple-600/80 font-mono mt-0.5">
                          Referenced SKU: {rec.sku} {rec.itemName && `— ${rec.itemName}`}
                        </div>
                      )}
                    </div>

                    {/* Summary & Reasoning */}
                    <div className="space-y-2 text-xs text-slate-700 bg-purple-50/30 p-3 rounded-lg border border-purple-100 mb-3">
                      <div>
                        <span className="font-semibold text-purple-950">AI Observation:</span>{' '}
                        <span>{rec.summary}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-purple-950">Diagnostic Reasoning:</span>{' '}
                        <span>{rec.reasoning}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-purple-950">Projected Value Impact:</span>{' '}
                        <span className="text-emerald-800 font-medium">{rec.impactStatement}</span>
                      </div>
                    </div>

                    {/* Proposed Action Box */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-purple-100">
                      <div className="text-xs">
                        <span className="font-bold text-purple-900">Proposed Action:</span>{' '}
                        <span className="font-mono text-slate-900">
                          {rec.suggestedAction.type.replace('_', ' ')}
                          {rec.suggestedAction.quantity && ` (${rec.suggestedAction.quantity} units)`}
                          {rec.suggestedAction.targetZone && ` ➔ ${rec.suggestedAction.targetZone}`}
                          {rec.suggestedAction.newMinThreshold && ` (New Min: ${rec.suggestedAction.newMinThreshold})`}
                          {rec.suggestedAction.estimatedCost && ` [Est: $${rec.suggestedAction.estimatedCost.toFixed(2)}]`}
                        </span>
                      </div>

                      {/* Human Operator Action Controls */}
                      {isPending ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRejectClick(rec.id)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                          <button
                            onClick={() => handleApproveClick(rec.id)}
                            disabled={isProcessing}
                            className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isProcessing ? 'Executing...' : 'Approve & Execute'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 font-mono">
                          {rec.status === 'APPROVED' ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Executed with human sign-off ({rec.reviewedBy})</span>
                            </span>
                          ) : (
                            <span className="text-rose-600 font-semibold flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Dismissed by operator ({rec.reviewedBy})</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Scenario Simulator & Anomaly Radar (Span 1) */}
        <div className="space-y-4">
          {/* Scenario Simulation Card */}
          <div className="bg-white p-5 rounded-xl border border-purple-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
                <Play className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-purple-950">
                  Scenario Simulator
                </h3>
                <p className="text-[11px] text-purple-600/80">
                  What-if predictive modeling & stress-testing
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                {
                  id: 'HOLIDAY_SURGE',
                  title: 'Q4 Holiday Surge (+35% Velocity)',
                  desc: 'Models accelerated demand across packaging & electronics',
                },
                {
                  id: 'SUPPLIER_DELAY',
                  title: 'Supply Chain Delay (+10 Days Lead Time)',
                  desc: 'Evaluates safety stock vulnerability during port bottlenecks',
                },
                {
                  id: 'CLIMATE_DRIFT',
                  title: 'Zone D Cold Chain Thermal Drift',
                  desc: 'Tests emergency inventory relocation protocols',
                },
              ].map((scen) => (
                <button
                  key={scen.id}
                  onClick={() => handleRunSimulation(scen.id)}
                  disabled={simulating}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all cursor-pointer ${
                    activeScenario === scen.id && simulationResult
                      ? 'bg-purple-50 border-purple-400 ring-1 ring-purple-300'
                      : 'bg-purple-50/20 hover:bg-purple-50/60 border-purple-100 text-slate-800'
                  }`}
                >
                  <div className="font-bold text-purple-950">{scen.title}</div>
                  <div className="text-[11px] text-purple-600/70 mt-0.5">{scen.desc}</div>
                </button>
              ))}
            </div>

            {/* Simulation Results Box */}
            {simulationResult ? (
              <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-200/90 text-xs space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-purple-200">
                  <span className="font-bold text-purple-950">Simulation Forecast</span>
                  <span className="font-mono text-[11px] font-bold text-emerald-700">
                    {simulationResult.forecastConfidencePct}% Confidence
                  </span>
                </div>

                <p className="text-slate-700 leading-relaxed text-[11px]">
                  {simulationResult.summary}
                </p>

                <div className="space-y-1.5 pt-1">
                  <span className="font-bold text-purple-900 block text-[11px]">
                    Vulnerable SKUs ({simulationResult.vulnerableSkus.length}):
                  </span>
                  {simulationResult.vulnerableSkus.map((v) => (
                    <div
                      key={v.sku}
                      className="p-2 bg-white rounded border border-purple-100 text-[11px]"
                    >
                      <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                        <span>{v.sku}</span>
                        <span className="text-rose-600">
                          {v.daysUntilStockout === 0 ? 'Stockout Today' : `${v.daysUntilStockout}d to zero`}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-0.5">{v.name}</div>
                      <div className="text-purple-700 text-[10px] mt-1 font-medium">
                        Advisory: {v.recommendedMitigation}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-2 bg-[#1a0f30] text-purple-200 rounded text-[11px] leading-relaxed">
                  <span className="font-bold text-white">Co-Pilot Advisory:</span>{' '}
                  {simulationResult.aiAdvisoryGuidance}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-purple-50/30 rounded-lg border border-purple-100 text-center text-xs text-purple-700">
                Click any scenario above to execute predictive demand simulation.
              </div>
            )}
          </div>

          {/* Anomaly Detection Radar */}
          <div className="bg-white p-5 rounded-xl border border-purple-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-purple-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Live Operational Anomalies</span>
              </h3>
              <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                Real-Time
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg">
                <div className="font-bold text-rose-900">Stockout Starvation (FMC-9020)</div>
                <div className="text-[11px] text-rose-700 mt-0.5">
                  Packing tape reached 0 units while 40 pick orders queued. Emergency PO staged.
                </div>
              </div>

              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg">
                <div className="font-bold text-amber-900">Excessive Picker Travel Distance</div>
                <div className="text-[11px] text-amber-700 mt-0.5">
                  PKG-1001 cartons in Zone E causing 340m extra walking per order. Forward staging advised.
                </div>
              </div>

              <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="font-bold text-purple-950">Sub-Bay D-02 Thermal Variance</div>
                <div className="text-[11px] text-purple-700 mt-0.5">
                  Compressor cyclical +1.6°C drift recorded. Work order dispatched for human sign-off.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
