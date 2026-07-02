export interface ChartPoint {
  time: string;
  value: number;
}

export interface Message {
  id: string;
  sender: string;
  role: "Logistics" | "Quality" | "Maintenance" | "AI Agent" | "Operator";
  avatar: string;
  timestamp: string;
  text: string;
}

export interface Incident {
  id: string;
  title: string;
  tags: string[];
  severity: "Critical" | "Urgent" | "Warning" | "Info";
  detected: string;
  status: "Active" | "Resolved";
  machineId: string;
  sensorId: string;
  temp: number;
  errorCode: string;
  batchNo: string;
  latency: number;
  linePosition?: number;
  chartData: ChartPoint[];
  rationale: string;
  messages: Message[];
  expertRequired: string;
}

export interface KnowledgeNode {
  id: string;
  title: string;
  category: string;
  summary: string;
  tags: string[];
}

export interface ControlStats {
  resolved: number;
  lessons: number;
  stopMinutesPrevented: number;
}
