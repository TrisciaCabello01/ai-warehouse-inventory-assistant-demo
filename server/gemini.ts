import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { db, InventoryItem } from "./db";

// Initialize Gemini client strictly with User-Agent header
const apiKey = process.env.GEMINI_API_KEY || "";
const ai =
  apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim().length > 15
    ? new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      })
    : null;

// Function declarations for inventory operations
const queryStockDeclaration: FunctionDeclaration = {
  name: "query_stock_inventory",
  description: "Search and filter warehouse inventory items by SKU, name, category, zone, or low-stock status.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      search: {
        type: Type.STRING,
        description: "Search keyword for SKU or item name (e.g., 'battery', 'ELC-1092', 'packing tape').",
      },
      zone: {
        type: Type.STRING,
        description: "Optional zone filter, e.g. 'Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'.",
      },
      low_stock_only: {
        type: Type.BOOLEAN,
        description: "If true, only return items with status 'Low Stock' or 'Out of Stock'.",
      },
      category: {
        type: Type.STRING,
        description: "Optional category filter: 'Electronics', 'Fast Moving', 'Heavy Parts', 'Cold Storage', 'Packaging'.",
      },
    },
  },
};

const getMetricsDeclaration: FunctionDeclaration = {
  name: "get_warehouse_metrics",
  description: "Retrieve real-time metrics including total SKUs, total units in stock, total inventory valuation in USD, low-stock count, and per-zone summaries.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      include_zones: {
        type: Type.BOOLEAN,
        description: "Whether to include detailed per-zone breakdown.",
      },
    },
  },
};

const recordMovementDeclaration: FunctionDeclaration = {
  name: "record_stock_movement",
  description: "Record a stock adjustment, stock-in, or stock-out for a specific item SKU.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      sku: {
        type: Type.STRING,
        description: "The item SKU, e.g. 'ELC-1092' or 'FMC-5001'.",
      },
      type: {
        type: Type.STRING,
        description: "Transaction type: 'STOCK_IN', 'STOCK_OUT', or 'ADJUSTMENT'.",
      },
      quantity: {
        type: Type.NUMBER,
        description: "The quantity amount to add or remove (positive integer).",
      },
      reason: {
        type: Type.STRING,
        description: "Human-readable reason for this stock change.",
      },
    },
    required: ["sku", "type", "quantity", "reason"],
  },
};

const getTransactionsDeclaration: FunctionDeclaration = {
  name: "get_transaction_audit_log",
  description: "Retrieve the latest warehouse transaction history records (stock-ins, stock-outs, transfers, adjustments).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      limit: {
        type: Type.NUMBER,
        description: "Number of transactions to return (default 10).",
      },
    },
  },
};

export interface ChatMessage {
  role: "user" | "assistant" | "model";
  content: string;
}

export interface AssistantResponse {
  text: string;
  toolInvocations?: Array<{
    name: string;
    args: any;
    result: any;
  }>;
  suggestedActions?: string[];
  matchedItems?: InventoryItem[];
}

export async function processWarehouseQuery(
  userQuery: string,
  history: ChatMessage[] = [],
  userRole: "Admin" | "Warehouse Staff" = "Warehouse Staff",
  userName: string = "Warehouse Staff Member"
): Promise<AssistantResponse> {
  // If Gemini API is available, use real Gemini 3.8 Flash model
  if (ai) {
    try {
      const systemInstruction = `You are OmniStock AI, an advisory, co-pilot, and decision-support layer for modern Warehouse Operations and Inventory Management.
Role & Guiding Philosophy:
1. Advisory / Co-pilot Level: You process data, forecast demand (highlighting high confidence >95%), flag anomalies, and recommend actions (such as reordering stock, reallocating SKUs, or scheduling maintenance).
2. Human-in-the-Loop: Humans remain firmly in the driver’s seat. You do not autonomously take over physical control loops. Workers or managers review and approve/reject your recommendations in the Advisory & Approvals Queue.
3. Decision-Support: Guide workers, reduce cognitive load, improve demand forecast accuracy, minimize stockouts, and recommend spatial/pick-path efficiencies.
User role: ${userRole} (${userName}). Current time: November 2026.`;

      const tools = [
        {
          functionDeclarations: [
            queryStockDeclaration,
            getMetricsDeclaration,
            recordMovementDeclaration,
            getTransactionsDeclaration,
          ],
        },
      ];

      // Format previous messages
      const formattedContents = history.slice(-6).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      // Append current user message
      formattedContents.push({
        role: "user",
        parts: [{ text: userQuery }],
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini API call timed out after 8s")), 8000)
      );

      const response1 = await Promise.race([
        ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: formattedContents,
          config: {
            systemInstruction,
            tools,
          },
        }),
        timeoutPromise,
      ]);

      const functionCalls = response1.functionCalls;
      const toolInvocations: Array<{ name: string; args: any; result: any }> = [];
      let matchedItems: InventoryItem[] = [];

      if (functionCalls && functionCalls.length > 0) {
        // Execute tool calls locally against database
        const functionResponses = [];

        for (const call of functionCalls) {
          const args = (call.args || {}) as Record<string, any>;
          let result: any = null;

          if (call.name === "query_stock_inventory") {
            let items = db.getAllItems();
            if (args.search) {
              const q = String(args.search).toLowerCase();
              items = items.filter(
                (it) => it.sku.toLowerCase().includes(q) || it.name.toLowerCase().includes(q)
              );
            }
            if (args.zone) {
              items = items.filter((it) => it.zone.toLowerCase() === String(args.zone).toLowerCase());
            }
            if (args.category) {
              items = items.filter(
                (it) => it.category.toLowerCase() === String(args.category).toLowerCase()
              );
            }
            if (args.low_stock_only) {
              items = items.filter((it) => it.status === "Low Stock" || it.status === "Out of Stock");
            }
            result = { count: items.length, items };
            matchedItems = items.slice(0, 5);
          } else if (call.name === "get_warehouse_metrics") {
            result = db.getMetrics();
          } else if (call.name === "get_transaction_audit_log") {
            const limit = typeof args.limit === "number" ? args.limit : 8;
            result = db.getTransactions(limit);
          } else if (call.name === "record_stock_movement") {
            const res = db.recordStockMovement({
              sku: String(args.sku),
              type: args.type as any,
              quantityChange: Number(args.quantity),
              performedBy: userName,
              role: userRole,
              reason: String(args.reason || "Recorded via OmniStock AI Assistant"),
            });
            result = { success: true, updatedItem: res.item, transaction: res.transaction };
            matchedItems = [res.item];
          }

          toolInvocations.push({
            name: call.name || "inventory_tool",
            args,
            result,
          });

          functionResponses.push({
            functionResponse: {
              id: call.id || "call_0",
              name: call.name,
              response: result,
            },
          });
        }

        // Send function responses back to Gemini for final synthesized narrative
        const candidateContent = response1.candidates?.[0]?.content;
        if (candidateContent) {
          const timeoutPromise2 = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Gemini API call 2 timed out after 8s")), 8000)
          );

          const response2 = await Promise.race([
            ai.models.generateContent({
              model: "gemini-3.8-flash",
              contents: [
                ...formattedContents,
                candidateContent,
                {
                  role: "user",
                  parts: functionResponses,
                },
              ],
              config: {
                systemInstruction,
                tools,
              },
            }),
            timeoutPromise2,
          ]);

          const finalReply = response2.text || "Here are the warehouse inventory details based on your query.";
          return {
            text: finalReply,
            toolInvocations,
            matchedItems,
            suggestedActions: generateSuggestedActions(userQuery, toolInvocations),
          };
        }
      }

      // If no function call was made
      return {
        text: response1.text || "I have analyzed your warehouse inquiry.",
        toolInvocations: [],
        matchedItems: [],
        suggestedActions: generateSuggestedActions(userQuery),
      };
    } catch (err: any) {
      console.error("Gemini API call failed, falling back to deterministic engine:", err);
      // Fall through to deterministic engine
    }
  }

  // Smart Deterministic Fallback Engine (runs if no API key or on transient API error)
  return runDeterministicWarehouseQuery(userQuery, userRole, userName);
}

function runDeterministicWarehouseQuery(
  query: string,
  role: "Admin" | "Warehouse Staff",
  userName: string
): AssistantResponse {
  const q = query.toLowerCase();
  const allItems = db.getAllItems();
  const metrics = db.getMetrics();
  const transactions = db.getTransactions(10);

  // 0A. Advisory: Pending Recommendations & Human-in-the-Loop review
  if (q.includes("recommend") || q.includes("approval") || q.includes("advisory") || q.includes("pending") || q.includes("queue")) {
    const recs = db.getRecommendations();
    const pending = recs.filter((r) => r.status === "PENDING_APPROVAL");
    let text = `### Human-in-the-Loop AI Advisory Recommendations (${pending.length} Pending Approval)\n\n`;
    text += `OmniStock acts strictly as an advisory and decision-support co-pilot. Every AI proposal requires human authorization prior to physical WMS execution:\n\n`;
    pending.forEach((r) => {
      text += `* **[${r.id}] ${r.title}** (${r.urgency} Priority)\n`;
      text += `  * **Forecast Accuracy:** **${r.forecastAccuracyPct}%** | Category: **${r.category}**\n`;
      text += `  * **Impact:** ${r.impactStatement}\n`;
      text += `  * **Reasoning:** ${r.reasoning}\n`;
      text += `  * **Action Required:** Open **Advisory & Approvals** tab to Approve, Modify, or Reject.\n\n`;
    });
    return {
      text,
      suggestedActions: [
        "Simulate Q4 holiday surge scenario",
        "Which items are running low?",
        "Flag operational anomalies",
      ],
    };
  }

  // 0B. Advisory: Scenario Simulation (e.g. holiday surge, supply delays)
  if (q.includes("simulate") || q.includes("scenario") || q.includes("surge") || q.includes("delay")) {
    const scenarioType = q.includes("delay") ? "SUPPLIER_DELAY" : "HOLIDAY_SURGE";
    const sim = db.simulateScenario(scenarioType);
    let text = `### Predictive Scenario Simulation: ${sim.scenarioName}\n\n`;
    text += `* **Forecast Confidence:** **${sim.forecastConfidencePct}%**\n`;
    text += `* **Simulation Window:** **${sim.simulatedDays} Days** | Demand Velocity: **${sim.demandMultiplier}x**\n`;
    text += `* **Executive Summary:** ${sim.summary}\n\n`;
    text += `#### At-Risk SKUs Identified by Model:\n`;
    sim.vulnerableSkus.forEach((v) => {
      text += `* **${v.name}** (\`${v.sku}\`):\n`;
      text += `  * Current Stock: **${v.currentStock}** | Projected Demand: **${v.projectedDemand}**\n`;
      text += `  * Time to Stockout: **${v.daysUntilStockout === 0 ? "IMMEDIATE (0 Days)" : v.daysUntilStockout + " Days"}**\n`;
      text += `  * **Advisory Recommendation:** ${v.recommendedMitigation}\n\n`;
    });
    text += `> **Human-in-the-Loop Guidance:** ${sim.aiAdvisoryGuidance}`;
    return {
      text,
      suggestedActions: [
        "Review pending AI recommendations",
        "Which items are running low?",
        "What is the total value of stock in Zone B?",
      ],
    };
  }

  // 0C. Advisory: Anomaly Detection
  if (q.includes("anomal") || q.includes("flag") || q.includes("drift") || q.includes("spike")) {
    let text = `### Automated Anomaly Detection & Diagnostic Scan\n\n`;
    text += `OmniStock diagnostic telemetry detected **3 operational anomalies** requiring human review:\n\n`;
    text += `1. **Stockout Starvation Anomaly (Zone B):** \`FMC-9020\` (Vinyl Packing Tape) has reached zero balance while 40 pick orders are queued. Recommendation **#REC-301** submitted for approval.\n`;
    text += `2. **Sub-optimal Pick Path Travel (Zone E to B):** Heavy Corrugated Cartons (\`PKG-1001\`) currently staged in rear dock, causing 340m redundant travel per order. Spatial relocation recommendation **#REC-302** submitted.\n`;
    text += `3. **Micro-Thermal Drift Variance (Zone D):** Bay D-02 compressor logged +1.6°C variances over 48 hours. Preventive work order **#REC-303** staged for human sign-off.\n\n`;
    text += `> **Status:** All anomalies converted into structured proposals in your **Advisory & Approvals** queue.`;
    return {
      text,
      suggestedActions: [
        "Review pending AI recommendations",
        "Simulate Q4 holiday surge",
        "Which items are running low?",
      ],
    };
  }

  // 1. Low stock / running low queries
  if (q.includes("low") || q.includes("out of stock") || q.includes("running low") || q.includes("reorder")) {
    const lowItems = allItems.filter((i) => i.status === "Low Stock" || i.status === "Out of Stock");
    const count = lowItems.length;

    let text = `### Low Stock & Out of Stock Alert Summary\n\n`;
    text += `There are currently **${count} items** requiring attention across the facility:\n\n`;

    lowItems.forEach((it) => {
      text += `* **${it.name}** (\`${it.sku}\`):\n`;
      text += `  * Current Stock: **${it.quantity} ${it.unit}** (Minimum Threshold: ${it.minThreshold})\n`;
      text += `  * Location: **${it.zone}** (Bin: \`${it.binLocation}\`)\n`;
      text += `  * Supplier: ${it.supplier.name} (Lead time: ~${it.supplier.leadTimeDays} days)\n`;
      text += `  * Status: **${it.status === "Out of Stock" ? "CRITICAL: OUT OF STOCK" : "LOW STOCK"}**\n\n`;
    });

    text += `> **Action Recommended:** Draft supplier purchase requisitions immediately, specifically for \`FMC-9020\` (Vinyl Packing Tape) and \`ELC-3304\` (Laser Rangefinder Sensor).`;

    return {
      text,
      matchedItems: lowItems,
      toolInvocations: [
        {
          name: "query_stock_inventory",
          args: { low_stock_only: true },
          result: { count, items: lowItems },
        },
      ],
      suggestedActions: [
        "Create purchase order for low stock items",
        "View Zone B packing tape alternatives",
        "Check supplier lead times",
      ],
    };
  }

  // 2. Zone valuation or zone specific queries (e.g., "What is the total value of stock in Zone B?")
  const zoneMatch = q.match(/zone\s+([a-e])/i);
  if (q.includes("value") || q.includes("valuation") || zoneMatch || q.includes("zone")) {
    if (zoneMatch) {
      const zoneLetter = zoneMatch[1].toUpperCase();
      const zoneCode = `Zone ${zoneLetter}`;
      const zoneSummary = metrics.zoneSummaries.find((z) => z.zoneCode === zoneCode);
      const zoneItems = allItems.filter((i) => i.zone === zoneCode);

      if (zoneSummary) {
        let text = `### Valuation & Status for ${zoneSummary.zoneCode} (${zoneSummary.name})\n\n`;
        text += `* **Total Valuation:** **$${zoneSummary.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**\n`;
        text += `* **Stored Units:** **${zoneSummary.totalQuantity.toLocaleString()}** units across **${zoneSummary.totalItems} SKUs**\n`;
        text += `* **Capacity Utilization:** **${zoneSummary.utilizationPct}%** of ${zoneSummary.capacity.toLocaleString()} unit capacity\n`;
        text += `* **Attention Alerts:** **${zoneSummary.lowStockAlerts}** items currently at or below minimum threshold\n\n`;
        text += `#### Key Items in ${zoneSummary.zoneCode}:\n`;
        zoneItems.slice(0, 4).forEach((it) => {
          text += `* **${it.name}** (\`${it.sku}\`): ${it.quantity} ${it.unit} @ $${it.unitPrice.toFixed(2)}/unit (Value: $${(it.quantity * it.unitPrice).toLocaleString()})\n`;
        });

        return {
          text,
          matchedItems: zoneItems,
          toolInvocations: [
            {
              name: "calculate_zone_valuation",
              args: { zone: zoneCode },
              result: zoneSummary,
            },
          ],
          suggestedActions: [
            `Show all items in ${zoneCode}`,
            "Compare valuation across all zones",
            "Check capacity utilization",
          ],
        };
      }
    }

    // Overall valuation
    let text = `### Overall Warehouse Inventory Valuation\n\n`;
    text += `* **Total Gross Valuation:** **$${metrics.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**\n`;
    text += `* **Total Physical Units:** **${metrics.totalQuantity.toLocaleString()}** units across **${metrics.totalSkus} SKUs**\n`;
    text += `* **Active Reorder Alerts:** **${metrics.reorderAlerts} items**\n\n`;
    text += `#### Zone Breakdown:\n`;
    metrics.zoneSummaries.forEach((z) => {
      text += `* **${z.zoneCode}** (${z.name}): **$${z.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}** (${z.totalQuantity} units, ${z.utilizationPct}% capacity)\n`;
    });

    return {
      text,
      matchedItems: allItems.slice(0, 4),
      toolInvocations: [
        {
          name: "get_warehouse_metrics",
          args: { include_zones: true },
          result: metrics,
        },
      ],
      suggestedActions: ["What is the total value of stock in Zone B?", "Which items are running low?"],
    };
  }

  // 3. "How many products are currently in stock?"
  if (q.includes("how many") || q.includes("products in stock") || q.includes("total products") || q.includes("count")) {
    let text = `### Real-Time Inventory Stock Census\n\n`;
    text += `* **Total Active SKUs:** **${metrics.totalSkus} distinct products**\n`;
    text += `* **Total Physical Stock Units:** **${metrics.totalQuantity.toLocaleString()} units**\n`;
    text += `* **Healthy Inventory (In Stock):** **${metrics.healthyStockCount} SKUs**\n`;
    text += `* **Low Stock Alerts:** **${metrics.lowStockCount} SKUs**\n`;
    text += `* **Stockouts (0 Available):** **${metrics.outOfStockCount} SKUs**\n\n`;
    text += `All products are partitioned across 5 designated storage zones (A through E).`;

    return {
      text,
      matchedItems: allItems.slice(0, 4),
      toolInvocations: [
        {
          name: "get_warehouse_metrics",
          args: {},
          result: metrics,
        },
      ],
      suggestedActions: ["Which items are running low?", "Show me the latest inventory transactions"],
    };
  }

  // 4. "Show me the latest inventory transactions."
  if (q.includes("transaction") || q.includes("movement") || q.includes("history") || q.includes("ledger") || q.includes("recent")) {
    let text = `### Recent Inventory Movements Ledger\n\n`;
    text += `Displaying the **${transactions.length} most recent ledger entries** recorded by the warehouse management system:\n\n`;

    transactions.forEach((tx) => {
      const typeBadge =
        tx.type === "STOCK_IN" ? "🟢 STOCK-IN" : tx.type === "STOCK_OUT" ? "🔴 STOCK-OUT" : "🟡 " + tx.type;
      const dateStr = new Date(tx.timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      text += `* **${tx.id}** [${typeBadge}] \`${tx.sku}\` — **${tx.itemName}**\n`;
      text += `  * Quantity: **${tx.type === "STOCK_OUT" ? "-" : "+"}${tx.quantity}** (Balance: ${tx.previousQuantity} ➔ **${tx.newQuantity}**)\n`;
      text += `  * Timestamp: ${dateStr} | Operator: **${tx.performedBy}** (${tx.role})\n`;
      text += `  * Reference: \`${tx.referenceNumber}\` (${tx.reason})\n\n`;
    });

    return {
      text,
      toolInvocations: [
        {
          name: "get_transaction_audit_log",
          args: { limit: 10 },
          result: transactions,
        },
      ],
      suggestedActions: [
        "Summarize this month's inventory activity",
        "Record a new stock-in",
        "Which items are low in stock?",
      ],
    };
  }

  // 5. "Summarize this month's inventory activity."
  if (q.includes("summarize") || q.includes("summary") || q.includes("month") || q.includes("activity")) {
    const stockIns = transactions.filter((t) => t.type === "STOCK_IN");
    const stockOuts = transactions.filter((t) => t.type === "STOCK_OUT");
    const totalInUnits = stockIns.reduce((a, b) => a + b.quantity, 0);
    const totalOutUnits = stockOuts.reduce((a, b) => a + b.quantity, 0);

    let text = `### Monthly Warehouse Operations & Inventory Activity Briefing\n\n`;
    text += `#### Executive Summary (November 2026):\n`;
    text += `* **Fulfillment Throughput:** Outbound fulfillment velocity remained steady with **${stockOuts.length} logged dispatches** totaling **${totalOutUnits} outbound units**.\n`;
    text += `* **Inbound Restocks:** Inbound receiving logged **${stockIns.length} major PO deliveries** totaling **${totalInUnits} incoming units**.\n`;
    text += `* **Current Valuation:** Total active warehouse valuation stands at **$${metrics.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**.\n`;
    text += `* **Risk Assessment:** ${metrics.outOfStockCount > 0 ? `⚠️ **${metrics.outOfStockCount} critical stockout** (\`FMC-9020\` Industrial Vinyl Tape)` : "No active stockouts."} Plus **${metrics.lowStockCount} items** approaching replenishment thresholds.\n`;
    text += `* **Zone Utilization:** Zone B (Fast Moving) is handling highest turnover; Zone D (Cold Storage) maintaining optimal 3°C - 5°C conditions.\n\n`;
    text += `> **Operational Directive:** Expedite supplier purchase orders for items under minimum thresholds to prevent order fulfillment bottlenecks.`;

    return {
      text,
      matchedItems: allItems.filter((i) => i.status !== "In Stock"),
      toolInvocations: [
        {
          name: "get_warehouse_metrics",
          args: { include_zones: true },
          result: metrics,
        },
      ],
      suggestedActions: [
        "Which items are running low?",
        "What is the total value of stock in Zone B?",
        "Show me the latest inventory transactions",
      ],
    };
  }

  // 6. Search for specific SKU or keyword (e.g. "battery", "tape", "ELC-1092")
  const matches = allItems.filter(
    (it) =>
      q.includes(it.sku.toLowerCase()) ||
      it.name.toLowerCase().split(" ").some((word) => word.length > 3 && q.includes(word))
  );

  if (matches.length > 0) {
    let text = `### Inventory Search Results\n\n`;
    text += `Found **${matches.length} matching product(s)**:\n\n`;

    matches.forEach((it) => {
      text += `* **${it.name}** (\`${it.sku}\`):\n`;
      text += `  * Current Stock: **${it.quantity} ${it.unit}** (Status: **${it.status}**)\n`;
      text += `  * Location: **${it.zone}** / Bin: \`${it.binLocation}\`\n`;
      text += `  * Price: **$${it.unitPrice.toFixed(2)}** | Total Value: **$${(it.quantity * it.unitPrice).toLocaleString()}**\n`;
      text += `  * Supplier: ${it.supplier.name} (${it.supplier.contactEmail})\n\n`;
    });

    return {
      text,
      matchedItems: matches,
      toolInvocations: [
        {
          name: "query_stock_inventory",
          args: { search: query },
          result: { count: matches.length, items: matches },
        },
      ],
      suggestedActions: [
        `Record stock-in for ${matches[0].sku}`,
        `Record stock-out for ${matches[0].sku}`,
        "Show transaction history",
      ],
    };
  }

  // Default helpful overview
  let text = `Hello! I am your **OmniStock AI Assistant**. I have real-time visibility into all ${metrics.totalSkus} SKUs, inventory transactions, and warehouse zones.\n\n`;
  text += `Here are quick questions you can ask me:\n`;
  text += `* *"How many products are currently in stock?"*\n`;
  text += `* *"Which items are running low?"*\n`;
  text += `* *"What is the total value of stock in Zone B?"*\n`;
  text += `* *"Show me the latest inventory transactions."*\n`;
  text += `* *"Summarize this month's inventory activity."*\n\n`;
  text += `You can also tell me to record inventory changes (e.g. *"Restock 20 units of ELC-1092"*).`;

  return {
    text,
    suggestedActions: [
      "Which items are running low?",
      "What is the total value of stock in Zone B?",
      "How many products are currently in stock?",
      "Show me the latest inventory transactions",
    ],
  };
}

function generateSuggestedActions(query: string, toolInvocations: any[] = []): string[] {
  const q = query.toLowerCase();
  if (q.includes("low")) {
    return [
      "Draft reorder purchase requisition",
      "What is the total value of stock in Zone B?",
      "Show me the latest inventory transactions",
    ];
  }
  if (q.includes("zone")) {
    return [
      "Compare valuation across all zones",
      "Which items are running low?",
      "Show me the latest inventory transactions",
    ];
  }
  return [
    "Which items are running low?",
    "What is the total value of stock in Zone B?",
    "How many products are currently in stock?",
    "Summarize this month's inventory activity",
  ];
}
