import React, { useState, useEffect } from "react";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  TrendingUp, 
  Search, 
  HelpCircle, 
  History, 
  Database, 
  FolderLock, 
  Compass, 
  Settings as SettingsIcon, 
  PhoneCall, 
  Plus, 
  PlusCircle, 
  X,
  Users,
  Gauge,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react";
import { Incident, ControlStats, KnowledgeNode } from "./types";
import Dashboard from "./components/Dashboard";
import CollaborativeFeed from "./components/CollaborativeFeed";
import KnowledgeNodes from "./components/KnowledgeNodes";
import DigitalTriplet from "./components/DigitalTriplet";
import ExpertHub from "./components/ExpertHub";
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from "./firebase";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  
  const [activeTab, setActiveTab] = useState<string>("collaborativeFeed");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<ControlStats>({ resolved: 124, lessons: 89, stopMinutesPrevented: 4500 });
  const [knowledgeNodes, setKnowledgeNodes] = useState<KnowledgeNode[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>("#CNV-492");
  
  // Search query from header bar
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State for New Entry
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMachine, setNewMachine] = useState("CNV-01");
  const [newSensor, setNewSensor] = useState("Sens-1");
  const [newSeverity, setNewSeverity] = useState<"Critical" | "Urgent" | "Warning" | "Info">("Warning");
  const [newTagsString, setNewTagsString] = useState("Production, Alignment");
  const [newLinePosition, setNewLinePosition] = useState("");

  // ==========================================
  // DEMO! WALKTHROUGH STATES & FLOWS
  // ==========================================
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoIncidentId, setDemoIncidentId] = useState<string | null>(null);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  // Auto-advance timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isDemoActive && isAutoPlay && !isDemoLoading) {
      timer = setTimeout(() => {
        if (demoStep === 1) {
          executeDemoStep2();
        } else if (demoStep === 3) {
          executeDemoStep3();
        } else if (demoStep === 4) {
          executeDemoStep4();
        } else if (demoStep === 5) {
          endDemo();
        }
      }, 8000); // 8 seconds per step to allow comfortable reading
    }
    return () => clearTimeout(timer);
  }, [isDemoActive, isAutoPlay, demoStep, isDemoLoading]);

  const startDemo = async () => {
    setIsDemoActive(true);
    setDemoStep(1);
    setIsDemoLoading(true);
    setIsAutoPlay(false);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Critical Conveyor Overload (DEMO!)",
          severity: "Urgent",
          tags: ["Production", "Logistics", "AI-Diagnostics"],
          machineId: "CNV-04",
          sensorId: "Sens-44",
          linePosition: 4
        })
      });
      if (res.ok) {
        const newlyCreated = await res.json();
        setDemoIncidentId(newlyCreated.id);
        setSelectedIncidentId(newlyCreated.id);
        await syncTelemetry();
        setActiveTab("collaborativeFeed");
      }
    } catch (err) {
      console.error("Failed to initiate DEMO!:", err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const executeDemoStep2 = async () => {
    if (!demoIncidentId) return;
    setDemoStep(2);
    setIsDemoLoading(true);
    try {
      await handleTriggerAIAgent(
        demoIncidentId, 
        "Execute automated diagnostics for the motor overload event on CNV-04."
      );
      setDemoStep(3);
    } catch (err) {
      console.error("Demo Step 2 failed:", err);
      setDemoStep(1); // revert on error
    } finally {
      setIsDemoLoading(false);
    }
  };

  const executeDemoStep3 = async () => {
    if (!demoIncidentId) return;
    setIsDemoLoading(true);
    try {
      await handleResolveIncident(demoIncidentId);
      setDemoStep(4);
    } catch (err) {
      console.error("Demo Step 3 failed:", err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const executeDemoStep4 = () => {
    setActiveTab("knowledgeNodes");
    setDemoStep(5);
  };

  const endDemo = () => {
    setIsDemoActive(false);
    setDemoStep(0);
    setDemoIncidentId(null);
    setIsAutoPlay(false);
    setActiveTab("dashboard");
    syncTelemetry();
  };

  // Subscribe to auth state on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch initial control room data on mount or when user changes
  const syncTelemetry = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch("/api/stats");
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch incidents
      const incidentsRes = await fetch("/api/incidents");
      const incidentsData = await incidentsRes.json();
      setIncidents(incidentsData);
      
      // Default selected incident if empty or current is invalid
      if (incidentsData.length > 0) {
        const hasCurrent = incidentsData.some((inc: Incident) => inc.id === selectedIncidentId);
        if (!hasCurrent) {
          setSelectedIncidentId(incidentsData[0].id);
        }
      }

      // Fetch knowledge nodes
      const knowledgeRes = await fetch("/api/knowledge");
      const knowledgeData = await knowledgeRes.json();
      setKnowledgeNodes(knowledgeData);
    } catch (err) {
      console.error("Telemetry sync error:", err);
    }
  };

  useEffect(() => {
    if (user) {
      syncTelemetry();
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Google sign-in error:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#090d16] text-white select-none">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-[#0052cc] animate-spin flex items-center justify-center shadow-lg shadow-[#0052cc]/30">
            <Cpu className="h-6 w-6 text-white" />
          </div>
          <p className="text-xs font-mono tracking-widest text-gray-400 uppercase animate-pulse">Initializing Digital Triplet...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#090d16] text-white select-none relative overflow-hidden font-sans">
        {/* Animated aura background */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-[#0052cc]/20 to-[#6200ee]/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#03dac6]/15 to-[#0052cc]/10 rounded-full blur-[120px] animate-pulse delay-75"></div>

        {/* Floating grid design overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

        <div className="w-full max-w-md px-8 py-12 bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl shrink-0 z-10 relative flex flex-col items-center text-center">
          {/* CB Brand Icon */}
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#0052cc] to-[#33b1ff] flex items-center justify-center text-white shadow-xl shadow-[#0052cc]/20 mb-6">
            <Cpu className="h-8 w-8 animate-pulse" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white mb-2">Collective Wisdom</h1>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-wider mb-8">Autonomous AI Diagnostics & Digital Triplet</p>

          <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800/80 mb-8 text-left w-full">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-[#33b1ff] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white mb-0.5">Control Center Secured</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">Authorized lead operators and calibration chiefs must authenticate using secure Google Identity credentials.</p>
              </div>
            </div>
          </div>

          {/* Sign in with Google Button */}
          <button 
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer text-sm"
          >
            {/* Google G logo svg */}
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.62-1.09-1.34-1.36-2.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google
          </button>

          <span className="block text-[10px] text-gray-500 font-mono mt-8">System node status: operational // secure shell v1.1.2</span>
        </div>
      </div>
    );
  }

  const handlePostMessage = async (incidentId: string, text: string, role: string, sender: string) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender, role, text }),
      });
      if (res.ok) {
        await syncTelemetry();
      }
    } catch (err) {
      console.error("Failed to post message:", err);
    }
  };

  const handleTriggerAIAgent = async (incidentId: string, prompt: string) => {
    try {
      const res = await fetch("/api/agent/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentId, userPrompt: prompt }),
      });
      if (res.ok) {
        await syncTelemetry();
      }
    } catch (err) {
      console.error("Gemini invocation failed:", err);
    }
  };

  const handleResolveIncident = async (incidentId: string) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/resolve`, {
        method: "POST",
      });
      if (res.ok) {
        await syncTelemetry();
      }
    } catch (err) {
      console.error("Incident resolution issue:", err);
    }
  };

  const handleCreateNewEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          severity: newSeverity,
          tags: newTagsString.split(",").map(t => t.trim()).filter(Boolean),
          machineId: newMachine,
          sensorId: newSensor,
          linePosition: newLinePosition ? Number(newLinePosition) : undefined
        })
      });

      if (res.ok) {
        const newlyCreated = await res.json();
        await syncTelemetry();
        setSelectedIncidentId(newlyCreated.id);
        setIsNewEntryOpen(false);
        setNewTitle("");
        setNewLinePosition("");
        setActiveTab("collaborativeFeed"); // route operator straight to feed board
      }
    } catch (err) {
      console.error("Failed to insert new entry:", err);
    }
  };

  // Filter query triggers Knowledge tab pre-filtering
  const handleHeaderSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveTab("knowledgeNodes");
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden text-sm bg-surface-dim text-on-surface select-none font-sans">
      
      {/* TOP APP BAR */}
      <header className="h-16 flex items-center justify-between px-6 bg-surface border-b border-surface-highest shrink-0 z-10 relative">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
            <div className="h-6 w-6 rounded bg-[#0052cc] flex items-center justify-center text-white font-black text-xs">
              CB
            </div>
            <h1 className="text-base font-bold tracking-tight text-on-surface">Collective Wisdom</h1>
            <span className="text-on-surface-variant/40 font-light">/</span>
            <span className="text-xs text-on-surface-variant font-medium">Agent Dashboard</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-on-surface-variant font-mono">
            <div>
              <span className="block text-[9px] uppercase tracking-wider opacity-60">Resolved</span>
              <span className="text-sm font-bold text-on-surface">{stats.resolved}</span>
            </div>
            <div className="h-8 w-px bg-surface-highest"></div>
            <div>
              <span className="block text-[9px] uppercase tracking-wider opacity-60">Lessons</span>
              <span className="text-sm font-bold text-on-surface">{stats.lessons}</span>
            </div>
            <div className="h-8 w-px bg-surface-highest"></div>
            <div>
              <span className="block text-[9px] uppercase tracking-wider opacity-60">Stop Minutes Prevented</span>
              <span className="text-sm font-bold text-[#0052cc] font-mono">{stats.stopMinutesPrevented.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Global Search and action icons */}
        <div className="flex items-center gap-4">
          <form onSubmit={handleHeaderSearchSubmit} className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plant manual nodes..."
              className="w-full bg-surface-container border border-surface-highest rounded py-1.5 pl-9 pr-4 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-[#0052cc] focus:border-[#0052cc] transition-all"
            />
          </form>

          {/* DEMO! Trigger Button */}
          <button 
            onClick={isDemoActive ? endDemo : startDemo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer border ${
              isDemoActive 
                ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200" 
                : "bg-gradient-to-r from-[#6200ee] to-[#0052cc] hover:from-[#5000d6] hover:to-[#0047b3] text-white border-transparent"
            }`}
            title="Launch or stop the interactive walkthrough tour"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isDemoActive ? "" : "animate-pulse"}`} />
            <span>{isDemoActive ? "Exit Tour" : "DEMO!"}</span>
          </button>

          <button 
            onClick={syncTelemetry}
            title="Force telemetry rebuild"
            className="p-2 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <History className="h-5 w-5" />
          </button>

          <button 
            onClick={() => setActiveTab("dashboard")}
            title="Open analytics dashboard"
            className="p-2 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <Activity className="h-5 w-5" />
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 p-1 px-2 rounded-lg hover:bg-surface-container transition-all border border-transparent hover:border-surface-highest cursor-pointer focus:outline-none"
            >
              {user.photoURL ? (
                <img 
                  alt={user.displayName || "Operator Avatar"} 
                  className="h-8 w-8 rounded-full border border-surface-highest object-cover" 
                  src={user.photoURL}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary-container border border-surface-highest flex items-center justify-center text-[#0052cc] font-bold text-xs font-mono uppercase">
                  {user.displayName ? user.displayName.charAt(0) : (user.email ? user.email.charAt(0) : "OP")}
                </div>
              )}
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-on-surface leading-tight truncate max-w-[120px]">
                  {user.displayName || "Operator"}
                </span>
                <span className="text-[9px] font-mono text-on-surface-variant uppercase tracking-wider leading-none">
                  Calibration Chief
                </span>
              </div>
            </button>

            {isProfileOpen && (
              <>
                {/* Backdrop to close click outside */}
                <div 
                  className="fixed inset-0 z-20 cursor-default" 
                  onClick={() => setIsProfileOpen(false)}
                />
                
                {/* Dropdown Card */}
                <div className="absolute right-0 mt-2 w-72 bg-surface border border-surface-highest rounded-xl shadow-xl z-30 overflow-hidden animate-fadeIn py-1">
                  <div className="p-4 border-b border-surface-highest bg-surface-container flex items-center gap-3">
                    {user.photoURL ? (
                      <img 
                        alt={user.displayName || "Operator Avatar"} 
                        className="h-12 w-12 rounded-full border border-surface-highest object-cover shrink-0" 
                        src={user.photoURL}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary-container border border-surface-highest flex items-center justify-center text-[#0052cc] font-bold text-base shrink-0 font-mono uppercase">
                        {user.displayName ? user.displayName.charAt(0) : (user.email ? user.email.charAt(0) : "OP")}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-on-surface truncate">{user.displayName || "Lead Operator"}</h4>
                      <p className="text-[10px] text-on-surface-variant truncate font-mono">{user.email || "operator@nerdter.local"}</p>
                      <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-50 text-[9px] font-mono text-green-700 border border-green-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Active Operator
                      </div>
                    </div>
                  </div>

                  <div className="p-1">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left cursor-pointer focus:outline-none"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      Sign Out Securely
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* LOWER PANEL WRAPPER */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDE BAR NAVIGATION */}
        <nav className={`bg-surface border-r border-surface-highest flex flex-col justify-between shrink-0 z-10 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "w-16" : "w-64"
        }`}>
          <div className="p-4 flex flex-col gap-5 overflow-y-auto overflow-x-hidden custom-scrollbar">
            
            {/* Plant Ops info block */}
            <div className={`flex items-center gap-3 p-3 rounded bg-surface-container border border-surface-highest transition-all duration-300 ${
              isSidebarCollapsed ? "justify-center p-2" : ""
            }`} title={isSidebarCollapsed ? "Plant Ops Central Division" : undefined}>
              <div className="h-8 w-8 bg-primary-container rounded flex items-center justify-center text-[#0052cc] shrink-0">
                <Database className="h-4.5 w-4.5" />
              </div>
              {!isSidebarCollapsed && (
                <div className="animate-fadeIn">
                  <h2 className="font-bold text-on-surface text-xs leading-tight">Plant Ops</h2>
                  <p className="text-[9px] text-on-surface-variant font-mono uppercase tracking-wider">Central Division</p>
                </div>
              )}
            </div>

            {/* "+ New Entry" operator trigger */}
            <button 
              onClick={() => setIsNewEntryOpen(true)}
              className={`bg-[#0052cc] hover:bg-[#0047b3] text-white font-semibold py-2 rounded flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-sm text-xs ${
                isSidebarCollapsed ? "w-10 h-10 p-0 rounded-full mx-auto" : "w-full px-4"
              }`}
              title={isSidebarCollapsed ? "New Anomaly Entry" : undefined}
            >
              <PlusCircle className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">New Anomaly Entry</span>}
            </button>

            {/* Nav links */}
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-3 py-2.5 text-left rounded transition-all duration-200 text-xs font-semibold cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-primary-container text-[#0052cc] border-r-[3px] border-[#0052cc] font-bold"
                    : "text-on-surface-variant hover:bg-surface-container/60 hover:text-on-surface"
                } ${isSidebarCollapsed ? "justify-center px-0" : "px-4"}`}
                title={isSidebarCollapsed ? "Dashboard" : undefined}
              >
                <Gauge className="h-4.5 w-4.5 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Dashboard</span>}
              </button>

              <button 
                onClick={() => setActiveTab("collaborativeFeed")}
                className={`flex items-center gap-3 py-2.5 text-left rounded transition-all duration-200 text-xs font-semibold cursor-pointer ${
                  activeTab === "collaborativeFeed"
                    ? "bg-primary-container text-[#0052cc] border-r-[3px] border-[#0052cc] font-bold"
                    : "text-on-surface-variant hover:bg-surface-container/60 hover:text-on-surface"
                } ${isSidebarCollapsed ? "justify-center px-0" : "px-4"}`}
                title={isSidebarCollapsed ? "Collaborative Feed" : undefined}
              >
                <Activity className="h-4.5 w-4.5 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Collaborative Feed</span>}
              </button>

              <button 
                onClick={() => setActiveTab("knowledgeNodes")}
                className={`flex items-center gap-3 py-2.5 text-left rounded transition-all duration-200 text-xs font-semibold cursor-pointer ${
                  activeTab === "knowledgeNodes"
                    ? "bg-primary-container text-[#0052cc] border-r-[3px] border-[#0052cc] font-bold"
                    : "text-on-surface-variant hover:bg-surface-container/60 hover:text-on-surface"
                } ${isSidebarCollapsed ? "justify-center px-0" : "px-4"}`}
                title={isSidebarCollapsed ? "Knowledge Nodes" : undefined}
              >
                <FolderLock className="h-4.5 w-4.5 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Knowledge Nodes</span>}
              </button>

              <button 
                onClick={() => setActiveTab("digitalTriplet")}
                className={`flex items-center gap-3 py-2.5 text-left rounded transition-all duration-200 text-xs font-semibold cursor-pointer ${
                  activeTab === "digitalTriplet"
                    ? "bg-primary-container text-[#0052cc] border-r-[3px] border-[#0052cc] font-bold"
                    : "text-on-surface-variant hover:bg-surface-container/60 hover:text-on-surface"
                } ${isSidebarCollapsed ? "justify-center px-0" : "px-4"}`}
                title={isSidebarCollapsed ? "Digital Triplet" : undefined}
              >
                <Cpu className="h-4.5 w-4.5 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Digital Triplet</span>}
              </button>

              <button 
                onClick={() => setActiveTab("expertHub")}
                className={`flex items-center gap-3 py-2.5 text-left rounded transition-all duration-200 text-xs font-semibold cursor-pointer ${
                  activeTab === "expertHub"
                    ? "bg-primary-container text-[#0052cc] border-r-[3px] border-[#0052cc] font-bold"
                    : "text-on-surface-variant hover:bg-surface-container/60 hover:text-on-surface"
                } ${isSidebarCollapsed ? "justify-center px-0" : "px-4"}`}
                title={isSidebarCollapsed ? "Expert Hub" : undefined}
              >
                <Users className="h-4.5 w-4.5 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Expert Hub</span>}
              </button>
            </div>

          </div>

          {/* Footer links */}
          <div className="p-4 border-t border-surface-highest flex flex-col gap-1 shrink-0">
            <button 
              onClick={() => alert("Control console version 2.4.8. Security protocol active.")}
              className={`flex items-center gap-3 py-2 text-left rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all duration-200 text-xs font-semibold cursor-pointer ${
                isSidebarCollapsed ? "justify-center px-0" : "px-3"
              }`}
              title={isSidebarCollapsed ? "Settings" : undefined}
            >
              <SettingsIcon className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Settings</span>}
            </button>
            <button 
              onClick={() => alert("Escalation sequence synced with master control terminal.")}
              className={`flex items-center gap-3 py-2 text-left rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all duration-200 text-xs font-semibold cursor-pointer ${
                isSidebarCollapsed ? "justify-center px-0" : "px-3"
              }`}
              title={isSidebarCollapsed ? "Support" : undefined}
            >
              <PhoneCall className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Support</span>}
            </button>
            
            {/* Collapse Toggle Button */}
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`flex items-center gap-3 py-2 text-left rounded text-on-surface-variant hover:bg-surface-container hover:text-[#0052cc] transition-all duration-200 text-xs font-semibold cursor-pointer mt-1 border-t border-surface-highest/40 pt-2 ${
                isSidebarCollapsed ? "justify-center px-0" : "px-3"
              }`}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-4 w-4 shrink-0 text-[#0052cc]" />
              ) : (
                <ChevronLeft className="h-4 w-4 shrink-0" />
              )}
              {!isSidebarCollapsed && <span className="truncate">Collapse Sidebar</span>}
            </button>
          </div>
        </nav>

        {/* MAIN COMPONENT CANVAS */}
        <main className="flex-1 overflow-hidden relative bg-surface-dim">
          {activeTab === "dashboard" && (
            <Dashboard 
              stats={stats} 
              incidents={incidents} 
              onSelectIncident={setSelectedIncidentId}
              onNavigate={setActiveTab}
              onRefresh={syncTelemetry}
            />
          )}

          {activeTab === "collaborativeFeed" && (
            <CollaborativeFeed 
              incidents={incidents}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={setSelectedIncidentId}
              onPostMessage={handlePostMessage}
              onTriggerAIAgent={handleTriggerAIAgent}
              onResolveIncident={handleResolveIncident}
            />
          )}

          {activeTab === "knowledgeNodes" && (
            <KnowledgeNodes nodes={knowledgeNodes} />
          )}

          {activeTab === "digitalTriplet" && (
            <DigitalTriplet 
              incidents={incidents}
              onNavigate={setActiveTab}
              onSelectIncident={setSelectedIncidentId}
            />
          )}

          {activeTab === "expertHub" && (
            <ExpertHub incidents={incidents} />
          )}
        </main>

      </div>

      {/* "+ NEW SHIFT ENTRY" DIALOG MODAL */}
      {isNewEntryOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-surface-highest rounded w-full max-w-lg overflow-hidden shadow-lg">
            
            <div className="px-6 py-4 border-b border-surface-highest flex items-center justify-between bg-surface-container">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#0052cc]" />
                Log New Shift Anomaly
              </h3>
              <button 
                onClick={() => setIsNewEntryOpen(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewEntry} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-mono uppercase font-bold text-[10px] block">
                  Anomaly Title / Descriptor
                </label>
                <input 
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Inbound Conveyor Jam - Line 3"
                  className="w-full bg-white border border-surface-highest rounded px-3 py-2 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-[#0052cc] focus:border-[#0052cc] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-on-surface-variant font-mono uppercase font-bold text-[10px] block">
                    Target Machine ID
                  </label>
                  <input 
                    type="text"
                    required
                    value={newMachine}
                    onChange={(e) => setNewMachine(e.target.value)}
                    placeholder="e.g. CNV-04"
                    className="w-full bg-white border border-surface-highest rounded px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-[#0052cc]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-on-surface-variant font-mono uppercase font-bold text-[10px] block">
                    Sensor Stream ID
                  </label>
                  <input 
                    type="text"
                    required
                    value={newSensor}
                    onChange={(e) => setNewSensor(e.target.value)}
                    placeholder="e.g. Prox-9"
                    className="w-full bg-white border border-surface-highest rounded px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-[#0052cc]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-on-surface-variant font-mono uppercase font-bold text-[10px] block">
                    Triage Severity
                  </label>
                  <select 
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full bg-white border border-surface-highest rounded px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-[#0052cc]"
                  >
                    <option value="Critical">Critical</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Warning">Warning</option>
                    <option value="Info">Info</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-on-surface-variant font-mono uppercase font-bold text-[10px] block">
                    Sectors / Tag Categories
                  </label>
                  <input 
                    type="text"
                    value={newTagsString}
                    onChange={(e) => setNewTagsString(e.target.value)}
                    placeholder="Comma-separated (e.g., Production, Logistics)"
                    className="w-full bg-white border border-surface-highest rounded px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-[#0052cc]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface-variant font-mono uppercase font-bold text-[10px] block">
                  Production Line Position
                </label>
                <input 
                  type="text"
                  value={newLinePosition}
                  onChange={(e) => setNewLinePosition(e.target.value)}
                  placeholder="e.g. 1, 2, 33"
                  className="w-full bg-white border border-surface-highest rounded px-3 py-2 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-[#0052cc] focus:border-[#0052cc] transition-all"
                />
              </div>

              <div className="pt-4 border-t border-surface-highest flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsNewEntryOpen(false)}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-highest text-on-surface rounded transition-colors cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#0052cc] hover:bg-[#0047b3] text-white font-semibold rounded transition-colors cursor-pointer"
                >
                  Commit Entry
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* FLOATING DEMO! WALKTHROUGH PANEL */}
      {isDemoActive && (
        <div className="fixed bottom-6 right-6 w-96 bg-white border-2 border-[#0052cc]/30 rounded-xl shadow-2xl z-40 overflow-hidden animate-slideUp font-sans">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#0052cc] to-[#6200ee] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-pulse text-yellow-300" />
              <span className="font-extrabold text-xs uppercase tracking-wider">DEMO! TOUR</span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* AutoPlay Toggle */}
              <button
                type="button"
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                  isAutoPlay 
                    ? "bg-white text-[#0052cc] border-white cursor-pointer" 
                    : "bg-transparent text-white/85 border-white/30 hover:bg-white/10 cursor-pointer"
                }`}
                title="Automatically advance steps every 8 seconds"
              >
                {isAutoPlay ? "⏸️ Auto Active" : "▶️ Auto Play"}
              </button>
              <button 
                type="button"
                onClick={endDemo}
                className="text-white/80 hover:text-white p-0.5 rounded transition-colors cursor-pointer focus:outline-none"
                title="Exit Demo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 w-full bg-gray-100 relative">
            <div 
              className="h-full bg-gradient-to-r from-[#0052cc] to-[#03dac6] transition-all duration-500 ease-out" 
              style={{ width: `${(demoStep / 5) * 100}%` }}
            />
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-[#ebf2ff] flex items-center justify-center text-[#0052cc] font-extrabold text-xs shrink-0 font-mono border border-[#0052cc]/20">
                {demoStep}
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-on-surface">
                  {demoStep === 1 && "Step 1: Logging a Live Machine Anomaly"}
                  {demoStep === 2 && "Step 2: AI Processing Telemetry"}
                  {demoStep === 3 && "Step 3: Receiving AI Recalibration Proposal"}
                  {demoStep === 4 && "Step 4: Calibration Applied & Incident Resolved"}
                  {demoStep === 5 && "Step 5: Automated Lessons Synthesized"}
                </h4>
                <p className="text-[11px] text-[#4a5568] leading-relaxed">
                  {demoStep === 1 && "We simulated a live operational breach: a torque spike causing a conveyor belt overload on physical line Axis 4. Express logged the sensor telemetry in Firestore and automatically routed the shift crew to the collaborative feed panel."}
                  {demoStep === 2 && "The Gemini Operator AI has been invoked! Using the Google ADK, it is evaluating live telemetry streams, analyzing historical maintenance manual nodes, and generating precision safety offsets."}
                  {demoStep === 3 && "Gemini successfully generated diagnostics! Look at the chat: the AI Agent has recommended a -150ms timing gate trigger offset to bypass friction belt slippage. The proposed physical recalibrations are loaded in the panel."}
                  {demoStep === 4 && "The shift chief approved and applied the calibration! The metrics are fully restored to safe ranges. Notice that 'Resolved Incidents' and 'Stop Minutes Prevented' updated live in the top header bar!"}
                  {demoStep === 5 && "Finally, Gemini extracted the technical lesson learned from this resolution and synthesized it as a permanent Knowledge Node in the manual library. This automates knowledge capture, preventing repeat downtime."}
                </p>
              </div>
            </div>

            {/* Error or Loading state */}
            {isDemoLoading && (
              <div className="flex items-center gap-2 justify-center py-1.5 bg-[#f6f8fa] border border-[#e1e4e8] rounded text-[10px] font-mono text-[#0052cc] animate-pulse">
                <Cpu className="h-3.5 w-3.5 animate-spin" />
                <span>Syncing Cloud Assets...</span>
              </div>
            )}

            {/* Controls */}
            <div className="pt-3 border-t border-[#e1e4e8] flex items-center justify-between">
              <button 
                type="button"
                onClick={endDemo}
                className="text-[11px] font-bold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                Reset & Exit
              </button>

              <button
                type="button"
                onClick={() => {
                  if (demoStep === 1) executeDemoStep2();
                  else if (demoStep === 3) executeDemoStep3();
                  else if (demoStep === 4) executeDemoStep4();
                  else if (demoStep === 5) endDemo();
                }}
                disabled={demoStep === 2 || isDemoLoading}
                className={`flex items-center gap-1 px-4 py-1.5 rounded text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  demoStep === 2 || isDemoLoading
                    ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                    : "bg-[#0052cc] hover:bg-[#0047b3] text-white hover:shadow"
                }`}
              >
                <span>
                  {demoStep === 1 && "Invoke Gemini AI 🤖"}
                  {demoStep === 2 && "Analyzing..."}
                  {demoStep === 3 && "Approve & Resolve ✅"}
                  {demoStep === 4 && "Verify Knowledge Base 📁"}
                  {demoStep === 5 && "Complete Tour 🏁"}
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
