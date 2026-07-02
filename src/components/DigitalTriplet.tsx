import React, { useState } from "react";
import { Incident } from "../types";
import { 
  Activity, 
  Settings, 
  Cpu, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  Network, 
  ShieldCheck, 
  FileSpreadsheet, 
  Boxes 
} from "lucide-react";

interface DigitalTripletProps {
  incidents: Incident[];
  onNavigate: (tab: string) => void;
  onSelectIncident: (id: string) => void;
}

export default function DigitalTriplet({ incidents, onNavigate, onSelectIncident }: DigitalTripletProps) {
  const [selectedAsset, setSelectedAsset] = useState<"CNV-04" | "PMP-02" | "RBT-01">("CNV-04");

  const assetDetails = {
    "CNV-04": {
      name: "Inbound Conveyor Drive Module",
      sector: "Sector A - Logistics Gateway",
      status: incidents.find(i => i.machineId === "CNV-04" && i.status === "Active") ? "Anomalous" : "Standard",
      incidentId: incidents.find(i => i.machineId === "CNV-04")?.id || null,
      sensor: "Prox-9",
      temp: "42.8°C",
      vibration: "High Vibration Alarm Active",
      subsystems: ["Drive Motor Block", "Gate Calibrator Node", "Clearing Sweeper Subsystem"],
      specs: {
        throughput: "14.2 tons/hr",
        dutyCycle: "92.4%",
        efficiency: "88%"
      }
    },
    "PMP-02": {
      name: "Cooling Loop Recirculation Pump",
      sector: "Sector B - Secondary Manifold",
      status: incidents.find(i => i.machineId === "PMP-02" && i.status === "Active") ? "Anomalous" : "Standard",
      incidentId: incidents.find(i => i.machineId === "PMP-02")?.id || null,
      sensor: "Flow-4",
      temp: "58.2°C",
      vibration: "Cavitation Anomaly Detected",
      subsystems: ["Primary Manifold Block", "Auxiliary Diverter Valve", "Thermal Heat Exchanger"],
      specs: {
        throughput: "185 gal/min",
        dutyCycle: "74.1%",
        efficiency: "68%"
      }
    },
    "RBT-01": {
      name: "Robotic Assembly Alignment Arm",
      sector: "Sector C - Assembly Line 1",
      status: incidents.find(i => i.machineId === "RBT-01" && i.status === "Active") ? "Anomalous" : "Standard",
      incidentId: incidents.find(i => i.machineId === "RBT-01")?.id || null,
      sensor: "Gyro-2",
      temp: "34.5°C",
      vibration: "Angular Calibration Drift",
      subsystems: ["Axis-4 Rotary Resolver", "Mechanical End-Effector", "Vision alignment array"],
      specs: {
        throughput: "112 units/hr",
        dutyCycle: "85.8%",
        efficiency: "94%"
      }
    }
  };

  const asset = assetDetails[selectedAsset];
  const linePosition = incidents.find(i => i.machineId === selectedAsset)?.linePosition;

  return (
    <div className="p-6 md:p-8 space-y-6 overflow-y-auto h-full custom-scrollbar bg-surface-dim">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">Digital Triplet Mirror</h2>
        <p className="text-on-surface-variant text-xs mt-0.5">
          Interactive full-stack telemetry mirror syncing Physical, Cyber, and Intention Layers of active plant hardware.
        </p>
      </div>

      {/* Asset Grid Map */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PHYSICAL PLANT SCHEMATIC SECTOR SELECTOR */}
        <div className="md:col-span-1 bg-surface border border-surface-highest rounded p-5 space-y-4 shadow-xs">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold font-mono">
            Plant Assets Directory
          </span>

          <div className="space-y-3">
            {(Object.keys(assetDetails) as Array<"CNV-04" | "PMP-02" | "RBT-01">).map((key) => {
              const info = assetDetails[key];
              const isSelected = key === selectedAsset;
              const isAnomalous = info.status === "Anomalous";

              return (
                <button
                  key={key}
                  onClick={() => setSelectedAsset(key)}
                  className={`w-full text-left p-4 rounded border transition-all space-y-2 cursor-pointer relative overflow-hidden ${
                    isSelected 
                      ? "bg-primary-container border-[#0052cc]/30 text-on-surface" 
                      : "bg-white border-surface-highest hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-mono font-bold ${isSelected ? "text-[#0052cc]" : "text-on-surface-variant"}`}>{key}</span>
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                      isAnomalous 
                        ? "bg-[#ffeef0] text-[#d73a49] border border-[#f9c2c9]" 
                        : "bg-[#e6ffed] text-[#22863a] border border-[#acf2bd]"
                    }`}>
                      {info.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs">{info.name}</h4>
                    <p className="text-[10px] text-on-surface-variant font-mono">{info.sector}</p>
                  </div>

                  {/* Visual layout node representation */}
                  <div className="flex gap-1.5 pt-2">
                    <span className="h-1 w-8 rounded bg-[#0366d6]"></span>
                    <span className={`h-1 w-8 rounded ${isAnomalous ? "bg-[#d73a49] animate-pulse" : "bg-[#22863a]"}`}></span>
                    <span className="h-1 w-8 rounded bg-[#0052cc]"></span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* DETAILED DIGITAL TWIN MONITORING ROOM */}
        <div className="md:col-span-2 bg-surface border border-surface-highest rounded p-6 space-y-6 shadow-xs">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-highest pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#0052cc] bg-[#ebf2ff] px-2 py-0.5 rounded border border-[#c8e1ff]">
                  {selectedAsset}
                </span>
                <h3 className="font-bold text-sm text-on-surface">{asset.name}</h3>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">{asset.sector}</p>
            </div>

            {asset.incidentId && (
              <button
                onClick={() => {
                  if (asset.incidentId) {
                    onSelectIncident(asset.incidentId);
                    onNavigate("collaborativeFeed");
                  }
                }}
                className="bg-[#ebf2ff] hover:bg-[#d2e3fc] border border-[#c8e1ff] text-[#0052cc] px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
              >
                <Activity className="h-3.5 w-3.5" />
                Inspect Feed Timeline
              </button>
            )}
          </div>

          {/* Core Mirror Layering Visualizer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* PHYSICAL LAYERING CARD */}
            <div className="border border-surface-highest rounded bg-surface-container p-4 space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-[#0052cc] font-bold font-mono block">
                [01] Physical Mirror
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Temperature:</span>
                  <span className="font-bold text-on-surface">{asset.temp}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Active Sensor:</span>
                  <span className="font-bold text-on-surface">{asset.sensor}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Duty Cycle:</span>
                  <span className="font-bold text-on-surface">{asset.specs.dutyCycle}</span>
                </div>
                {linePosition !== undefined && (
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Line Position:</span>
                    <span className="font-bold text-on-surface">Pos {linePosition}</span>
                  </div>
                )}
              </div>
            </div>

            {/* CYBER LAYERING CARD */}
            <div className="border border-surface-highest rounded bg-surface-container p-4 space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-[#0366d6] font-bold font-mono block">
                [02] Cyber Mirror
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Throughput:</span>
                  <span className="font-bold text-on-surface">{asset.specs.throughput}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Efficiency:</span>
                  <span className="font-bold text-on-surface">{asset.specs.efficiency}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Diagnostics:</span>
                  <span className={`font-bold ${asset.status === "Anomalous" ? "text-[#d73a49]" : "text-[#22863a]"}`}>
                    {asset.status === "Anomalous" ? "Deviation" : "Standard"}
                  </span>
                </div>
              </div>
            </div>

            {/* INTENTION LAYERING CARD */}
            <div className="border border-[#c8e1ff] rounded bg-[#ebf2ff] p-4 space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-[#0052cc] font-bold font-mono block">
                [03] Intention Layer
              </span>
              <p className="text-[11px] text-on-surface-variant leading-relaxed italic">
                {asset.status === "Anomalous" 
                  ? "AI Engine is recommending timing gate and torque modifications to maintain optimal duty cycles." 
                  : "All parameters aligned with shift target benchmarks. Continuously tracking variance."}
              </p>
            </div>

          </div>

          {/* Subsystems Map list */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-mono font-bold text-on-surface-variant uppercase tracking-wider">
              Component Modular Subsystems Map
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {asset.subsystems.map((sub, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded border border-surface-highest bg-surface-container flex items-center gap-2.5 text-xs text-on-surface font-semibold"
                >
                  <div className="h-2 w-2 rounded-full bg-[#0052cc] shrink-0"></div>
                  {sub}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
