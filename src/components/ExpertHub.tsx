import React, { useState } from "react";
import { Incident } from "../types";
import { 
  Users, 
  Mail, 
  Sparkles, 
  Send, 
  ShieldAlert, 
  CheckCircle, 
  Loader2, 
  Activity,
  UserCheck
} from "lucide-react";

interface ExpertHubProps {
  incidents: Incident[];
}

export default function ExpertHub({ incidents }: ExpertHubProps) {
  const [selectedExpert, setSelectedExpert] = useState<string>("Mark (Logistics)");
  const [aiDraft, setAiDraft] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const experts = [
    {
      name: "Mark (Logistics)",
      role: "Shift Logistics Coordinator",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      focus: "Conveyor throughput, batch timing triggers, line clearance speed.",
      status: "On Shift & Active"
    },
    {
      name: "Sara (Quality)",
      role: "Lead Quality Inspector",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      focus: "Batch alignment variance, optical inspectors, zero-point calibration standards.",
      status: "On Shift & Active"
    },
    {
      name: "Dave (Maintenance)",
      role: "Thermal & Fluid Specialist",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      focus: "Recirculation pump thermal excursion, fluid pressure safety loop parameters.",
      status: "On Shift & Active"
    }
  ];

  const handleDraftBriefing = async () => {
    setIsAiLoading(true);
    setAiDraft("");

    const activeAnomalies = incidents
      .filter((inc) => inc.status === "Active")
      .map((inc) => `ID: ${inc.id} - ${inc.title} on ${inc.machineId} (${inc.severity})`)
      .join("\n");

    const queryPrompt = `Generate a highly professional, brief, action-oriented shift escalation report for our shift expert, "${selectedExpert}".
The plant is currently experiencing the following active telemetry anomalies:
${activeAnomalies || "None, standard operations."}

Draft a clear technical shift brief specifying what parameters need their attention (e.g., motor drag, flow rate, cavitation, alignment offsets) and request their formal review. Keep it under 150 words.`;

    try {
      const response = await fetch("/api/agent/query-knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryPrompt }),
      });
      const data = await response.json();
      if (data.answer) {
        setAiDraft(data.answer);
      } else {
        setAiDraft("Failed to generate shift brief. Plant parameters standard.");
      }
    } catch (err) {
      console.error(err);
      setAiDraft("AI brief compilation exception.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 overflow-y-auto h-full custom-scrollbar">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-on-surface">Expert Hub</h2>
        <p className="text-on-surface-variant text-sm mt-1">
          Shift engineering directory, specialists on duty, and rapid AI briefing log generation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT TWO-COLUMNS: Experts shifts list */}
        <div className="lg:col-span-2 space-y-4">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold font-mono block">
            Personnel Currently On Shift
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {experts.map((exp, idx) => (
              <div 
                key={idx}
                className="bg-surface-container-low border border-surface-container-high rounded-xl p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="flex gap-4 items-start">
                  <img 
                    alt={exp.name} 
                    className="h-12 w-12 rounded-lg object-cover border border-surface-container-highest shrink-0" 
                    src={exp.avatar} 
                  />
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-on-surface">{exp.name}</h4>
                    <span className="text-xs text-on-surface-variant font-mono block">{exp.role}</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-[10px] font-mono text-green-400 font-bold mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                      {exp.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-surface-container-highest/40 text-xs">
                  <p className="text-on-surface-variant leading-relaxed">
                    <span className="font-semibold text-on-surface">Focus Area:</span> {exp.focus}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT ONE-COLUMN: Rapid AI Shift brief */}
        <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-6 h-fit flex flex-col gap-4">
          <div className="flex items-center gap-2 text-on-surface">
            <Sparkles className="h-5 w-5 text-[#ffd7a9]" />
            <h3 className="font-bold text-base">Rapid AI Shift Esculator</h3>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed">
            Select a shift engineer and auto-draft an escalation brief summarizing active shift anomalies requiring their immediate review.
          </p>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono font-bold text-on-surface-variant block">
                Target Specialist
              </label>
              <select 
                value={selectedExpert}
                onChange={(e) => setSelectedExpert(e.target.value)}
                className="w-full bg-surface-lowest border border-surface-container-highest rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-[#ffd7a9] focus:border-[#ffd7a9] transition-all"
              >
                {experts.map((exp, idx) => (
                  <option key={idx} value={exp.name}>{exp.name} &bull; {exp.role}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleDraftBriefing}
              disabled={isAiLoading}
              className="w-full py-2 bg-[#704700]/10 hover:bg-[#704700]/35 border border-[#ffb347]/30 text-[#ffd7a9] font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 font-mono"
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Compiling Active Telemetry...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-[#ffd7a9]" />
                  Compile Brief Report
                </>
              )}
            </button>
          </div>

          {/* AI Brief Result */}
          {(aiDraft || isAiLoading) && (
            <div className="border border-surface-container-highest bg-[#010f1f] rounded-lg p-4 font-mono text-[11px] text-on-surface space-y-3">
              <div className="flex items-center justify-between border-b border-surface-container-highest/40 pb-2 text-[9px] text-on-surface-variant">
                <span>DRAFT COPIED TO SYSTEM LOGS</span>
                <span className="text-[#ffd7a9] animate-pulse">PENDING REVIEW</span>
              </div>
              
              {isAiLoading ? (
                <div className="text-center py-4 text-on-surface-variant">
                  Compiling anomaly streams...
                </div>
              ) : (
                <>
                  <p className="leading-relaxed whitespace-pre-line select-all cursor-text text-on-surface-variant">
                    {aiDraft}
                  </p>
                  <p className="text-[9px] text-[#ffd7a9] italic">
                    💡 Click on the text above to select and copy.
                  </p>
                </>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
