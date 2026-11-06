import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Mic, 
  MicOff, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Wrench, 
  RefreshCw,
  Box,
  TrendingDown,
  Layers,
  FileSpreadsheet,
  ShieldCheck,
  BrainCircuit
} from 'lucide-react';
import { ChatMessage, InventoryItem, UserRole } from '../types';
import { askAIAssistant } from '../api';

interface AIChatPanelProps {
  userRole: UserRole;
  onSelectSkuForMovement?: (sku: string, type: 'STOCK_IN' | 'STOCK_OUT') => void;
  onRefreshData?: () => void;
  onNavigateToAdvisory?: () => void;
}

const SAMPLE_PROMPTS = [
  {
    title: 'Advisory Approvals',
    query: 'Which recommendations are pending approval?',
    icon: ShieldCheck,
    badge: 'Human-in-the-Loop',
  },
  {
    title: 'Scenario Stress Test',
    query: 'Simulate Q4 peak season holiday surge.',
    icon: BrainCircuit,
    badge: 'Demand Forecast',
  },
  {
    title: 'Low Stock Audit',
    query: 'Which items are running low?',
    icon: TrendingDown,
    badge: 'Immediate Priority',
  },
  {
    title: 'Zone B Valuation',
    query: 'What is the total value of stock in Zone B?',
    icon: Layers,
    badge: 'Financial Audit',
  },
  {
    title: 'Monthly Briefing',
    query: "Summarize this month's inventory activity.",
    icon: FileSpreadsheet,
    badge: 'Executive Brief',
  },
];

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  userRole,
  onSelectSkuForMovement,
  onRefreshData,
  onNavigateToAdvisory,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `### Welcome to OmniStock Advisory Co-Pilot
I function as an advisory and decision-support layer for your warehouse operations.

**How we operate:**
* **Advisory & Guidance:** I analyze live inventory telemetry, forecast demand curves (>95% accuracy), and flag operational anomalies.
* **Human-in-the-Loop:** You and your team remain firmly in the driver's seat. Recommended actions (reorders, spatial relocations, maintenance) are submitted to your approval queue for human authorization before physical execution.
* **Scenario Simulations:** Test what-if scenarios (peak holiday surges, port delays, temperature alerts) to evaluate safety stock resilience.

Select a featured scenario or question below to begin.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'Which recommendations are pending approval?',
        'Simulate Q4 peak season holiday surge.',
        'Which items are running low?',
        'What is the total value of stock in Zone B?',
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    setInput('');

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const reply = await askAIAssistant(
        textToSend,
        history,
        userRole,
        userRole === 'Admin' ? 'Logistics Director' : 'Floor Lead Chen'
      );

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: reply.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolInvocations: reply.toolInvocations,
        matchedItems: reply.matchedItems,
        suggestedActions: reply.suggestedActions,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (reply.toolInvocations?.some((t: any) => t.name === 'record_stock_movement')) {
        onRefreshData?.();
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Failed to process inquiry: ${err.message || 'Unknown network error'}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported on this browser. You can type queries in the prompt box.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          setIsListening(false);
          setTimeout(() => handleSend(transcript), 400);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-145px)] min-h-[580px] bg-slate-50 border border-purple-200/80 rounded-xl overflow-hidden shadow-sm">
      {/* Top Banner */}
      <div className="bg-[#160c29] text-purple-200 px-6 py-3 border-b border-[#291749] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              OmniStock Operations Co-Pilot
            </h2>
            <div className="flex items-center gap-2 text-xs text-purple-300/70">
              <span>Model: Gemini 3.8 Flash</span>
              <span aria-hidden="true">·</span>
              <span>Autonomous Tools Enabled</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-medium">Live Inventory Synced</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => setMessages([messages[0]])}
            className="text-xs text-purple-300 hover:text-white px-2.5 py-1 bg-[#201138] rounded border border-purple-800/70 transition-colors cursor-pointer"
          >
            Clear Session
          </button>
        </div>
      </div>

      {/* Preset Quick Query Carousel */}
      <div className="bg-purple-50/60 border-b border-purple-200/70 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-purple-900 uppercase tracking-wider">
            Featured Warehouse Intelligence Queries
          </span>
          <span className="text-xs text-purple-500">Click to execute instant query</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {SAMPLE_PROMPTS.map((sample, idx) => {
            const Icon = sample.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(sample.query)}
                className="text-left p-2.5 bg-white hover:bg-purple-100/60 border border-purple-200/80 hover:border-purple-400 rounded-lg transition-all group flex flex-col justify-between shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded bg-purple-100/70 group-hover:bg-purple-200 text-purple-700 group-hover:text-purple-900 flex items-center justify-center transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-900 group-hover:text-purple-950 line-clamp-1">
                    {sample.title}
                  </span>
                </div>
                <p className="text-xs text-slate-500 italic line-clamp-2 mb-1">
                  "{sample.query}"
                </p>
                <span className="text-[10px] text-purple-600 group-hover:text-purple-800 flex items-center gap-1 mt-auto font-medium">
                  <span>Run analysis</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-4xl ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                msg.role === 'user'
                  ? 'bg-purple-950 text-white shadow-xs'
                  : 'bg-purple-500/10 text-purple-700 border border-purple-500/20'
              }`}
            >
              {msg.role === 'user' ? (
                <span className="text-xs font-semibold">ME</span>
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`rounded-xl p-4 sm:p-5 text-sm ${
                msg.role === 'user'
                  ? 'bg-[#1a0f30] text-purple-50 shadow-sm'
                  : 'bg-purple-50/40 border border-purple-200/70 text-slate-900 shadow-xs w-full'
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className={`text-xs font-semibold ${msg.role === 'user' ? 'text-purple-300' : 'text-purple-800'}`}>
                  {msg.role === 'user' ? 'Operator Query' : 'OmniStock Assistant'}
                </span>
                <span className={`text-xs font-mono ${msg.role === 'user' ? 'text-purple-400' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </span>
              </div>

              {/* Tool Execution Accordion */}
              {msg.toolInvocations && msg.toolInvocations.length > 0 && (
                <div className="mb-3 p-2.5 bg-purple-100/70 rounded-lg border border-purple-200/90 text-xs">
                  <div className="flex items-center gap-2 text-purple-900 font-medium mb-1">
                    <Wrench className="w-3.5 h-3.5 text-purple-700" />
                    <span>Database Tool Executed:</span>
                    <span className="font-mono text-purple-950 bg-white px-1.5 py-0.5 rounded border border-purple-200">
                      {msg.toolInvocations[0].name}()
                    </span>
                  </div>
                  <div className="text-[11px] text-purple-700/80 font-mono">
                    Parameters: {JSON.stringify(msg.toolInvocations[0].args)}
                  </div>
                </div>
              )}

              {/* Text Body */}
              <div className="prose prose-sm max-w-none prose-slate text-slate-800 whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>

              {/* Interactive Item Cards */}
              {msg.matchedItems && msg.matchedItems.length > 0 && (
                <div className="mt-4 pt-3 border-t border-purple-200/80">
                  <div className="text-xs font-semibold text-purple-900 mb-2">
                    Actionable Item Records ({msg.matchedItems.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {msg.matchedItems.map((item) => (
                      <div
                        key={item.sku}
                        className="p-2.5 bg-white rounded-lg border border-purple-200 hover:border-purple-400 transition-colors flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono text-xs font-semibold text-purple-950">
                              {item.sku}
                            </span>
                            <span
                              className={`text-[11px] font-medium ${
                                item.status === 'Out of Stock'
                                  ? 'text-rose-600 font-semibold'
                                  : item.status === 'Low Stock'
                                  ? 'text-amber-600 font-semibold'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-slate-800 line-clamp-1">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            <span>{item.zone} ({item.binLocation})</span>
                            <span aria-hidden="true" className="mx-1">·</span>
                            <span>{item.quantity} {item.unit}</span>
                            <span aria-hidden="true" className="mx-1">·</span>
                            <span>${item.unitPrice.toFixed(2)}</span>
                          </div>
                        </div>

                        {onSelectSkuForMovement && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => onSelectSkuForMovement(item.sku, 'STOCK_IN')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              + Stock-In
                            </button>
                            <button
                              onClick={() => onSelectSkuForMovement(item.sku, 'STOCK_OUT')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              - Stock-Out
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Follow-ups */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="mt-4 pt-3 border-t border-purple-200/60 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-purple-600 font-medium">Suggested follow-ups:</span>
                  {msg.suggestedActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(action)}
                      className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-900 border border-purple-200 hover:border-purple-400 rounded text-xs transition-colors cursor-pointer"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-2xl">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-600 border border-purple-500/20 flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-4 text-xs text-purple-900 flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
              <span>OmniStock AI is querying warehouse tables & generating analysis...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-3 sm:p-4 bg-white border-t border-purple-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening for speech input...'
                  : 'Ask a question (e.g. "Which items are running low?", "What is stock value in Zone B?")...'
              }
              className={`w-full px-4 py-2.5 bg-purple-50/30 border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all ${
                isListening ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-purple-200'
              }`}
            />
          </div>

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            title={isListening ? 'Stop speech recognition' : 'Speak your question'}
            className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send Button in Violet */}
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-200 text-white font-semibold rounded-lg text-sm transition-colors disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>
        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-purple-500/70">
          <span>Natural language queries invoke live database tools and calculate real-time inventory balances.</span>
          <span className="hidden sm:inline font-mono">Press Enter to submit</span>
        </div>
      </div>
    </div>
  );
};
