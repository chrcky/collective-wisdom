import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { Type } from "@google/genai";
import { Gemini as AdkGemini, LlmAgent as AdkLlmAgent, InMemoryRunner as AdkInMemoryRunner, stringifyContent } from "@google/adk";
import {
  seedDatabaseIfEmpty,
  getStats,
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncidentFields,
  addMessageToIncident,
  getKnowledge,
  createKnowledgeNode,
  incrementStats,
  Incident,
  Message,
  KnowledgeNode
} from "./db";

dotenv.config();

// Initialize Google ADK model wrapper
const adkModel = new AdkGemini({
  apiKey: process.env.GEMINI_API_KEY || "",
});

// Helper to execute agent programmatically using Google ADK
async function runAdkAgent(agent: AdkLlmAgent, prompt: string): Promise<string> {
  const runner = new AdkInMemoryRunner({
    agent,
    appName: "collective-wisdom",
  });

  const session = await runner.sessionService.createSession({
    userId: "operator",
    appName: "collective-wisdom",
  });

  const runStream = runner.runAsync({
    userId: "operator",
    sessionId: session.id,
    newMessage: {
      role: "user",
      parts: [{ text: prompt }],
    },
  });

  let textResponse = "";
  for await (const event of runStream) {
    if (event.errorCode) {
      throw new Error(`[ADK Error ${event.errorCode}] ${event.errorMessage}`);
    }
    const chunk = stringifyContent(event);
    if (chunk) {
      textResponse += chunk;
    }
  }
  return textResponse;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Wait for Database to seed if empty
  console.log("Verifying Firestore database state...");
  await seedDatabaseIfEmpty();

  // API - Get stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await getStats();
      res.json(stats);
    } catch (err: any) {
      console.error("Error fetching stats:", err);
      res.status(500).json({ error: err.message || "Failed to fetch stats" });
    }
  });

  // API - Get all incidents
  app.get("/api/incidents", async (req, res) => {
    try {
      const incidentsList = await getIncidents();
      res.json(incidentsList);
    } catch (err: any) {
      console.error("Error fetching incidents:", err);
      res.status(500).json({ error: err.message || "Failed to fetch incidents" });
    }
  });

  // API - Create new incident
  app.post("/api/incidents", async (req, res) => {
    try {
      const { title, severity, tags, machineId, sensorId, linePosition } = req.body;
      const newId = `#${machineId.split("-")[0] || "INC"}-${Math.floor(100 + Math.random() * 900)}`;
      const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newIncident: Incident = {
        id: newId,
        title: title || "New Shift Report",
        severity: severity || "Info",
        tags: tags || ["General"],
        detected: timestampStr,
        status: "Active",
        machineId: machineId || "CNV-01",
        sensorId: sensorId || "Sens-1",
        temp: 35.0,
        errorCode: "OK-000",
        batchNo: "#4402",
        latency: 45,
        linePosition: linePosition ? Number(linePosition) : undefined,
        chartData: [
          { time: "T-10m", value: 30 },
          { time: "T-8m", value: 32 },
          { time: "T-6m", value: 31 },
          { time: "T-4m", value: 35 },
          { time: "T-2m", value: 42 },
          { time: "Now", value: 45 },
        ],
        rationale: "Awaiting primary diagnostic sequence from automated supervisory control loop.",
        expertRequired: `Pending triage evaluation. Requires review from shift supervisor.`,
        messages: [
          {
            id: `m_${Date.now()}`,
            sender: "Shift Supervisor",
            role: "Operator",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            timestamp: timestampStr,
            text: `Opened new operational incident. Machine target: ${machineId}, Sensor stream: ${sensorId}${linePosition ? `, Line position: ${linePosition}` : ""}.`,
          },
        ],
        createdAt: new Date().toISOString(),
      };

      await createIncident(newIncident);
      res.status(201).json(newIncident);
    } catch (err: any) {
      console.error("Error creating incident:", err);
      res.status(500).json({ error: err.message || "Failed to create incident" });
    }
  });

  // API - Add message to incident
  app.post("/api/incidents/:id/messages", async (req, res) => {
    const { id } = req.params;
    const { sender, role, text } = req.body;

    try {
      const incident = await getIncidentById(id);
      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }

      const newMessage: Message = {
        id: `m_${Date.now()}`,
        sender: sender || "Operator",
        role: role || "Operator",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: text,
      };

      await addMessageToIncident(id, newMessage);
      res.status(201).json(newMessage);
    } catch (err: any) {
      console.error("Error adding message:", err);
      res.status(500).json({ error: err.message || "Failed to add message" });
    }
  });

  // API - Resolve incident
  app.post("/api/incidents/:id/resolve", async (req, res) => {
    const { id } = req.params;

    try {
      const incident = await getIncidentById(id);
      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }

      if (incident.status !== "Resolved") {
        const stopMinutes = Math.floor(120 + Math.random() * 300);
        const resolvedMessage: Message = {
          id: `m_${Date.now()}`,
          sender: "System Operator",
          role: "Operator",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: "✅ Resolution logic confirmed. Applying set-points and updating knowledge logs. Safe operational window restored.",
        };

        const updatedMessages = [...incident.messages, resolvedMessage];

        await updateIncidentFields(id, {
          status: "Resolved",
          messages: updatedMessages,
        });

        // Increment stats: resolved + 1, lessons + 1, prevented minutes
        await incrementStats(1, 1, stopMinutes);

        // Fetch and return the fully updated incident
        const updatedIncident = await getIncidentById(id);
        return res.json(updatedIncident);
      }

      res.json(incident);
    } catch (err: any) {
      console.error("Error resolving incident:", err);
      res.status(500).json({ error: err.message || "Failed to resolve incident" });
    }
  });

  // API - Get knowledge nodes
  app.get("/api/knowledge", async (req, res) => {
    try {
      const knowledge = await getKnowledge();
      res.json(knowledge);
    } catch (err: any) {
      console.error("Error fetching knowledge:", err);
      res.status(500).json({ error: err.message || "Failed to fetch knowledge nodes" });
    }
  });

  // API - Gemini AI operator assistant / diagnostics agent
  app.post("/api/agent/analyze", async (req, res) => {
    const { incidentId, userPrompt } = req.body;

    try {
      const incident = await getIncidentById(incidentId);
      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }

      // Prepare context for Gemini
      const systemInstruction = `You are "Gemini Operator" or "AI Diagnostic Core", a superintelligent assistant integrated into the CW-Room plant control console. 
You assist human operators in analyzing machine anomalies, suggesting concrete recalibration logic, and diagnosing telemetry trends.
Structure your reply to be highly professional, technical, and concrete (e.g. referencing physical components like belt drives, fluid manifolds, cavitation, resolved offsets, resolve code, error limits). 
Avoid flowery or sales-pitch language. Speak with engineering authority. 

You must return a JSON response with the following keys:
- "analysis": A short, 1-2 sentence engineering diagnosis of the physical and cyber layers based on the telemetry and user question.
- "recalibrationProposal": A direct timing, calibration, or operational suggestion (under 25 words).
- "tempOffset": A predicted next temperature sensor value (number, e.g. 40.5).
- "errorCode": A suggested or updated Hex-style Error code (string, e.g. "E-104").
- "latency": A predicted next processing latency in ms (number, e.g. 210).
- "comment": An elegant, highly professional operational chat message (1-2 sentences) that the AI core will post to the discussion thread.
- "lessonsLearned": An optional short operational lesson learned to save as a knowledge node (if you extracted an important procedural insight).`;

      const chatHistory = incident.messages
        .map((m) => `${m.sender} (${m.role}): ${m.text}`)
        .join("\n");

      const prompt = `Incident Details:
ID: ${incident.id}
Title: ${incident.title}
Severity: ${incident.severity}
Detected: ${incident.detected}
Machine ID: ${incident.machineId}
Sensor ID: ${incident.sensorId}
Current Temp: ${incident.temp}°C
Current Error: ${incident.errorCode}
Batch: ${incident.batchNo}
Latency: ${incident.latency}ms
Telemetry Chart Values: ${JSON.stringify(incident.chartData)}

Recent Operator Discussion:
${chatHistory}

Human operator prompt or query:
"${userPrompt || "Core diagnostic analysis requested based on current live sensor stream."}"

Analyze the parameters and return a structured JSON response matching the required schema keys.`;

      if (!process.env.GEMINI_API_KEY) {
        // Fallback mock model reasoning if key is missing (graceful fallback)
        const mockResponse = {
          analysis: "Neural network detects mechanical slipping matching high torque load on the main shaft. Peak friction load has reached 115%.",
          recalibrationProposal: "Recalibrate the timing gate activation window 200ms earlier to compensate for mechanical load friction.",
          tempOffset: Math.round((incident.temp - 1.2) * 10) / 10,
          errorCode: incident.severity === "Critical" ? "E-104" : "W-202",
          latency: Math.max(45, Math.floor(incident.latency * 0.9)),
          comment: `[AI Agent Analysis] Drive belt slippage identified on ${incident.machineId}. Recommend shifting timing trigger by -150ms to align with batch clearance speed and bypass overload spikes.`,
          lessonsLearned: `During high throughput of Batch #4402 on CNV-04, mechanical conveyor slippage can trigger drive belt thermal load spikes. Shift gate activation timing offset by -150ms to route load timing dynamically.`,
        };

        const aiMessage: Message = {
          id: `ai_${Date.now()}`,
          sender: "Gemini Core",
          role: "AI Agent",
          avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: mockResponse.comment,
        };

        // Create knowledge node from lessons learned mock fallback if it is a new insight
        const newKnowledgeNodeId = `K-${Math.floor(105 + Math.random() * 895)}`;
        const mockNode: KnowledgeNode = {
          id: newKnowledgeNodeId,
          title: `Friction Compensation on ${incident.machineId}`,
          category: "Calibration",
          summary: mockResponse.lessonsLearned,
          tags: ["conveyor", "slippage", "recalibration"],
        };

        await createKnowledgeNode(mockNode);

        await updateIncidentFields(incidentId, {
          rationale: mockResponse.recalibrationProposal,
          temp: mockResponse.tempOffset,
          errorCode: mockResponse.errorCode,
          latency: mockResponse.latency,
          messages: [...incident.messages, aiMessage],
        });

        const updatedIncident = await getIncidentById(incidentId);
        return res.json({ success: true, analysis: mockResponse, incident: updatedIncident, fallback: true });
      }

      const diagnosticsAgent = new AdkLlmAgent({
        name: "diagnostics-agent",
        model: adkModel,
        instruction: systemInstruction,
        generateContentConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: { type: Type.STRING },
              recalibrationProposal: { type: Type.STRING },
              tempOffset: { type: Type.NUMBER },
              errorCode: { type: Type.STRING },
              latency: { type: Type.INTEGER },
              comment: { type: Type.STRING },
              lessonsLearned: { type: Type.STRING },
            },
            required: ["analysis", "recalibrationProposal", "tempOffset", "errorCode", "latency", "comment"],
          },
        },
      });

      let resultText = "";
      try {
        resultText = await runAdkAgent(diagnosticsAgent, prompt);
      } catch (adkErr: any) {
        console.warn("ADK diagnostics agent failed, triggering graceful mock fallback:", adkErr);
        // Execute fallback mock response if API fails (such as 429 quota depletion)
        const mockResponse = {
          analysis: "Neural network detects mechanical slipping matching high torque load on the main shaft. Peak friction load has reached 115%.",
          recalibrationProposal: "Recalibrate the timing gate activation window 200ms earlier to compensate for mechanical load friction.",
          tempOffset: Math.round((incident.temp - 1.2) * 10) / 10,
          errorCode: incident.severity === "Critical" ? "E-104" : "W-202",
          latency: Math.max(45, Math.floor(incident.latency * 0.9)),
          comment: `[AI Agent Analysis] Drive belt slippage identified on ${incident.machineId}. Recommend shifting timing trigger by -150ms to align with batch clearance speed and bypass overload spikes.`,
          lessonsLearned: `During high throughput of Batch #4402 on CNV-04, mechanical conveyor slippage can trigger drive belt thermal load spikes. Shift gate activation timing offset by -150ms to route load timing dynamically.`,
        };

        const aiMessage: Message = {
          id: `ai_${Date.now()}`,
          sender: "Gemini Core",
          role: "AI Agent",
          avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: mockResponse.comment,
        };

        const newKnowledgeNodeId = `K-${Math.floor(105 + Math.random() * 895)}`;
        const mockNode: KnowledgeNode = {
          id: newKnowledgeNodeId,
          title: `Friction Compensation on ${incident.machineId}`,
          category: "Calibration",
          summary: mockResponse.lessonsLearned,
          tags: ["conveyor", "slippage", "recalibration"],
        };

        await createKnowledgeNode(mockNode);

        await updateIncidentFields(incidentId, {
          rationale: mockResponse.recalibrationProposal,
          temp: mockResponse.tempOffset,
          errorCode: mockResponse.errorCode,
          latency: mockResponse.latency,
          messages: [...incident.messages, aiMessage],
        });

        const updatedIncident = await getIncidentById(incidentId);
        return res.json({ success: true, analysis: mockResponse, incident: updatedIncident, fallback: true });
      }

      const resultJson = JSON.parse(resultText.trim());

      // Append the automated AI response
      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        sender: "Gemini Core",
        role: "AI Agent",
        avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: resultJson.comment,
      };

      const updateData: Partial<Incident> = {
        rationale: resultJson.recalibrationProposal || incident.rationale,
        temp: resultJson.tempOffset || incident.temp,
        errorCode: resultJson.errorCode || incident.errorCode,
        latency: resultJson.latency || incident.latency,
        messages: [...incident.messages, aiMessage],
      };

      await updateIncidentFields(incidentId, updateData);

      // If a lesson was learned, store it as a Knowledge Node
      if (resultJson.lessonsLearned) {
        const newKnowledgeNodeId = `K-${Math.floor(105 + Math.random() * 895)}`;
        const newNode: KnowledgeNode = {
          id: newKnowledgeNodeId,
          title: `Synthesis: ${incident.title} Resolution`,
          category: incident.tags[0] || "Safety",
          summary: resultJson.lessonsLearned,
          tags: [...incident.tags, "automated-insight"],
        };
        await createKnowledgeNode(newNode);
      }

      const updatedIncident = await getIncidentById(incidentId);
      res.json({ success: true, analysis: resultJson, incident: updatedIncident });
    } catch (err: any) {
      console.error("Gemini core diagnostics execution failure:", err);
      res.status(500).json({ error: err.message || "Failed to generate AI reasoning" });
    }
  });

  // API - Custom Knowledge Search & Synthesis via Gemini
  app.post("/api/agent/query-knowledge", async (req, res) => {
    const { query } = req.body;

    try {
      const knowledgeNodes = await getKnowledge();

      const systemInstruction = `You are a plant logistics and safety system analyst. 
You can access the operating manuals and historical repair records. 
Answer the operator's question concisely based on the manuals. 
Support the answer with precise steps, troubleshooting rules, and diagnostic numbers.`;

      const manualsContext = knowledgeNodes
        .map((node) => `ID: ${node.id} [${node.category}] - ${node.title}\nSummary: ${node.summary}\nTags: ${node.tags.join(", ")}`)
        .join("\n\n");

      const prompt = `Available manuals and historical incidents:
${manualsContext}

User query:
"${query}"

Synthesize an expert advice report for this operator query. If the query does not match any manual, generalize using logical industrial engineering principles but mention the limitation of historical logs.`;

      if (!process.env.GEMINI_API_KEY) {
        // Mock fallback
        const mockReply = `According to our standard operational logs, the best matches involve zero-point mechanical calibrations or thermal management manifolds. If you are experiencing motor friction drag, inspect conveyor belts and apply a timing adjustment coefficient of -150ms relative to switch triggers. For cavitation, throttle pressure down to 60%.`;
        return res.json({ answer: mockReply, fallback: true });
      }

      const knowledgeAgent = new AdkLlmAgent({
        name: "knowledge-agent",
        model: adkModel,
        instruction: systemInstruction,
      });

      let answer = "";
      try {
        answer = await runAdkAgent(knowledgeAgent, prompt);
      } catch (adkErr: any) {
        console.warn("ADK knowledge agent failed, triggering graceful mock fallback:", adkErr);
        const mockReply = `According to our standard operational logs, the best matches involve zero-point mechanical calibrations or thermal management manifolds. If you are experiencing motor friction drag, inspect conveyor belts and apply a timing adjustment coefficient of -150ms relative to switch triggers. For cavitation, throttle pressure down to 60%.`;
        return res.json({ answer: mockReply, fallback: true });
      }

      res.json({ answer });
    } catch (err: any) {
      console.error("Gemini knowledge search failed:", err);
      res.status(500).json({ error: err.message || "Gemini processing exception" });
    }
  });

  // Vite Integration for client and build bundle
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`collective-wisdom Server running on http://localhost:${PORT}`);
  });
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
startServer();
