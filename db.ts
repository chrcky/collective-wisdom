import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
  console.log('Initializing Firebase Admin using local service account key...');
  initializeApp({
    credential: cert(serviceAccountPath),
  });
} else {
  console.log('Local service account key not found. Initializing Firebase Admin with Application Default Credentials (ADC)...');
  initializeApp();
}

export const db = getFirestore();
console.log('Firebase Admin and Firestore initialized successfully!');

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
  createdAt: string; // ISO string for sorting
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

// Default Seed Data
const defaultStats: ControlStats = {
  resolved: 124,
  lessons: 89,
  stopMinutesPrevented: 4500,
};

const defaultKnowledgeNodes: KnowledgeNode[] = [
  {
    id: "K-101",
    title: "Conveyor Belt Overload Protocol",
    category: "Maintenance",
    summary: "When motor drag exceeds 110%, check drive belt tension and verify that gate timing logic compensates for batch friction. Standard offset is T-minus 150ms.",
    tags: ["conveyor", "motor", "calibration"],
  },
  {
    id: "K-102",
    title: "Thermal Excursion Recovery in Pumps",
    category: "Safety",
    summary: "In the event of pump thermal drift (>55°C), route primary coolant via the auxiliary block-2 manifold and lower speed to 60%. Cavitation is avoided by bleeding air valves.",
    tags: ["pump", "coolant", "thermal"],
  },
  {
    id: "K-103",
    title: "Robot Arm Multi-Axis Zero Point Correction",
    category: "Calibration",
    summary: "Coordinate drift usually originates from axis-4 resolver heating. Zero-point calibration offsets must be applied during line clearance windows using automated script CAL-08.",
    tags: ["robotics", "calibration", "drift"],
  },
  {
    id: "K-104",
    title: "Pneumatic Pressure Droop Diagnostics",
    category: "Logistics",
    summary: "Main header pressure droop is typically caused by regulator diaphragm leakage on assembly bay 3. Check localized supply filters before restarting compressor sequence.",
    tags: ["pneumatic", "pressure", "leak"],
  },
];

const defaultIncidents: Incident[] = [
  {
    id: "#CNV-492",
    title: "Inbound Conveyor Jam - Line 3",
    tags: ["Production", "Logistics"],
    severity: "Critical",
    detected: "14:22 PM",
    status: "Active",
    machineId: "CNV-04",
    sensorId: "Prox-9",
    temp: 42.8,
    errorCode: "E-104",
    batchNo: "#4402",
    latency: 240,
    linePosition: 3,
    chartData: [
      { time: "T-10m", value: 25 },
      { time: "T-8m", value: 40 },
      { time: "T-6m", value: 60 },
      { time: "T-4m", value: 80 },
      { time: "T-2m", value: 115 },
      { time: "Now", value: 90 },
    ],
    rationale: "Recalibration of timing logic to prevent motor overload. Shifting activation window 200ms earlier to compensate for conveyor friction at high-speed throughput.",
    expertRequired: "Knowledge Node for motor overload requires verification from 'Line 3 Supervisor'.",
    messages: [
      {
        id: "m1",
        sender: "Mark",
        role: "Logistics",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        timestamp: "14:25 PM",
        text: "Sensors at Section 4 are reporting a persistent motor drag. It looks like the drive belt might be misaligned after the batch switch. Anyone from Quality seeing timing issues?",
      },
      {
        id: "m2",
        sender: "Sara",
        role: "Quality",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        timestamp: "14:38 PM",
        text: "Confirmed, Mark. The timing logic for the gate is firing 200ms too late for Batch #4402. If we recalibrate the logic to T-minus 150ms relative to the switch trigger, we should bypass the slippage.",
      },
    ],
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
  },
  {
    id: "#PMP-108",
    title: "Cooling Pump Thermal Excursion - Section B",
    tags: ["Maintenance", "Safety"],
    severity: "Urgent",
    detected: "15:05 PM",
    status: "Active",
    machineId: "PMP-02",
    sensorId: "Flow-4",
    temp: 58.2,
    errorCode: "W-202",
    batchNo: "#4402",
    latency: 120,
    linePosition: 2,
    chartData: [
      { time: "T-10m", value: 85 },
      { time: "T-8m", value: 80 },
      { time: "T-6m", value: 65 },
      { time: "T-4m", value: 45 },
      { time: "T-2m", value: 30 },
      { time: "Now", value: 18 },
    ],
    rationale: "Initiating emergency bypass loop to route coolant through auxiliary cooling manifold. Throttling pump cycle down to 60% of max output to prevent critical motor failure.",
    expertRequired: "Thermal drift limits require override confirmation from 'Maintenance Chief'.",
    messages: [
      {
        id: "m3",
        sender: "Dave",
        role: "Maintenance",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        timestamp: "15:10 PM",
        text: "Flow rate in Section B is dropping significantly. Over-temp warning is beginning to flash on the heat exchanger. It seems we have a cavitation issue.",
      },
    ],
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
  },
  {
    id: "#RBT-211",
    title: "Robotic Arm Angular Drift - Line 1 Assembly",
    tags: ["Assembly", "Quality"],
    severity: "Warning",
    detected: "16:12 PM",
    status: "Active",
    machineId: "RBT-01",
    sensorId: "Gyro-2",
    temp: 34.5,
    errorCode: "C-088",
    batchNo: "#4403",
    latency: 180,
    linePosition: 1,
    chartData: [
      { time: "T-10m", value: 0.1 },
      { time: "T-8m", value: 0.15 },
      { time: "T-6m", value: 0.32 },
      { time: "T-4m", value: 0.48 },
      { time: "T-2m", value: 0.61 },
      { time: "Now", value: 0.75 },
    ],
    rationale: "Drift is minor but trending upwards. Recalibration of robotic zero-point offsets scheduled during the next batch gap (approx 8 minutes).",
    expertRequired: "Mechanical zero alignment needs validation from shift 'Line 1 Supervisor'.",
    messages: [
      {
        id: "m4",
        sender: "Helen",
        role: "Quality",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        timestamp: "16:15 PM",
        text: "Visual quality system is flagging minor cosmetic gap deviations on the casing seams. High probability of end-effector mechanical wear.",
      },
    ],
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
  },
];

// Seed DB function
export async function seedDatabaseIfEmpty() {
  try {
    // 1. Check & Seed Stats
    const statsDocRef = db.collection('stats').doc('global');
    const statsDoc = await statsDocRef.get();
    if (!statsDoc.exists) {
      console.log('Seeding global stats...');
      await statsDocRef.set(defaultStats);
    }

    // 2. Check & Seed Knowledge Nodes
    const knowledgeSnap = await db.collection('knowledge').limit(1).get();
    if (knowledgeSnap.empty) {
      console.log('Seeding knowledge nodes...');
      const batch = db.batch();
      for (const node of defaultKnowledgeNodes) {
        const docRef = db.collection('knowledge').doc(node.id);
        batch.set(docRef, node);
      }
      await batch.commit();
    }

    // 3. Check & Seed Incidents
    const incidentsSnap = await db.collection('incidents').limit(1).get();
    if (incidentsSnap.empty) {
      console.log('Seeding incidents...');
      const batch = db.batch();
      for (const incident of defaultIncidents) {
        const docRef = db.collection('incidents').doc(incident.id);
        batch.set(docRef, incident);
      }
      await batch.commit();
    }

    console.log('Database verification & seeding completed.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Database Actions
export async function getStats(): Promise<ControlStats> {
  const doc = await db.collection('stats').doc('global').get();
  if (doc.exists) {
    return doc.data() as ControlStats;
  }
  return defaultStats;
}

export async function incrementStats(resolvedDiff: number, lessonsDiff: number, stopMinutesPreventedDiff: number) {
  const statsDocRef = db.collection('stats').doc('global');
  await statsDocRef.update({
    resolved: FieldValue.increment(resolvedDiff),
    lessons: FieldValue.increment(lessonsDiff),
    stopMinutesPrevented: FieldValue.increment(stopMinutesPreventedDiff),
  });
}

export async function getIncidents(): Promise<Incident[]> {
  const snapshot = await db.collection('incidents').orderBy('createdAt', 'desc').get();
  const incidents: Incident[] = [];
  snapshot.forEach((doc) => {
    incidents.push(doc.data() as Incident);
  });
  return incidents;
}

export async function getIncidentById(id: string): Promise<Incident | null> {
  const doc = await db.collection('incidents').doc(id).get();
  if (doc.exists) {
    return doc.data() as Incident;
  }
  return null;
}

export async function createIncident(incident: Incident): Promise<void> {
  await db.collection('incidents').doc(incident.id).set(incident);
}

export async function updateIncidentFields(id: string, fields: Partial<Incident>): Promise<void> {
  await db.collection('incidents').doc(id).update(fields);
}

export async function addMessageToIncident(id: string, message: Message): Promise<void> {
  await db.collection('incidents').doc(id).update({
    messages: FieldValue.arrayUnion(message),
  });
}

export async function getKnowledge(): Promise<KnowledgeNode[]> {
  const snapshot = await db.collection('knowledge').get();
  const nodes: KnowledgeNode[] = [];
  snapshot.forEach((doc) => {
    nodes.push(doc.data() as KnowledgeNode);
  });
  return nodes;
}

export async function createKnowledgeNode(node: KnowledgeNode): Promise<void> {
  await db.collection('knowledge').doc(node.id).set(node);
  // Also increment lessons learned statistic
  await incrementStats(0, 1, 0);
}
