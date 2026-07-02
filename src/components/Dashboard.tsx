import React from "react";
import { Incident, ControlStats } from "../types";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  TrendingUp, 
  Zap,
  RotateCw,
  Gauge
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  CartesianGrid
} from "recharts";

interface DashboardProps {
  stats: ControlStats;
  incidents: Incident[];
  onSelectIncident: (id: string) => void;
  onNavigate: (tab: string) => void;
  onRefresh: () => void;
}

export default function Dashboard({ stats, incidents, onSelectIncident, onNavigate, onRefresh }: DashboardProps) {
  const activeIncidents = incidents.filter(i => i.status === "Active");
  const criticalCount = activeIncidents.filter(i => i.severity === "Critical" || i.severity === "Urgent").length;

  // Static mock efficiency data
  const efficiencyData = [
    { hour: "08:00", efficiency: 94 },
    { hour: "10:00", efficiency: 91 },
    { hour: "12:00", efficiency: 96 },
    { hour: "14:00", efficiency: 88 },
    { hour: "16:00", efficiency: 92 },
    { hour: "18:00", efficiency: 95 },
  ];

  // Plant stats summary
  const statusCards = [
    {
      title: "RESOLVED INCIDENTS",
      value: stats.resolved,
      icon: CheckCircle,
      color: "text-[#22863a]",
      bg: "bg-[#e6ffed]",
      border: "border-[#acf2bd]"
    },
    {
      title: "LESSONS RECORDED",
      value: stats.lessons,
      icon: Cpu,
      color: "text-[#0366d6]",
      bg: "bg-[#f1f8ff]",
      border: "border-[#c8e1ff]"
    },
    {
      title: "STOP MINUTES PREVENTED",
      value: stats.stopMinutesPrevented.toLocaleString(),
      icon: Clock,
      color: "text-[#0052cc] font-mono",
      bg: "bg-[#ebf2ff]",
      border: "border-[#c8e1ff]"
    },
    {
      title: "ACTIVE ALERTS",
      value: activeIncidents.length,
      secondary: `${criticalCount} Urgent`,
      icon: AlertTriangle,
      color: activeIncidents.length > 0 ? "text-[#d73a49]" : "text-[#22863a]",
      bg: activeIncidents.length > 0 ? "bg-[#ffeef0]" : "bg-[#e6ffed]",
      border: activeIncidents.length > 0 ? "border-[#f9c2c9]" : "border-[#acf2bd]"
    }
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 overflow-y-auto h-full custom-scrollbar bg-surface-dim">
      {/* Dashboard Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">System Dashboard</h2>
          <p className="text-on-surface-variant text-xs mt-0.5">
            Plant Operations & Digital Twin Command Center. Currently monitoring 3 primary sectors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onRefresh}
            className="flex items-center gap-2 bg-surface hover:bg-surface-container text-on-surface border border-surface-highest px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Sync Telemetry
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#e6ffed] border border-[#acf2bd] rounded text-[11px] font-mono font-bold text-[#22863a]">
            <span className="h-2 w-2 rounded-full bg-[#22863a] animate-pulse"></span>
            LIVE STREAM ACTIVE
          </div>
        </div>
      </div>

      {/* Grid Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className={`bg-surface border ${card.border} rounded p-5 flex items-center justify-between transition-all hover:scale-[1.01] shadow-xs`}
            >
              <div>
                <span className="block text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">
                  {card.title}
                </span>
                <span className={`text-2xl font-bold block ${card.color}`}>
                  {card.value}
                </span>
                {card.secondary && (
                  <span className="text-[11px] text-on-surface-variant font-mono block mt-1">
                    {card.secondary}
                  </span>
                )}
              </div>
              <div className={`p-2.5 ${card.bg} rounded border ${card.border}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Stats Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Efficiency Area Chart */}
        <div className="lg:col-span-2 bg-surface border border-surface-highest rounded p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#0052cc]" />
                Overall Equipment Effectiveness (OEE)
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Average through shift periods</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#0052cc] font-mono bg-[#ebf2ff] border border-[#c8e1ff] px-2 py-0.5 rounded">
              <TrendingUp className="h-3 w-3" />
              +1.4% Target
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={efficiencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="oeeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0052cc" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#0052cc" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e4e8" vertical={false} />
                <XAxis dataKey="hour" stroke="#6a737d" fontSize={11} tickLine={false} />
                <YAxis stroke="#6a737d" fontSize={11} tickLine={false} domain={[80, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e1e4e8", borderRadius: "4px", color: "#1a1a1a" }}
                  labelStyle={{ fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="efficiency" stroke="#0052cc" strokeWidth={2} fillOpacity={1} fill="url(#oeeGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Equipment Status Gauges */}
        <div className="bg-surface border border-surface-highest rounded p-6 flex flex-col justify-between shadow-xs">
          <div>
            <h3 className="font-bold text-sm text-on-surface flex items-center gap-2 mb-4">
              <Gauge className="h-4 w-4 text-[#0052cc]" />
              Machine Diagnostics
            </h3>
            
            <div className="space-y-4">
              {/* Conveyor 04 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-on-surface">CNV-04 Drive Motor</span>
                  <span className="text-[#d73a49] font-mono font-bold">42.8°C</span>
                </div>
                <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-[#d73a49] rounded-full" style={{ width: "85%" }}></div>
                </div>
              </div>

              {/* Pump 02 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-on-surface">Cooling Pump PMP-02</span>
                  <span className="text-[#0366d6] font-mono font-bold">58.2°C</span>
                </div>
                <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-[#0366d6] rounded-full" style={{ width: "68%" }}></div>
                </div>
              </div>

              {/* Robot arm */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-on-surface">Robot Arm Assembly RBT-01</span>
                  <span className="text-[#22863a] font-mono font-bold">34.5°C</span>
                </div>
                <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-[#22863a] rounded-full" style={{ width: "45%" }}></div>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => onNavigate("digitalTriplet")}
            className="w-full mt-6 py-2 bg-surface hover:bg-surface-container border border-surface-highest text-xs font-semibold text-on-surface rounded transition-colors cursor-pointer text-center block"
          >
            Open Real-Time Mirror
          </button>
        </div>
      </div>

      {/* Active Incidents Feed Snippet */}
      <div className="bg-surface border border-surface-highest rounded p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#d73a49]" />
              Shift Incidents Triage ({activeIncidents.length} Active)
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Select any anomaly to view its collaborative live feed</p>
          </div>
          <button 
            onClick={() => onNavigate("collaborativeFeed")}
            className="text-xs font-bold text-[#0052cc] hover:underline transition-all cursor-pointer"
          >
            View Feed Board &rarr;
          </button>
        </div>

        {activeIncidents.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant text-sm">
            <CheckCircle className="h-10 w-10 text-[#22863a] mx-auto mb-2 opacity-60" />
            No active shift incidents detected. Standard parameters observed.
          </div>
        ) : (
          <div className="divide-y divide-surface-highest border border-surface-highest rounded overflow-hidden bg-white">
            {activeIncidents.map((inc) => (
              <div 
                key={inc.id}
                onClick={() => {
                  onSelectIncident(inc.id);
                  onNavigate("collaborativeFeed");
                }}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-container transition-colors cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded border border-surface-highest uppercase">
                      {inc.id}
                    </span>
                    <h4 className="font-bold text-on-surface group-hover:text-[#0052cc] transition-colors">
                      {inc.title}
                    </h4>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      inc.severity === "Critical" ? "bg-[#ffeef0] border border-[#f9c2c9] text-[#d73a49]" :
                      inc.severity === "Urgent" ? "bg-[#fff5e6] border border-[#ffe0b3] text-[#b06000]" :
                      "bg-[#f1f8ff] border border-[#c8e1ff] text-[#0366d6]"
                    }`}>
                      {inc.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span>Machine: {inc.machineId}</span>
                    <span>•</span>
                    <span>Sensor: {inc.sensorId}</span>
                    <span>•</span>
                    <span>Detected: {inc.detected}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <div className="text-right hidden sm:block mr-2">
                    <span className="text-xs font-mono text-on-surface font-bold block">{inc.temp}°C</span>
                    <span className="text-[10px] text-on-surface-variant block uppercase font-mono">{inc.errorCode}</span>
                  </div>
                  <div className="h-7 w-7 rounded bg-surface-container border border-surface-highest flex items-center justify-center text-on-surface-variant group-hover:text-[#0052cc] group-hover:bg-primary-container group-hover:border-[#ebf2ff] transition-all">
                    &rarr;
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
