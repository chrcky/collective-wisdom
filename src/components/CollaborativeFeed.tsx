import React, { useState } from "react";
import { Incident, Message } from "../types";
import { 
  AlertTriangle, 
  MessageSquare, 
  Sparkles, 
  Send, 
  Cpu, 
  Thermometer, 
  Clock, 
  ShieldAlert,
  Loader2,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Flame,
  Wrench,
  Boxes
} from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface CollaborativeFeedProps {
  incidents: Incident[];
  selectedIncidentId: string;
  onSelectIncident: (id: string) => void;
  onPostMessage: (incidentId: string, text: string, role: string, sender: string) => Promise<void>;
  onTriggerAIAgent: (incidentId: string, prompt: string) => Promise<void>;
  onResolveIncident: (incidentId: string) => Promise<void>;
}

export default function CollaborativeFeed({ 
  incidents, 
  selectedIncidentId, 
  onSelectIncident, 
  onPostMessage, 
  onTriggerAIAgent,
  onResolveIncident
}: CollaborativeFeedProps) {
  const [chatText, setChatText] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [activeTab, setActiveTab] = useState<"discussion" | "ai_diagnostics">("discussion");
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  const incident = incidents.find((inc) => inc.id === selectedIncidentId) || incidents[0];

  if (!incident) {
    return (
      <div className="flex items-center justify-center h-full text-on-surface-variant text-sm">
        No active incidents. Control room parameters normal.
      </div>
    );
  }

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;

    setIsPosting(true);
    try {
      await onPostMessage(incident.id, chatText, "Operator", "Supervisor");
      setChatText("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleTriggerAI = async () => {
    const promptToSend = aiPrompt.trim() || "Run overall telemetry anomaly diagnostics on the current sensor block.";
    setIsAiLoading(true);
    try {
      await onTriggerAIAgent(incident.id, promptToSend);
      setAiPrompt("");
      setActiveTab("discussion"); // switch back to discussion to see comment
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Active statistics for top indicator
  const activeCount = incidents.filter(i => i.status === "Active").length;
  const urgentCount = incidents.filter(i => i.severity === "Critical" || i.severity === "Urgent").length;

  return (
    <div className="flex flex-1 overflow-hidden h-full bg-surface-dim">
      
      {/* LEFT SUB-SIDEBAR: Incident Switcher */}
      <div className={`bg-surface border-r border-surface-highest flex flex-col shrink-0 z-5 transition-all duration-300 ease-in-out ${
        isLeftPanelCollapsed ? "w-0 border-r-0 opacity-0 overflow-hidden" : "w-64 opacity-100"
      }`}>
        <div className="p-4 border-b border-surface-highest bg-surface-container flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold font-mono truncate">
            Active Anomaly Queue ({incidents.filter(i => i.status === "Active").length})
          </span>
          <button 
            onClick={() => setIsLeftPanelCollapsed(true)}
            className="p-1 rounded hover:bg-surface-highest text-on-surface-variant hover:text-[#0052cc] transition-all cursor-pointer shrink-0"
            title="Collapse Panel"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
          {incidents.map((inc) => {
            const isActive = inc.id === incident.id;
            return (
              <button
                key={inc.id}
                onClick={() => onSelectIncident(inc.id)}
                className={`w-full text-left p-3 rounded border transition-all flex flex-col gap-1.5 cursor-pointer ${
                  isActive 
                    ? "bg-primary-container border-[#0052cc]/30 text-[#0052cc]" 
                    : "bg-surface border-surface-highest hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-mono font-bold uppercase ${isActive ? "text-[#0052cc]" : "text-on-surface-variant"}`}>
                    {inc.id}
                  </span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    inc.severity === "Critical" ? "bg-[#ffeef0] text-[#d73a49] border border-[#f9c2c9]" :
                    inc.severity === "Urgent" ? "bg-[#fff5e6] text-[#b06000] border border-[#ffe0b3]" :
                    "bg-[#f1f8ff] text-[#0366d6] border border-[#c8e1ff]"
                  }`}>
                    {inc.severity}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs line-clamp-1">{inc.title}</h4>
                  <span className="text-[10px] text-on-surface-variant block font-mono mt-0.5">
                    {inc.machineId} {inc.linePosition !== undefined ? `(Pos ${inc.linePosition})` : ""} &bull; {inc.status}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CENTER: Operational Collaborative Feed */}
      <div className="flex-1 bg-surface-dim flex flex-col overflow-hidden relative">
        
        {/* Feed Header */}
        <div className="p-6 pb-4 border-b border-surface-highest bg-surface shrink-0 flex items-start justify-between">
          <div className="flex items-start gap-4">
            {isLeftPanelCollapsed && (
              <button 
                onClick={() => setIsLeftPanelCollapsed(false)}
                className="p-2 rounded hover:bg-surface-container text-on-surface-variant hover:text-[#0052cc] border border-surface-highest transition-all cursor-pointer mr-1 shrink-0 shadow-sm"
                title="Expand Anomaly Queue"
              >
                <ChevronRight className="h-5 w-5 animate-pulse" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-on-surface mb-0.5 tracking-tight">Collaborative Feed</h2>
              <p className="text-on-surface-variant text-xs">
                Continuous diagnostic and collaboration stream for resolving active industrial telemetry anomalies.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex gap-3 font-mono text-xs">
              <div className="bg-surface border border-surface-highest rounded px-3 py-1 flex flex-col items-center min-w-[70px]">
                <span className="text-on-surface-variant text-[9px] uppercase tracking-wider mb-0.5">Active:</span>
                <span className="text-sm font-bold text-[#0052cc]">{activeCount}</span>
              </div>
              <div className="bg-surface border border-surface-highest rounded px-3 py-1 flex flex-col items-center min-w-[70px]">
                <span className="text-on-surface-variant text-[9px] uppercase tracking-wider mb-0.5">Urgent:</span>
                <span className="text-sm font-bold text-[#d73a49]">{urgentCount}</span>
              </div>
            </div>

            {isRightPanelCollapsed && (
              <button 
                onClick={() => setIsRightPanelCollapsed(false)}
                className="p-2 rounded hover:bg-surface-container text-[#0052cc] hover:bg-primary-container border border-[#c8e1ff] transition-all cursor-pointer ml-1 shrink-0 shadow-sm"
                title="Expand Digital Triplet"
              >
                <ChevronLeft className="h-5 w-5 animate-pulse" />
              </button>
            )}
          </div>
        </div>

        {/* Live Discussion Board and Thread */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* Main Incident Card */}
          <article className="bg-surface border border-surface-highest rounded overflow-hidden shadow-xs">
            
            {/* Incident Summary Card Header */}
            <div className="p-5 border-b border-surface-highest bg-surface-container">
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1.5">
                  {incident.tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 rounded border border-[#c8e1ff] text-[#0366d6] text-[9px] uppercase font-bold tracking-wider font-mono bg-[#f1f8ff]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                  incident.severity === "Critical" 
                    ? "bg-[#ffeef0] border-[#f9c2c9] text-[#d73a49]" 
                    : incident.severity === "Urgent"
                    ? "bg-[#fff5e6] border-[#ffe0b3] text-[#b06000]"
                    : "bg-[#f1f8ff] border-[#c8e1ff] text-[#0366d6]"
                }`}>
                  <AlertTriangle className="h-3 w-3" />
                  {incident.severity}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-on-surface mb-1">{incident.title}</h3>
              
              <div className="flex items-center gap-3 text-xs font-mono text-on-surface-variant uppercase tracking-wider">
                <span>Incident ID: {incident.id}</span>
                <span>•</span>
                <span>Detected: {incident.detected}</span>
                <span>•</span>
                {incident.linePosition !== undefined && (
                  <>
                    <span>Line Position: {incident.linePosition}</span>
                    <span>•</span>
                  </>
                )}
                <span className={incident.status === "Resolved" ? "text-[#22863a] font-bold" : "text-[#b06000] font-bold"}>
                  STATUS: {incident.status}
                </span>
              </div>
            </div>

            {/* Thread timeline */}
            <div className="p-5 flex flex-col gap-6 bg-white">
              
              {incident.messages.map((msg) => {
                const isAi = msg.role === "AI Agent";
                return (
                  <div key={msg.id} className="flex gap-3 items-start">
                    <img 
                      alt={msg.sender} 
                      className={`h-9 w-9 rounded object-cover border shrink-0 ${
                        isAi ? "border-[#c8e1ff]" : "border-surface-highest"
                      }`} 
                      src={msg.avatar} 
                    />
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className={`font-bold text-xs ${isAi ? "text-[#0052cc]" : "text-on-surface"}`}>
                          {msg.sender} ({msg.role})
                        </span>
                        <span className="text-[10px] font-mono text-on-surface-variant">&bull; {msg.timestamp}</span>
                      </div>
                      
                      <div className={`p-3.5 rounded rounded-tl-none text-xs leading-relaxed border ${
                        isAi 
                          ? "bg-[#ebf2ff] border-[#c8e1ff] text-on-surface" 
                          : "bg-surface-container border-surface-highest text-on-surface"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Data Visualization Block embedded in the feed */}
              <div className="ml-12 bg-surface-container rounded border border-surface-highest p-4">
                <div className="flex justify-between items-center mb-4 font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                  <span>LIVE SENSOR STREAM: {incident.sensorId} telemetry</span>
                  <div className="flex items-center gap-1.5 text-[#0052cc]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0052cc] animate-ping"></span>
                    <span>Continuous sampling</span>
                  </div>
                </div>

                {/* Recharts Bar Chart reproducing high vibration sensor load bar graph */}
                <div className="h-32 w-full font-mono text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incident.chartData} barSize={28}>
                      <XAxis dataKey="time" stroke="#6a737d" fontSize={9} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e1e4e8", borderRadius: "4px" }}
                        labelStyle={{ color: "#1a1a1a" }}
                        itemStyle={{ color: "#0052cc" }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#0366d6" 
                        radius={[2, 2, 0, 0]} 
                        onClick={(data) => console.log("Selecting chart value", data)}
                      >
                        {
                          incident.chartData.map((entry, index) => {
                            // Style the bars: Highlight high loads or warnings with primary colors (orange/red/blue)
                            const isNow = entry.time === "Now";
                            let fill = "#c1c7ce"; // fallback grey
                            if (entry.value > 100) {
                              fill = "#d73a49"; // error/red limit
                            } else if (entry.value > 80) {
                              fill = "#b06000"; // warning orange
                            } else if (isNow) {
                              fill = "#0052cc"; // current Blue
                            } else {
                              fill = "#0366d6"; // normal container blue
                            }
                            return <rect key={`bar-${index}`} fill={fill} />;
                          })
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex justify-between mt-2 font-mono text-[9px] text-on-surface-variant uppercase tracking-widest border-t border-surface-highest pt-1.5">
                  <span>T-10M</span>
                  <span className="text-on-surface font-semibold">Peak Level: {Math.max(...incident.chartData.map(d=>d.value))}%</span>
                  <span>CURRENT</span>
                </div>
              </div>

            </div>
          </article>

        </div>

        {/* FEED FOOTER: Double tabs for Human Chat or Gemini Diagnostics Agent */}
        <div className="p-4 border-t border-surface-highest bg-surface shrink-0">
          
          <div className="flex border-b border-surface-highest mb-3 text-xs gap-3">
            <button 
              onClick={() => setActiveTab("discussion")}
              className={`pb-2 px-1 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "discussion" 
                  ? "border-[#0052cc] text-[#0052cc]" 
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Standard Operator Log
            </button>
            <button 
              onClick={() => setActiveTab("ai_diagnostics")}
              className={`pb-2 px-1 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "ai_diagnostics" 
                  ? "border-[#0052cc] text-[#0052cc]" 
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#0052cc]" />
              Trigger Gemini AI Diagnostics
            </button>
          </div>

          {activeTab === "discussion" ? (
            <form onSubmit={handlePostMessage} className="flex gap-2">
              <input 
                type="text"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Post standard shift update, tag component status..."
                disabled={isPosting || incident.status === "Resolved"}
                className="flex-1 bg-white border border-surface-highest rounded px-4 py-2 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-[#0052cc] focus:border-[#0052cc] transition-all"
              />
              <button
                type="submit"
                disabled={isPosting || !chatText.trim() || incident.status === "Resolved"}
                className="bg-surface-container hover:bg-surface-highest border border-surface-highest text-on-surface p-2 rounded transition-all cursor-pointer disabled:opacity-40"
              >
                {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe context / query (e.g. 'Analyze if the belt is slipping or if resolver heating is occurring...')"
                  disabled={isAiLoading || incident.status === "Resolved"}
                  className="flex-1 bg-white border border-[#c8e1ff] rounded px-4 py-2 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-[#0052cc] focus:border-[#0052cc] transition-all"
                />
                <button
                  type="button"
                  onClick={handleTriggerAI}
                  disabled={isAiLoading || incident.status === "Resolved"}
                  className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-4 py-2 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 shadow-xs"
                >
                  {isAiLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Scan Telemetry
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-on-surface-variant italic pl-1 font-mono">
                Powered by Gemini. Running real-time telemetry extraction, updating physical mirror parameters and creating an agent entry.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* RIGHT SIDEBAR: Digital Triplet Real-Time Mirror */}
      <aside className={`bg-surface border-l border-surface-highest flex flex-col shrink-0 z-5 transition-all duration-300 ease-in-out ${
        isRightPanelCollapsed ? "w-0 border-l-0 opacity-0 overflow-hidden" : "w-80 opacity-100"
      }`}>
        
        {/* Triplet Header */}
        <div className="p-5 border-b border-surface-highest bg-surface-container flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <h2 className="text-base font-bold text-on-surface tracking-tight">Digital Triplet</h2>
              <Cpu className="h-4 w-4 text-[#0052cc] animate-pulse" />
            </div>
            <p className="text-[9px] font-mono text-on-surface-variant uppercase tracking-wider">
              Real-Time System Mirror
            </p>
          </div>
          <button 
            onClick={() => setIsRightPanelCollapsed(true)}
            className="p-1 rounded hover:bg-surface-highest text-on-surface-variant hover:text-[#0052cc] transition-all cursor-pointer shrink-0 self-start"
            title="Collapse Panel"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Layer Blocks */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6 flex flex-col bg-white">
          
          {/* Physical Layer */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-widest">
              <Thermometer className="h-3.5 w-3.5" />
              Physical Layer
            </h3>
            <div className="border border-surface-highest rounded bg-surface-container p-4 font-mono text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Machine ID</span>
                <span className="text-on-surface font-bold">{incident.machineId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Sensor ID</span>
                <span className="text-on-surface font-bold">{incident.sensorId}</span>
              </div>
              {incident.linePosition !== undefined && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Line Position</span>
                  <span className="text-on-surface font-bold">{incident.linePosition}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Temp Limit</span>
                <span className={`font-bold ${incident.temp > 50 ? "text-[#d73a49]" : incident.temp > 40 ? "text-[#b06000]" : "text-[#22863a]"}`}>
                  {incident.temp}°C
                </span>
              </div>
              
              {/* Temp progress indicator */}
              <div className="h-1.5 w-full bg-surface border border-surface-highest rounded overflow-hidden">
                <div 
                  className={`h-full rounded transition-all duration-500 ${
                    incident.temp > 50 ? "bg-[#d73a49]" : incident.temp > 40 ? "bg-[#b06000]" : "bg-[#22863a]"
                  }`} 
                  style={{ width: `${Math.min(100, (incident.temp / 80) * 100)}%` }}
                ></div>
              </div>
              
              {incident.temp > 40 && (
                <p className="text-[9px] text-[#d73a49] font-semibold animate-pulse">
                  ⚠️ Thermal deviation warning detected
                </p>
              )}
            </div>
          </div>

          {/* Cyber Layer */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-widest">
              <ShieldAlert className="h-3.5 w-3.5" />
              Cyber Layer
            </h3>
            <div className="border border-surface-highest rounded bg-surface-container p-4 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Error Code</span>
                <span className="text-[#d73a49] font-bold">{incident.errorCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Batch No.</span>
                <span className="text-on-surface font-bold">{incident.batchNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Bus Latency</span>
                <span className="text-on-surface font-bold">{incident.latency}ms</span>
              </div>
            </div>
          </div>

          {/* Intention Layer */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5 text-[#0052cc]" />
              Intention Layer
            </h3>
            <div className="bg-[#ebf2ff] border border-[#c8e1ff] rounded p-4 relative overflow-hidden">
              <h4 className="text-[9px] font-mono text-[#0052cc] uppercase tracking-wider mb-2 relative z-10">
                AI Prediction Engine Rationale
              </h4>
              <p className="text-on-surface italic text-xs leading-relaxed mb-4 relative z-10">
                "{incident.rationale}"
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#0366d6] uppercase tracking-wider relative z-10">
                <Sparkles className="h-3.5 w-3.5 text-[#0366d6]" />
                AI Prediction Model: Active
              </div>
            </div>
          </div>

          {/* Expert Verification Requirement Warnings */}
          <div className="space-y-2 mt-2">
            <div className="border border-[#ffe0b3] rounded bg-[#fff5e6] p-3.5">
              <div className="flex items-start gap-2 text-[#b06000] mb-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <h4 className="font-bold text-xs">Expert Triage Advice</h4>
              </div>
              <p className="text-[#5c3e00] text-[11px] font-mono leading-relaxed pl-6">
                {incident.expertRequired}
              </p>
            </div>
          </div>

          {/* Resolution button at bottom */}
          {incident.status === "Active" ? (
            <button
              onClick={() => onResolveIncident(incident.id)}
              className="mt-auto pt-4 w-full bg-[#e6ffed] hover:bg-[#d4f7dc] border border-[#acf2bd] text-[#22863a] font-semibold py-2 px-4 rounded flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer shadow-xs"
            >
              <CheckCircle className="h-4 w-4" />
              Resolve Shift Incident
            </button>
          ) : (
            <div className="mt-auto pt-4 text-center py-2 border border-[#acf2bd] bg-[#e6ffed] rounded text-[#22863a] text-xs font-semibold font-mono">
              &radic; RESOLVED & SAVED TO MANUALS
            </div>
          )}

        </div>

      </aside>

    </div>
  );
}
