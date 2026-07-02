import React, { useState } from "react";
import { KnowledgeNode } from "../types";
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  Tag, 
  Cpu, 
  Check, 
  Loader2, 
  Terminal,
  FileText
} from "lucide-react";

interface KnowledgeNodesProps {
  nodes: KnowledgeNode[];
}

export default function KnowledgeNodes({ nodes }: KnowledgeNodesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Local filter for list
  const filteredNodes = nodes.filter(node => 
    node.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAiConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setIsAiLoading(true);
    setAiResponse("");

    try {
      const response = await fetch("/api/agent/query-knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiQuery }),
      });
      const data = await response.json();
      if (data.answer) {
        setAiResponse(data.answer);
      } else {
        setAiResponse("No solution compiled. Standard plant thresholds indicate typical operations.");
      }
    } catch (err) {
      console.error(err);
      setAiResponse("Communication failure with Gemini plant advisor core.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 overflow-y-auto h-full custom-scrollbar bg-surface-dim">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">Knowledge Nodes</h2>
        <p className="text-on-surface-variant text-xs mt-0.5">
          Shift manuals, standard operating procedures, and diagnostic catalogs compiled from resolved cases.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT & CENTER: Library Directory */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter manuals by tag, title, system name (e.g., 'conveyor', 'thermal')..."
              className="w-full bg-white border border-surface-highest rounded py-2.5 pl-10 pr-4 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-[#0052cc] focus:border-[#0052cc] transition-all"
            />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredNodes.map((node) => (
              <div 
                key={node.id} 
                className="bg-white border border-surface-highest hover:border-[#0052cc]/30 rounded p-5 flex flex-col justify-between transition-all shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#0052cc] bg-[#ebf2ff] px-2 py-0.5 rounded border border-[#c8e1ff] uppercase">
                      {node.id}
                    </span>
                    <span className="text-[10px] uppercase font-mono text-on-surface-variant font-bold">
                      {node.category}
                    </span>
                  </div>
                  
                  <h4 className="font-bold text-sm text-on-surface">{node.title}</h4>
                  
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {node.summary}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t border-surface-highest">
                  {node.tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="text-[9px] font-mono font-semibold text-[#0366d6] bg-[#f1f8ff] px-1.5 py-0.5 rounded border border-[#c8e1ff]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {filteredNodes.length === 0 && (
              <div className="col-span-full text-center py-12 text-on-surface-variant text-sm">
                No manuals found matching your filter parameters.
              </div>
            )}
          </div>

        </div>

        {/* RIGHT: Ask Gemini Plant Advisor */}
        <div className="bg-surface border border-surface-highest rounded p-6 h-fit flex flex-col gap-4 shadow-xs">
          <div className="flex items-center gap-2 text-on-surface">
            <Sparkles className="h-5 w-5 text-[#0052cc]" />
            <h3 className="font-bold text-sm">Gemini Advisor Core</h3>
          </div>
          
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Consult the integrated artificial intelligence system to synthesize repair instructions, compare anomalies with shift records, or lookup diagnostic tolerances.
          </p>

          <form onSubmit={handleAiConsult} className="space-y-3">
            <textarea
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Ask anything, e.g. 'How do I bypass pump cavitation issues?' or 'What is standard trigger offset on Line 3?'"
              rows={4}
              className="w-full bg-white border border-surface-highest rounded p-3 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-[#0052cc] focus:border-[#0052cc] transition-all resize-none"
            />
            <button
              type="submit"
              disabled={isAiLoading || !aiQuery.trim()}
              className="w-full py-2 bg-[#0052cc] hover:bg-[#0047b3] text-white font-semibold rounded text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 shadow-xs"
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Compiling Plant Manuals...
                </>
              ) : (
                <>
                  <BookOpen className="h-3.5 w-3.5" />
                  Query AI Advisor
                </>
              )}
            </button>
          </form>

          {/* AI Response Block */}
          {(aiResponse || isAiLoading) && (
            <div className="border border-[#c8e1ff] bg-[#ebf2ff] rounded p-4 font-mono text-xs text-on-surface space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between border-b border-[#c8e1ff] pb-1.5 text-[10px] text-on-surface-variant">
                <span>SYSTEM ANALYSIS OUTPUT</span>
                <span className="text-[#0052cc] font-bold">ACTIVE ADK CORE</span>
              </div>
              {isAiLoading ? (
                <div className="flex items-center justify-center py-6 text-on-surface-variant">
                  <Loader2 className="h-5 w-5 animate-spin mr-2 text-[#0052cc]" />
                  Accessing digital twins and repair logs...
                </div>
              ) : (
                <p className="leading-relaxed whitespace-pre-line text-on-surface">
                  {aiResponse}
                </p>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
